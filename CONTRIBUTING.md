# Contributing to Agent Trust Protocol

Thank you for your interest in contributing to the Agent Trust Protocol! We're excited to have you join our community of developers building the future of secure AI agent interactions.

## How to Contribute

### Reporting Issues
- Check existing issues before creating a new one
- Use clear, descriptive titles
- Include steps to reproduce bugs
- Specify your environment (OS, Node version, etc.)

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/agent-trust-protocol/core.git
cd agent-trust-protocol

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development services
npm run dev
```

### Code Style
- Follow existing code patterns
- Use TypeScript for new code
- Include tests for new features
- Keep commits focused and atomic

### Testing
```bash
# Run all tests
npm test

# Run specific service tests
npm run test:identity
npm run test:quantum
```

## Community

- **Discord**: Join our developer community (coming soon)
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: [docs.agenttrustprotocol.com](https://docs.agenttrustprotocol.com)

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.