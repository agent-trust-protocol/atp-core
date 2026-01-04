/**
 * Advanced Compliance Frameworks for ATP
 * SOC2, HIPAA, GDPR, and other enterprise compliance standards
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';

export enum ComplianceFramework {
  SOC2 = 'soc2',
  HIPAA = 'hipaa',
  GDPR = 'gdpr',
  PCI_DSS = 'pci-dss',
  ISO27001 = 'iso27001',
  NIST = 'nist',
  FEDRAMP = 'fedramp',
  CCPA = 'ccpa'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non-compliant',
  IN_PROGRESS = 'in-progress',
  NOT_APPLICABLE = 'not-applicable',
  REVIEW_REQUIRED = 'review-required'
}

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  PHI = 'phi', // Protected Health Information
  PII = 'pii', // Personally Identifiable Information
  PCI = 'pci'  // Payment Card Industry data
}

export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  category: string;
  title: string;
  description: string;
  implementationGuidance: string;
  testingProcedure: string;
  evidence: ComplianceEvidence[];
  controls: ComplianceControl[];
  status: ComplianceStatus;
  lastAssessed: number;
  nextAssessment: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  responsible: string;
  metadata: Record<string, any>;
}

export interface ComplianceControl {
  id: string;
  type: 'preventive' | 'detective' | 'corrective';
  name: string;
  description: string;
  implementation: string;
  automated: boolean;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastExecuted?: number;
  nextExecution?: number;
  effectiveness: 'effective' | 'partially-effective' | 'ineffective' | 'not-tested';
  evidence: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'configuration' | 'certificate' | 'audit-report';
  title: string;
  description: string;
  filePath?: string;
  content?: string;
  hash: string;
  collectedAt: number;
  collectedBy: string;
  expiresAt?: number;
  validated: boolean;
  metadata: Record<string, any>;
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataTypes: DataClassification[];
  legalBasis: string;
  dataSubjects: string[];
  thirdPartySharing: boolean;
  retentionPeriod: number;
  securityMeasures: string[];
  responsibleParty: string;
  dataProtectionOfficer: string;
  lastReviewed: number;
  gdprArticle6Basis?: string;
  crossBorderTransfers: boolean;
  adequacyDecision?: boolean;
}

export interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  description: string;
  dataTypes: DataClassification[];
  riskLevel: 'low' | 'medium' | 'high';
  safeguards: string[];
  residualRisk: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: number;
  reviewDate: number;
  status: 'draft' | 'under-review' | 'approved' | 'rejected';
}

export interface ComplianceAudit {
  id: string;
  framework: ComplianceFramework;
  auditType: 'internal' | 'external' | 'certification';
  auditor: string;
  scope: string[];
  startDate: number;
  endDate: number;
  findings: AuditFinding[];
  overallRating: 'pass' | 'pass-with-exceptions' | 'fail';
  certificationExpiry?: number;
  followUpRequired: boolean;
  metadata: Record<string, any>;
}

export interface AuditFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  requirement: string;
  finding: string;
  recommendation: string;
  remediation: string;
  responsible: string;
  dueDate: number;
  status: 'open' | 'in-progress' | 'closed' | 'risk-accepted';
  closedAt?: number;
  evidence?: string[];
}

export interface ComplianceMetrics {
  framework: ComplianceFramework;
  overallCompliance: number;
  requirementsByStatus: Record<ComplianceStatus, number>;
  controlEffectiveness: number;
  findingsByCategory: Record<string, number>;
  meanTimeToRemediation: number;
  auditReadiness: number;
  riskExposure: number;
  lastAssessment: number;
}

export class EnterpriseComplianceService extends EventEmitter {
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private dataActivities: Map<string, DataProcessingActivity> = new Map();
  private auditHistory: Map<string, ComplianceAudit> = new Map();
  private piaRegistry: Map<string, PrivacyImpactAssessment> = new Map();
  private controlExecutionLog: Map<string, any[]> = new Map();

  constructor() {
    super();
    this.initializeFrameworks();
    this.startContinuousMonitoring();
  }

  /**
   * Initialize compliance frameworks with default requirements
   */
  private initializeFrameworks(): void {
    this.initializeSOC2Requirements();
    this.initializeHIPAARequirements();
    this.initializeGDPRRequirements();
  }

  /**
   * SOC2 Trust Service Criteria implementation
   */
  private initializeSOC2Requirements(): void {
    const soc2Requirements = [
      {
        framework: ComplianceFramework.SOC2,
        category: 'Security',
        title: 'CC6.1 - Logical and Physical Access Controls',
        description: 'The entity implements logical and physical access controls to protect against threats from sources outside its system boundaries.',
        implementationGuidance: 'Implement multi-factor authentication, access reviews, and physical security controls.',
        testingProcedure: 'Review access control configurations and test effectiveness.',
        controls: [
          {
            id: 'soc2-cc6.1-001',
            type: 'preventive' as const,
            name: 'Multi-Factor Authentication',
            description: 'All administrative access requires MFA',
            implementation: 'Configure MFA for all privileged accounts',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['mfa-config.json', 'access-logs.csv']
          },
          {
            id: 'soc2-cc6.1-002',
            type: 'detective' as const,
            name: 'Access Review',
            description: 'Quarterly review of user access permissions',
            implementation: 'Automated reporting and manual review process',
            automated: false,
            frequency: 'quarterly' as const,
            effectiveness: 'effective' as const,
            evidence: ['access-review-q1-2024.pdf']
          }
        ],
        riskLevel: 'high' as const,
        responsible: 'Security Team'
      },
      {
        framework: ComplianceFramework.SOC2,
        category: 'Availability',
        title: 'A1.1 - System Availability',
        description: 'The entity maintains system availability commitments.',
        implementationGuidance: 'Implement monitoring, redundancy, and incident response procedures.',
        testingProcedure: 'Test backup systems and review availability metrics.',
        controls: [
          {
            id: 'soc2-a1.1-001',
            type: 'preventive' as const,
            name: 'System Monitoring',
            description: '24/7 system monitoring and alerting',
            implementation: 'Automated monitoring with real-time alerts',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['monitoring-dashboard.png', 'alert-config.json']
          }
        ],
        riskLevel: 'medium' as const,
        responsible: 'Infrastructure Team'
      }
    ];

    soc2Requirements.forEach(req => this.createRequirement(req));
  }

  /**
   * HIPAA compliance requirements
   */
  private initializeHIPAARequirements(): void {
    const hipaaRequirements = [
      {
        framework: ComplianceFramework.HIPAA,
        category: 'Administrative Safeguards',
        title: '164.308(a)(1) - Security Officer',
        description: 'Assign security responsibility to one individual.',
        implementationGuidance: 'Designate a security officer responsible for HIPAA compliance.',
        testingProcedure: 'Verify security officer designation and responsibilities.',
        controls: [
          {
            id: 'hipaa-164.308-a1-001',
            type: 'preventive' as const,
            name: 'Security Officer Designation',
            description: 'Formal designation of security officer',
            implementation: 'Document security officer role and responsibilities',
            automated: false,
            frequency: 'annually' as const,
            effectiveness: 'effective' as const,
            evidence: ['security-officer-designation.pdf']
          }
        ],
        riskLevel: 'high' as const,
        responsible: 'Compliance Officer'
      },
      {
        framework: ComplianceFramework.HIPAA,
        category: 'Physical Safeguards',
        title: '164.310(a)(1) - Facility Access Controls',
        description: 'Implement procedures to control physical access to facilities.',
        implementationGuidance: 'Establish physical access controls and monitoring.',
        testingProcedure: 'Test physical access controls and review access logs.',
        controls: [
          {
            id: 'hipaa-164.310-a1-001',
            type: 'preventive' as const,
            name: 'Physical Access Control',
            description: 'Badge access to secure areas',
            implementation: 'Electronic badge system with access logging',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['access-control-system.json', 'physical-access-logs.csv']
          }
        ],
        riskLevel: 'medium' as const,
        responsible: 'Facilities Team'
      },
      {
        framework: ComplianceFramework.HIPAA,
        category: 'Technical Safeguards',
        title: '164.312(a)(1) - Access Control',
        description: 'Implement technical access control measures for PHI.',
        implementationGuidance: 'Implement role-based access controls for PHI systems.',
        testingProcedure: 'Test access controls and review user permissions.',
        controls: [
          {
            id: 'hipaa-164.312-a1-001',
            type: 'preventive' as const,
            name: 'PHI Access Control',
            description: 'Role-based access to PHI data',
            implementation: 'RBAC system with PHI data classification',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['rbac-config.json', 'phi-access-matrix.xlsx']
          }
        ],
        riskLevel: 'critical' as const,
        responsible: 'Security Team'
      }
    ];

    hipaaRequirements.forEach(req => this.createRequirement(req));
  }

  /**
   * GDPR compliance requirements
   */
  private initializeGDPRRequirements(): void {
    const gdprRequirements = [
      {
        framework: ComplianceFramework.GDPR,
        category: 'Data Protection Principles',
        title: 'Article 5 - Principles of Processing',
        description: 'Personal data shall be processed lawfully, fairly and transparently.',
        implementationGuidance: 'Establish lawful basis for processing and maintain transparency.',
        testingProcedure: 'Review data processing activities and privacy notices.',
        controls: [
          {
            id: 'gdpr-art5-001',
            type: 'preventive' as const,
            name: 'Data Processing Register',
            description: 'Maintain register of processing activities',
            implementation: 'Automated tracking of data processing activities',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['processing-register.json', 'privacy-notice.pdf']
          }
        ],
        riskLevel: 'high' as const,
        responsible: 'Data Protection Officer'
      },
      {
        framework: ComplianceFramework.GDPR,
        category: 'Individual Rights',
        title: 'Article 17 - Right to Erasure',
        description: 'Data subjects have the right to have their personal data erased.',
        implementationGuidance: 'Implement data deletion procedures and workflows.',
        testingProcedure: 'Test data deletion processes and verify completeness.',
        controls: [
          {
            id: 'gdpr-art17-001',
            type: 'corrective' as const,
            name: 'Data Deletion Process',
            description: 'Automated data deletion upon request',
            implementation: 'Data lifecycle management with deletion workflows',
            automated: true,
            frequency: 'continuous' as const,
            effectiveness: 'effective' as const,
            evidence: ['deletion-workflow.json', 'deletion-log.csv']
          }
        ],
        riskLevel: 'high' as const,
        responsible: 'Data Protection Officer'
      }
    ];

    gdprRequirements.forEach(req => this.createRequirement(req));
  }

  /**
   * Create a new compliance requirement
   */
  createRequirement(requirement: Partial<ComplianceRequirement>): ComplianceRequirement {
    const newRequirement: ComplianceRequirement = {
      id: requirement.id || this.generateRequirementId(),
      framework: requirement.framework!,
      category: requirement.category!,
      title: requirement.title!,
      description: requirement.description!,
      implementationGuidance: requirement.implementationGuidance || '',
      testingProcedure: requirement.testingProcedure || '',
      evidence: requirement.evidence || [],
      controls: requirement.controls || [],
      status: requirement.status || ComplianceStatus.IN_PROGRESS,
      lastAssessed: requirement.lastAssessed || 0,
      nextAssessment: requirement.nextAssessment || Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
      riskLevel: requirement.riskLevel || 'medium',
      responsible: requirement.responsible || 'Compliance Team',
      metadata: requirement.metadata || {}
    };

    this.requirements.set(newRequirement.id, newRequirement);

    this.emit('requirementCreated', {
      requirementId: newRequirement.id,
      framework: newRequirement.framework,
      category: newRequirement.category
    });

    return newRequirement;
  }

  /**
   * Register a data processing activity
   */
  registerDataProcessingActivity(activity: Omit<DataProcessingActivity, 'id'>): DataProcessingActivity {
    const newActivity: DataProcessingActivity = {
      ...activity,
      id: this.generateActivityId()
    };

    this.dataActivities.set(newActivity.id, newActivity);

    this.emit('dataActivityRegistered', {
      activityId: newActivity.id,
      name: newActivity.name,
      dataTypes: newActivity.dataTypes
    });

    return newActivity;
  }

  /**
   * Conduct Privacy Impact Assessment
   */
  conductPIA(assessment: Omit<PrivacyImpactAssessment, 'id'>): PrivacyImpactAssessment {
    const newPIA: PrivacyImpactAssessment = {
      ...assessment,
      id: this.generatePIAId()
    };

    this.piaRegistry.set(newPIA.id, newPIA);

    this.emit('piaCreated', {
      piaId: newPIA.id,
      projectName: newPIA.projectName,
      riskLevel: newPIA.riskLevel
    });

    return newPIA;
  }

  /**
   * Execute compliance control
   */
  async executeControl(requirementId: string, controlId: string): Promise<void> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) {
      throw new Error(`Requirement ${requirementId} not found`);
    }

    const control = requirement.controls.find(c => c.id === controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found in requirement ${requirementId}`);
    }

    const execution = {
      controlId,
      requirementId,
      executedAt: Date.now(),
      result: 'success', // Would be determined by actual control execution
      evidence: control.evidence,
      nextExecution: this.calculateNextExecution(control.frequency)
    };

    // Update control execution tracking
    if (!this.controlExecutionLog.has(controlId)) {
      this.controlExecutionLog.set(controlId, []);
    }
    this.controlExecutionLog.get(controlId)!.push(execution);

    // Update control metadata
    control.lastExecuted = execution.executedAt;
    control.nextExecution = execution.nextExecution;

    this.emit('controlExecuted', {
      requirementId,
      controlId,
      result: execution.result,
      executedAt: execution.executedAt
    });
  }

  /**
   * Assess compliance requirement
   */
  async assessRequirement(requirementId: string, assessor: string): Promise<ComplianceStatus> {
    const requirement = this.requirements.get(requirementId);
    if (!requirement) {
      throw new Error(`Requirement ${requirementId} not found`);
    }

    // Check control effectiveness
    let effectiveControls = 0;
    for (const control of requirement.controls) {
      if (control.effectiveness === 'effective') {
        effectiveControls++;
      }
    }

    const controlEffectiveness = requirement.controls.length > 0
      ? effectiveControls / requirement.controls.length
      : 0;

    // Determine compliance status based on control effectiveness
    let status: ComplianceStatus;
    if (controlEffectiveness >= 0.9) {
      status = ComplianceStatus.COMPLIANT;
    } else if (controlEffectiveness >= 0.7) {
      status = ComplianceStatus.REVIEW_REQUIRED;
    } else {
      status = ComplianceStatus.NON_COMPLIANT;
    }

    // Update requirement
    requirement.status = status;
    requirement.lastAssessed = Date.now();
    requirement.nextAssessment = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 days

    this.emit('requirementAssessed', {
      requirementId,
      status,
      controlEffectiveness,
      assessor
    });

    return status;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(framework: ComplianceFramework): ComplianceMetrics {
    const frameworkRequirements = Array.from(this.requirements.values())
      .filter(req => req.framework === framework);

    const requirementsByStatus: Record<ComplianceStatus, number> = {
      [ComplianceStatus.COMPLIANT]: 0,
      [ComplianceStatus.NON_COMPLIANT]: 0,
      [ComplianceStatus.IN_PROGRESS]: 0,
      [ComplianceStatus.NOT_APPLICABLE]: 0,
      [ComplianceStatus.REVIEW_REQUIRED]: 0
    };

    let totalEffectiveControls = 0;
    let totalControls = 0;
    const findingsByCategory: Record<string, number> = {};

    for (const requirement of frameworkRequirements) {
      requirementsByStatus[requirement.status]++;

      for (const control of requirement.controls) {
        totalControls++;
        if (control.effectiveness === 'effective') {
          totalEffectiveControls++;
        }
      }

      findingsByCategory[requirement.category] =
        (findingsByCategory[requirement.category] || 0) + 1;
    }

    const compliantCount = requirementsByStatus[ComplianceStatus.COMPLIANT];
    const overallCompliance = frameworkRequirements.length > 0
      ? compliantCount / frameworkRequirements.length
      : 0;

    const controlEffectiveness = totalControls > 0
      ? totalEffectiveControls / totalControls
      : 0;

    const lastAssessment = Math.max(
      ...frameworkRequirements.map(req => req.lastAssessed)
    );

    return {
      framework,
      overallCompliance,
      requirementsByStatus,
      controlEffectiveness,
      findingsByCategory,
      meanTimeToRemediation: this.calculateMTTR(),
      auditReadiness: this.calculateAuditReadiness(framework),
      riskExposure: this.calculateRiskExposure(frameworkRequirements),
      lastAssessment
    };
  }

  /**
   * Get compliance dashboard data
   */
  getComplianceDashboard(): {
    frameworks: ComplianceMetrics[];
    upcomingAssessments: ComplianceRequirement[];
    criticalFindings: number;
    dataActivities: number;
    completedPIAs: number;
    } {
    const frameworks = Object.values(ComplianceFramework).map(framework =>
      this.generateComplianceReport(framework)
    );

    const upcomingAssessments = Array.from(this.requirements.values())
      .filter(req => req.nextAssessment <= Date.now() + (30 * 24 * 60 * 60 * 1000)) // Next 30 days
      .sort((a, b) => a.nextAssessment - b.nextAssessment)
      .slice(0, 10);

    const criticalFindings = Array.from(this.requirements.values())
      .filter(req => req.status === ComplianceStatus.NON_COMPLIANT && req.riskLevel === 'critical')
      .length;

    return {
      frameworks,
      upcomingAssessments,
      criticalFindings,
      dataActivities: this.dataActivities.size,
      completedPIAs: Array.from(this.piaRegistry.values())
        .filter(pia => pia.status === 'approved').length
    };
  }

  // Private utility methods

  private calculateNextExecution(frequency: string): number {
    const now = Date.now();
    const intervals = {
      continuous: 0,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 90 * 24 * 60 * 60 * 1000,
      annually: 365 * 24 * 60 * 60 * 1000
    };
    return now + ((intervals as any)[frequency] || intervals.monthly);
  }

  private calculateMTTR(): number {
    // Simplified MTTR calculation
    return 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }

  private calculateAuditReadiness(framework: ComplianceFramework): number {
    const requirements = Array.from(this.requirements.values())
      .filter(req => req.framework === framework);

    const readyRequirements = requirements.filter(req =>
      req.status === ComplianceStatus.COMPLIANT &&
      req.evidence.length > 0
    ).length;

    return requirements.length > 0 ? readyRequirements / requirements.length : 0;
  }

  private calculateRiskExposure(requirements: ComplianceRequirement[]): number {
    const riskWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    let totalRisk = 0;
    let maxRisk = 0;

    for (const req of requirements) {
      const riskValue = riskWeights[req.riskLevel];
      maxRisk += riskValue;

      if (req.status === ComplianceStatus.NON_COMPLIANT) {
        totalRisk += riskValue;
      }
    }

    return maxRisk > 0 ? totalRisk / maxRisk : 0;
  }

  private startContinuousMonitoring(): void {
    // Run compliance checks every hour
    setInterval(() => {
      this.performContinuousMonitoring();
    }, 60 * 60 * 1000);
  }

  private performContinuousMonitoring(): void {
    // Check for overdue assessments
    const overdueRequirements = Array.from(this.requirements.values())
      .filter(req => req.nextAssessment < Date.now());

    if (overdueRequirements.length > 0) {
      this.emit('overdueAssessments', {
        count: overdueRequirements.length,
        requirements: overdueRequirements.map(req => ({
          id: req.id,
          title: req.title,
          framework: req.framework,
          overdueDays: Math.floor((Date.now() - req.nextAssessment) / (24 * 60 * 60 * 1000))
        }))
      });
    }

    // Execute automated controls
    this.executeAutomatedControls();
  }

  private async executeAutomatedControls(): Promise<void> {
    for (const requirement of this.requirements.values()) {
      for (const control of requirement.controls) {
        if (control.automated &&
            control.nextExecution &&
            control.nextExecution <= Date.now()) {
          try {
            await this.executeControl(requirement.id, control.id);
          } catch (error) {
            this.emit('controlExecutionError', {
              requirementId: requirement.id,
              controlId: control.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }
  }

  private generateRequirementId(): string {
    return `req_${  randomBytes(8).toString('hex')}`;
  }

  private generateActivityId(): string {
    return `act_${  randomBytes(8).toString('hex')}`;
  }

  private generatePIAId(): string {
    return `pia_${  randomBytes(8).toString('hex')}`;
  }
}

// Export compliance utilities
export class ComplianceUtils {
  /**
   * Validate data classification
   */
  static validateDataClassification(data: any, expectedClassification: DataClassification): boolean {
    // Implementation would depend on data structure and classification rules
    return true;
  }

  /**
   * Generate compliance evidence hash
   */
  static generateEvidenceHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check data retention policy
   */
  static checkRetentionPolicy(dataAge: number, retentionPeriod: number): boolean {
    return dataAge <= retentionPeriod;
  }

  /**
   * Validate cross-border data transfer
   */
  static validateCrossBorderTransfer(
    sourceCountry: string,
    targetCountry: string,
    adequacyDecision: boolean
  ): boolean {
    // Simplified validation - would use actual adequacy decision database
    const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
    const adequateCountries = ['AD', 'AR', 'CA', 'CH', 'FO', 'GG', 'IL', 'IM', 'JE', 'JP', 'NZ', 'UY'];

    if (euCountries.includes(sourceCountry)) {
      return euCountries.includes(targetCountry) ||
             adequateCountries.includes(targetCountry) ||
             adequacyDecision;
    }

    return true; // Non-EU transfers may have different rules
  }
}
