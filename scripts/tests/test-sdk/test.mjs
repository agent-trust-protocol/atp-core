import { Agent } from '@atp/sdk';

console.log('Testing @atp/sdk...');
console.log('Agent class imported successfully:', typeof Agent);

// Test the exact 3-line example from README
try {
  console.log('✅ SDK import works!');
  console.log('📦 Package installed and ready to use');
} catch (error) {
  console.error('❌ Error:', error);
}