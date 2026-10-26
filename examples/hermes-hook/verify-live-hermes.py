#!/usr/bin/env python3
"""Actual Hermes AIAgent session with a deterministic loopback provider, no model/API spend.
Run with the Python environment containing the pinned Hermes checkout; --output is optional.
This tests runtime dispatch and consent, not autonomous reasoning or the Hermes CLI gateway.
"""
import argparse
import contextlib
import io
import json
import os
import shlex
import sys
from pathlib import Path
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# Assertions below are evidence checks, so never allow Python to optimize them away.
if sys.flags.optimize:
    raise SystemExit('Run without -O or PYTHONOPTIMIZE: verification requires assertions.')

parser = argparse.ArgumentParser()
parser.add_argument('--output')
args = parser.parse_args()
example = Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='atp-hermes-') as directory:
    home = Path(directory)
    sentinel = home / 'must-not-exist'
    trace = home / 'hook-output.jsonl'
    wrapper = home / 'audit-hook.mjs'
    wrapper.write_text("import {readFileSync,appendFileSync} from 'node:fs';\n"
        "import {spawnSync} from 'node:child_process';\n"
        "const input=readFileSync(0,'utf8');\n"
        f"const r=spawnSync(process.execPath,[{json.dumps(str(example / 'atp-hook.mjs'))}],{{input,encoding:'utf8'}});\n"
        "if(r.error||r.status!==0)process.exit(2);\n"
        f"appendFileSync({json.dumps(str(trace))},JSON.stringify({{tool:JSON.parse(input).tool_name,response:JSON.parse(r.stdout)}})+'\\n');\n"
        "process.stdout.write(r.stdout);\n")
    command = f'node {shlex.quote(str(wrapper))}'
    config = {'hooks': {'pre_tool_call': [{'matcher': '^(read_file|terminal|write_file|patch)$', 'command': command, 'timeout': 10, 'fail_closed': True}]}}
    (home / 'config.yaml').write_text(json.dumps(config))
    os.environ.update(HERMES_HOME=str(home), TERMINAL_ENV='local', NO_PROXY='127.0.0.1,localhost', no_proxy='127.0.0.1,localhost')

    class Provider(BaseHTTPRequestHandler):
        def log_message(self, *unused): pass
        def do_POST(self):
            request = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            results = [m for m in request.get('messages', []) if m.get('role') == 'tool']
            calls = [
                ('read_file', {'path': str(example / 'fixture.txt')}),
                ('terminal', {'command': f'printf should-not-run > {shlex.quote(str(sentinel))}'})]
            tool = None
            if len(results) < len(calls):
                name, arguments = calls[len(results)]
                tool = {'id': f'call_{len(results)}', 'type': 'function', 'function': {'name': name, 'arguments': json.dumps(arguments)}}
            message = {'role': 'assistant', 'content': None if tool else 'Deterministic ATP runtime probe complete.'}
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
                obj = dict(base, object='chat.completion', choices=[{'index': 0, 'message': message, 'finish_reason': 'tool_calls' if tool else 'stop'}], usage={'prompt_tokens': 1, 'completion_tokens': 1, 'total_tokens': 2})
                self.wfile.write(json.dumps(obj).encode())
            self.wfile.flush()

    server = HTTPServer(('127.0.0.1', 0), Provider)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        from agent.shell_hooks import register_from_config
        # Same documented explicit accept-hooks consent path; only this temporary profile has a hook.
        register_from_config(config, accept_hooks=True, interactive=False)
        from run_agent import AIAgent
        import run_agent
        source = Path(run_agent.__file__).resolve().parent
        commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
        with contextlib.redirect_stdout(io.StringIO()):
            agent = AIAgent(model='atp-scripted-fixture', provider='custom', api_mode='chat_completions',
                base_url=f'http://127.0.0.1:{server.server_port}/v1', api_key='local-fixture', max_iterations=6,
                enabled_toolsets=['terminal', 'file'], skip_context_files=True, skip_memory=True,
                skip_background_review=True, cwd=str(example))
            result = agent.run_conversation('Exercise the read and terminal calls from the local fixture provider.')
        assert result['completed'] and not result.get('failed'), 'Hermes session did not complete'
        messages = [m for m in result['messages'] if m.get('role') == 'tool']
        assert len(messages) == 2
        read = json.loads(messages[0]['content'])
        block = json.loads(messages[1]['content'])
        assert 'ATP fixed read fixture.' in read['content']
        assert block['error'] == 'ATP: terminal requires a separate approval or is denied'
        assert not sentinel.exists(), 'Blocked command executed'
        outputs = [json.loads(line) for line in trace.read_text().splitlines()]
        assert outputs[0] == {'tool': 'read_file', 'response': {}}
        assert outputs[1]['tool'] == 'terminal' and outputs[1]['response']['action'] == 'block'
        assert (home / 'shell-hooks-allowlist.json').exists(), 'Consent was not persisted'
        evidence = {'hermesCommit': commit, 'python': __import__('platform').python_version(),
            'mode': 'actual Hermes AIAgent session; deterministic local provider; no autonomous model reasoning; no CLI gateway claim',
            'consent': 'register_from_config accept_hooks=True in an isolated temporary profile; allowlist persisted',
            'hookOutputs': outputs, 'allowedReadExecuted': True, 'terminalBlocked': True,
            'sentinelAbsent': True, 'sessionCompleted': True, 'providerRequests': result['api_calls']}
        rendered = json.dumps(evidence, indent=2) + '\n'
        if args.output: Path(args.output).write_text(rendered)
        print(rendered)
    finally:
        server.shutdown()
        server.server_close()
