# MCP (Model Context Protocol) Setup

ATP supports the Model Context Protocol (MCP) for secure AI agent communication and tooling.

## Quick Setup

### 1. Basic MCP Configuration

Add to your `mcp-config.json`:

```json
{
  "mcpServers": {
    "agent-trust-protocol": {
      "command": "node",
      "args": ["/path/to/atp-mcp-server.js"],
      "env": {
        "ATP_TRUST_LEVEL": "verified"
      }
    }
  }
}
```

### 2. Context7 MCP Integration

Context7 provides advanced documentation and context management capabilities. Add it to your MCP configuration:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Getting Your Context7 API Key

1. Visit [Context7 MCP](https://mcp.context7.com/)
2. Sign up for an account
3. Generate an API key in your dashboard
4. Replace `YOUR_API_KEY` in the configuration above

### 3. Claude Desktop Integration

For Claude Desktop, use `claude-desktop-config.json`:

```json
{
  "mcpServers": {
    "agent-trust-protocol": {
      "command": "node",
      "args": ["/Users/your-user/agent-trust-protocol/claude-atp-client.js"],
      "env": {
        "ATP_TRUST_LEVEL": "verified",
        "ATP_CLIENT_DID": "did:atp:claude-desktop"
      }
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Features

### ATP MCP Server
- **Quantum-safe cryptography** for all communications
- **DID-based identity** verification
- **Trust scoring** and validation
- **Audit trails** for all operations

### Context7 MCP Server
- **Documentation generation** and management
- **Context-aware code assistance**
- **Knowledge base integration**
- **Multi-format support** (Markdown, JSON, etc.)

## Security

All MCP communications through ATP are:
- **End-to-end encrypted** with quantum-safe algorithms
- **Cryptographically signed** for authenticity
- **Trust-scored** for reliability
- **Audit-logged** for compliance

## Troubleshooting

### Connection Issues
```bash
# Check ATP services
docker-compose ps

# Test MCP connection
curl -X POST http://localhost:3007/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "ping"}'
```

### API Key Issues
- Verify your Context7 API key is valid
- Check rate limits and usage quotas
- Ensure HTTPS is enabled for production

### Configuration Errors
```bash
# Validate JSON syntax
cat mcp-config.json | jq .

# Check file permissions
ls -la mcp-config.json
```

## Advanced Configuration

### Custom Trust Levels
```json
{
  "mcpServers": {
    "secure-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "ATP_MIN_TRUST_SCORE": "0.8",
        "ATP_REQUIRE_QUANTUM_SAFE": "true"
      }
    }
  }
}
```

### Rate Limiting
```json
{
  "rateLimit": {
    "maxRequestsPerMinute": 60,
    "maxRequestsPerHour": 1000
  }
}
```

## Integration Examples

### With LangChain
```typescript
import { ATPSecurityWrapper } from 'atp-sdk/langchain';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const model = new ChatOpenAI();
const secureModel = new ATPSecurityWrapper(model, {
  mcpEnabled: true,
  context7Enabled: true
});
```

### With AutoGPT
```python
from atp_sdk import ATPSecurityWrapper
from autogpt import AutoGPT

agent = AutoGPT()
secure_agent = ATPSecurityWrapper(agent, {
    "mcp_servers": ["context7"],
    "trust_level": "verified"
})
```

## Support

- **Documentation**: [ATP MCP Docs](https://docs.atp.dev/mcp)
- **Context7**: [Context7 MCP](https://mcp.context7.com/)
- **Issues**: [GitHub Issues](https://github.com/agent-trust-protocol/core/issues)