import { SimpleAgent } from './agent.js';

export class CalculatorAgent extends SimpleAgent {
  protected onReady(): void {
    super.onReady();
    console.log('Calculator Agent is ready to perform calculations!');
    
    // Subscribe to calculation requests
    this.subscribe('calculation-request', this.handleCalculationRequest.bind(this));
  }

  private async handleCalculationRequest(request: any): Promise<void> {
    const { operation, operands, requesterDid, requestId } = request;
    
    console.log(`Calculation request: ${operation}(${operands.join(', ')}) from ${requesterDid}`);
    
    try {
      // Check permission to perform calculations
      const permissionCheck = await this.invoke('permission.check', {
        subject: this.getDID(),
        action: 'execute',
        resource: `calculator:${operation}`,
      });
      
      if (!permissionCheck.result.data.allowed) {
        console.log('Permission denied for calculation request');
        return;
      }

      // Perform the calculation
      const result = this.performCalculation(operation, operands);
      
      // Create a verifiable credential for the calculation result
      const credential = await this.invoke('vc.issue', {
        schemaId: 'calculation-result-v1',
        subject: requesterDid,
        claims: {
          operation,
          operands,
          result,
          timestamp: new Date().toISOString(),
          calculator: this.getDID(),
          requestId,
        },
        issuerDid: this.getDID(),
        issuerPrivateKey: this.privateKey,
      });
      
      console.log(`Calculation completed: ${operation}(${operands.join(', ')}) = ${result}`);
      
    } catch (error) {
      console.error('Calculation failed:', error);
    }
  }

  private performCalculation(operation: string, operands: number[]): number {
    switch (operation.toLowerCase()) {
      case 'add':
        return operands.reduce((sum, num) => sum + num, 0);
      case 'subtract':
        return operands.reduce((diff, num, index) => index === 0 ? num : diff - num);
      case 'multiply':
        return operands.reduce((product, num) => product * num, 1);
      case 'divide':
        return operands.reduce((quotient, num, index) => {
          if (index === 0) return num;
          if (num === 0) throw new Error('Division by zero');
          return quotient / num;
        });
      case 'power':
        if (operands.length !== 2) throw new Error('Power operation requires exactly 2 operands');
        return Math.pow(operands[0], operands[1]);
      case 'sqrt':
        if (operands.length !== 1) throw new Error('Square root operation requires exactly 1 operand');
        if (operands[0] < 0) throw new Error('Cannot calculate square root of negative number');
        return Math.sqrt(operands[0]);
      case 'factorial':
        if (operands.length !== 1) throw new Error('Factorial operation requires exactly 1 operand');
        return this.factorial(operands[0]);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('Factorial requires a non-negative integer');
    }
    if (n === 0 || n === 1) return 1;
    return n * this.factorial(n - 1);
  }

  async grantCalculationPermission(targetAgentDid: string, operations: string[]): Promise<void> {
    try {
      for (const operation of operations) {
        await this.invoke('permission.grant', {
          grantor: this.getDID(),
          grantee: targetAgentDid,
          scopes: ['execute'],
          resource: `calculator:${operation}`,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        });
      }
      
      console.log(`Granted calculation permissions for [${operations.join(', ')}] to ${targetAgentDid}`);
    } catch (error) {
      console.error('Failed to grant calculation permission:', error);
    }
  }

  getSupportedOperations(): string[] {
    return ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'factorial'];
  }
}