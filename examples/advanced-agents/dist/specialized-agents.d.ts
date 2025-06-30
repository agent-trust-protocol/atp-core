import { BaseAgent } from './base-agent.js';
export declare class DataAnalysisAgent extends BaseAgent {
    private datasets;
    private analysisResults;
    constructor(name: string);
    private setupDataAnalysisHandlers;
    loadDataset(name: string, data: any[]): Promise<void>;
    analyzeData(datasetName: string, analysisType: string): Promise<any>;
    private computeDescriptiveStats;
    private computeCorrelationMatrix;
    private performTrendAnalysis;
    private detectAnomalies;
    private handleDataAnalysis;
    private handleDataSharing;
    private handleModelTraining;
}
export declare class SecurityAgent extends BaseAgent {
    private threatDatabase;
    private securityPolicies;
    constructor(name: string);
    private setupSecurityHandlers;
    private initializeSecurityDatabase;
    performSecurityScan(target: string, scanType: string): Promise<any>;
    validateAgentSecurity(agentDid: string): Promise<any>;
    private handleSecurityScan;
    private handleThreatAnalysis;
    private handleComplianceCheck;
}
export declare class TaskCoordinatorAgent extends BaseAgent {
    private activeTasks;
    private agentRegistry;
    constructor(name: string);
    private setupCoordinationHandlers;
    orchestrateWorkflow(workflow: any): Promise<string>;
    private executeWorkflowStep;
    private findAgentForCapability;
    private updateTaskProgress;
    private markTaskCompleted;
    private markTaskFailed;
    private handleTaskCoordination;
    private handleWorkflowExecution;
    private handleAgentRegistration;
    getActiveTasks(): any[];
    getRegisteredAgents(): any[];
}
//# sourceMappingURL=specialized-agents.d.ts.map