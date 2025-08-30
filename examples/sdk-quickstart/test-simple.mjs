import { VERSION, PROTOCOL_VERSION, SDK_INFO, ATP_CONSTANTS, createQuickConfig } from 'atp-sdk';

console.log('🔐 ATP SDK Test\n');
console.log('=' .repeat(50));
console.log('✅ SDK successfully installed from NPM!');
console.log('=' .repeat(50));
console.log('\n📦 Package: atp-sdk');
console.log('📌 Version:', VERSION);
console.log('🔧 Protocol:', PROTOCOL_VERSION);
console.log('ℹ️  Info:', SDK_INFO);
console.log('\n🎯 Available Features:');
console.log('  • Decentralized Identity (DIDs)');
console.log('  • Verifiable Credentials');
console.log('  • Permission Management');
console.log('  • Quantum-Safe Signatures');
console.log('  • Trust Evaluation');
console.log('  • Real-time Gateway');

console.log('\n⚙️  Quick Config Example:');
const config = createQuickConfig('development');
console.log('  Environment:', config.environment);
console.log('  Services:', Object.keys(config.services));

console.log('\n📚 Constants:');
console.log('  Trust Levels:', ATP_CONSTANTS.TRUST_LEVELS);
console.log('  Default Port:', ATP_CONSTANTS.DEFAULT_PORTS);

console.log('\n' + '=' .repeat(50));
console.log('🎉 ATP SDK v1.0.0 is ready to use!');
console.log('=' .repeat(50));
console.log('\n🌐 Installation: npm install atp-sdk');
console.log('📖 Documentation: https://github.com/agent-trust-protocol/core');
console.log('🚀 Get started with the examples in this directory!\n');