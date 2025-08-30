import { SimpleAgent } from './agent.js';
export declare class CalculatorAgent extends SimpleAgent {
    protected onReady(): void;
    private handleCalculationRequest;
    private performCalculation;
    private factorial;
    grantCalculationPermission(targetAgentDid: string, operations: string[]): Promise<void>;
    getSupportedOperations(): string[];
}
//# sourceMappingURL=calculator-agent.d.ts.map