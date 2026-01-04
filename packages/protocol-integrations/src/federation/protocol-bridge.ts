/**
 * Protocol Bridge - Universal protocol message translator
 * Handles protocol-specific message transformations
 */

import { EventEmitter } from 'events';
import { UniversalMessage, SupportedProtocol } from './federation-engine.js';

export interface ProtocolBridgeConfig {
  sourceProtocol: SupportedProtocol;
  targetProtocol: SupportedProtocol;
  transformationRules: TransformationRule[];
  enabled: boolean;
}

export interface TransformationRule {
  id: string;
  name: string;
  sourceMessageType: string;
  targetMessageType: string;
  fieldMappings: FieldMapping[];
  customTransform?: (message: any) => any;
}

export interface FieldMapping {
  sourcePath: string;
  targetPath: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

export class ProtocolBridge extends EventEmitter {
  private config: ProtocolBridgeConfig;

  constructor(config: ProtocolBridgeConfig) {
    super();
    this.config = config;
  }

  /**
   * Transform message from source protocol to target protocol
   */
  async transformMessage(sourceMessage: any): Promise<any> {
    try {
      const rule = this.findTransformationRule(sourceMessage.type || sourceMessage.messageType);
      if (!rule) {
        throw new Error(`No transformation rule found for message type: ${sourceMessage.type || sourceMessage.messageType}`);
      }

      let transformedMessage: any = {};

      // Apply field mappings
      for (const mapping of rule.fieldMappings) {
        const sourceValue = this.getValueByPath(sourceMessage, mapping.sourcePath);
        let targetValue = sourceValue;

        // Apply field transformation
        if (mapping.transform && sourceValue !== undefined) {
          targetValue = mapping.transform(sourceValue);
        }

        // Use default value if required field is missing
        if (targetValue === undefined && mapping.required) {
          if (mapping.defaultValue !== undefined) {
            targetValue = mapping.defaultValue;
          } else {
            throw new Error(`Required field missing: ${mapping.sourcePath}`);
          }
        }

        if (targetValue !== undefined) {
          this.setValueByPath(transformedMessage, mapping.targetPath, targetValue);
        }
      }

      // Apply custom transformation
      if (rule.customTransform) {
        transformedMessage = rule.customTransform(transformedMessage);
      }

      // Set target message type
      transformedMessage.type = rule.targetMessageType;

      this.emit('messageTransformed', {
        sourceProtocol: this.config.sourceProtocol,
        targetProtocol: this.config.targetProtocol,
        sourceMessage,
        transformedMessage,
        rule: rule.id
      });

      return transformedMessage;

    } catch (error) {
      this.emit('transformationError', {
        sourceProtocol: this.config.sourceProtocol,
        targetProtocol: this.config.targetProtocol,
        sourceMessage,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find appropriate transformation rule for message type
   */
  private findTransformationRule(messageType: string): TransformationRule | null {
    return this.config.transformationRules.find(rule => 
      rule.sourceMessageType === messageType
    ) || null;
  }

  /**
   * Get value from object using dot notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set value in object using dot notation path
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Add transformation rule
   */
  addTransformationRule(rule: TransformationRule): void {
    this.config.transformationRules.push(rule);
  }

  /**
   * Remove transformation rule
   */
  removeTransformationRule(ruleId: string): boolean {
    const index = this.config.transformationRules.findIndex(rule => rule.id === ruleId);
    if (index === -1) return false;
    
    this.config.transformationRules.splice(index, 1);
    return true;
  }

  /**
   * Get bridge statistics
   */
  getStats(): {
    sourceProtocol: SupportedProtocol;
    targetProtocol: SupportedProtocol;
    transformationRules: number;
    enabled: boolean;
  } {
    return {
      sourceProtocol: this.config.sourceProtocol,
      targetProtocol: this.config.targetProtocol,
      transformationRules: this.config.transformationRules.length,
      enabled: this.config.enabled
    };
  }
}

// Default transformation rules for common protocols
export const DEFAULT_TRANSFORMATION_RULES: Record<string, TransformationRule[]> = {
  'ATP_TO_MCP': [
    {
      id: 'atp-message-to-mcp',
      name: 'ATP Message to MCP Request',
      sourceMessageType: 'message',
      targetMessageType: 'request',
      fieldMappings: [
        { sourcePath: 'id', targetPath: 'id', required: true },
        { sourcePath: 'from', targetPath: 'params.from', required: true },
        { sourcePath: 'to', targetPath: 'params.to', required: true },
        { sourcePath: 'content', targetPath: 'params.content' },
        { sourcePath: 'timestamp', targetPath: 'params.timestamp' }
      ]
    }
  ],
  'MCP_TO_ATP': [
    {
      id: 'mcp-request-to-atp',
      name: 'MCP Request to ATP Message',
      sourceMessageType: 'request',
      targetMessageType: 'message',
      fieldMappings: [
        { sourcePath: 'id', targetPath: 'id', required: true },
        { sourcePath: 'params.from', targetPath: 'from', required: true },
        { sourcePath: 'params.to', targetPath: 'to', required: true },
        { sourcePath: 'params.content', targetPath: 'content' },
        { sourcePath: 'params.timestamp', targetPath: 'timestamp' }
      ]
    }
  ]
};