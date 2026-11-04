#!/usr/bin/env python3
"""Run an actual Hermes AIAgent session against atp-hermes-hook, with a deterministic
loopback provider (no model download, credentials or paid API).

Run with the Python interpreter of a pinned Hermes checkout. --hook selects the hook
binary to test (default: this package's bin; CI passes the copy installed from the
packed npm tarball). This tests runtime dispatch, consent and blocking, not autonomous
model reasoning or the Hermes CLI gateway.
"""
import argparse
import contextlib
import io
import json
import os
import platform
import shlex
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

# Assertions below are evidence checks, so never allow Python to optimize them away.
if sys.flags.optimize:
    raise SystemExit('Run without -O or PYTHONOPTIMIZE: verification requires assertions.')

package = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--hook', default=str(package / 'bin' / 'atp-hermes-hook.mjs'))
parser.add_argument('--output')
args = parser.parse_args()
hook = Path(args.hook).resolve()
assert hook.is_file(), f'hook binary not found: {hook}'

with tempfile.TemporaryDirectory(prefix='atp-hermes-hook-') as directory:
    home = Path(directory).resolve()
    workspace = home / 'workspace'
    workspace.mkdir()
    (workspace / 'notes.txt').write_text('ATP scoped read fixture.\n')
    outside = home / 'outside'
    outside.mkdir()
    sentinel = home / 'terminal-must-not-run'
    written = workspace / 'agent-write.txt'
    escaped = outside / 'agent-escape.txt'

    hook_config = home / 'atp-hermes.json'
    hook_config.write_text(json.dumps({'profile': 'safe-default', 'paths': {'read': [str(workspace)]}}))

    # A recording wrapper: forwards stdin to the hook, records stdout and exit code,
    # then replays both so Hermes sees exactly what the hook produced.
    trace = home / 'hook-output.jsonl'
    wrapper = home / 'record-hook.mjs'
    wrapper.write_text(
        "import {readFileSync,appendFileSync} from 'node:fs';\n"
        "import {spawnSync} from 'node:child_process';\n"
        "const input=readFileSync(0,'utf8');\n"
        f"const r=spawnSync(process.execPath,[{json.dumps(str(hook))},'--config',{json.dumps(str(hook_config))}],{{input,encoding:'utf8'}});\n"
        "if(r.error)process.exit(3);\n"
        f"appendFileSync({json.dumps(str(trace))},JSON.stringify({{tool:JSON.parse(input).tool_name,status:r.status,response:JSON.parse(r.stdout)}})+'\\n');\n"
        "process.stdout.write(r.stdout);\n"
        "process.exit(r.status);\n")
    command = f'node {shlex.quote(str(wrapper))}'
    config = {'hooks': {'pre_tool_call': [{
        'matcher': '^(read_file|terminal|write_file|patch)$', 'command': command, 'timeout': 10, 'fail_closed': True}]}}
    (home / 'config.yaml').write_text(json.dumps(config))
    os.environ.update(HERMES_HOME=str(home), TERMINAL_ENV='local', NO_PROXY='127.0.0.1,localhost', no_proxy='127.0.0.1,localhost')

    calls = [
        ('read_file', {'path': str(workspace / 'notes.txt')}),
        ('terminal', {'command': f'printf should-not-run > {shlex.quote(str(sentinel))}'}),
        ('write_file', {'path': str(written), 'content': 'should not be written'}),
        ('read_file', {'path': str(escaped)}),
    ]

    class Provider(BaseHTTPRequestHandler):
        def log_message(self, *unused): pass
        def do_POST(self):
            request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            results = [m for m in request.get('messages', []) if m.get('role') == 'tool']
            tool = None
            if len(results) < len(calls):
                name, arguments = calls[len(results)]
                tool = {'id': f'call_{len(results)}', 'type': 'function',
                        'function': {'name': name, 'arguments': json.dumps(arguments)}}
            message = {'role': 'assistant', 'content': None if tool else 'Deterministic ATP hook probe complete.'}
            if tool: message['tool_calls'] = [tool]
            base = {'id': 'atp-local-fixture', 'created': int(time.time()), 'model': 'atp-scripted-fixture'}
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream' if request.get('stream') else 'application/json')
            self.end_headers()
            if request.get('stream'):
                delta = dict(message)
                if tool: delta['tool_calls'] = [dict(tool, index=0)]
                obj = dict(base, object='chat.completion.chunk', choices=[{'index': 0, 'delta': delta, 'finish_reason': None}])
                self.wfile.write(('data: ' + json.dumps(obj) + '\n\n').encode())
                obj['choices'] = [{'index': 0, 'delta': {}, 'finish_reason': 'tool_calls' if tool else 'stop'}]
                self.wfile.write(('data: ' + json.dumps(obj) + '\n\ndata: [DONE]\n\n').encode())
            else:
                obj = dict(base, object='chat.completion', choices=[{'index': 0, 'message': message,
                           'finish_reason': 'tool_calls' if tool else 'stop'}],
                           usage={'prompt_tokens': 1, 'completion_tokens': 1, 'total_tokens': 2})
                self.wfile.write(json.dumps(obj).encode())
            self.wfile.flush()

    server = HTTPServer(('127.0.0.1', 0), Provider)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        from agent.shell_hooks import register_from_config
        # Documented explicit accept-hooks consent path; only this temporary profile has a hook.
        register_from_config(config, accept_hooks=True, interactive=False)
        from run_agent import AIAgent
        import run_agent
        source = Path(run_agent.__file__).resolve().parent
        commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
        with contextlib.redirect_stdout(io.StringIO()):
            agent = AIAgent(model='atp-scripted-fixture', provider='custom', api_mode='chat_completions',
                base_url=f'http://127.0.0.1:{server.server_port}/v1', api_key='local-fixture', max_iterations=8,
                enabled_toolsets=['terminal', 'file'], skip_context_files=True, skip_memory=True,
                skip_background_review=True, cwd=str(workspace))
            result = agent.run_conversation('Exercise the scripted tool calls from the local fixture provider.')
        assert result['completed'] and not result.get('failed'), 'Hermes session did not complete'
        tool_messages = [json.loads(m['content']) for m in result['messages'] if m.get('role') == 'tool']
        assert len(tool_messages) == len(calls), f'expected {len(calls)} tool results, got {len(tool_messages)}'

        read, terminal, write, escape = tool_messages
        assert 'ATP scoped read fixture.' in read['content'], 'in-scope read did not execute'
        assert terminal['error'].startswith('ATP: terminal requires approval'), terminal
        assert write['error'].startswith('ATP: write_file needs filesystem write access'), write
        assert escape['error'].startswith('ATP: read_file path'), escape
        assert not sentinel.exists(), 'blocked terminal command executed'
        assert not written.exists(), 'blocked write executed'

        outputs = [json.loads(line) for line in trace.read_text().splitlines()]
        assert [o['tool'] for o in outputs] == [c[0] for c in calls]
        assert outputs[0]['status'] == 0 and outputs[0]['response'] == {}
        assert all(o['status'] == 2 and o['response']['action'] == 'block' for o in outputs[1:])
        assert (home / 'shell-hooks-allowlist.json').exists(), 'consent was not persisted'

        evidence = {
            'package': json.loads((hook.parent.parent / 'package.json').read_text())['version'],
            'hermesCommit': commit, 'python': platform.python_version(),
            'mode': 'actual Hermes AIAgent session; deterministic local provider; no autonomous model reasoning; no CLI gateway claim',
            'consent': 'register_from_config accept_hooks=True in an isolated temporary profile; allowlist persisted',
            'hookOutputs': outputs, 'inScopeReadExecuted': True, 'terminalBlocked': True,
            'writeBlocked': True, 'outOfScopeReadBlocked': True, 'sentinelAbsent': True,
            'sessionCompleted': True, 'providerRequests': result['api_calls']}
        rendered = json.dumps(evidence, indent=2) + '\n'
        if args.output: Path(args.output).write_text(rendered)
        print(rendered)
    finally:
        server.shutdown()
        server.server_close()
