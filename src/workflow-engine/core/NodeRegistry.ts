import { 
  NodeExecutor, 
  NodeDefinition, 
  NodeCategory,
  NodeInput,
  NodeOutput,
  NodeConfig
} from '../types/WorkflowTypes';

export class NodeRegistry {
  private nodes: Map<string, NodeDefinition> = new Map();
  private categories: Map<NodeCategory, Set<string>> = new Map();
  private validators: Map<string, (config: any) => boolean> = new Map();

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const categories: NodeCategory[] = [
      'trigger', 
      'action', 
      'condition', 
      'loop', 
      'transform', 
      'integration', 
      'utility', 
      'output'
    ];
    
    categories.forEach(category => {
      this.categories.set(category, new Set());
    });
  }

  registerNode(definition: NodeDefinition): void {
    if (this.nodes.has(definition.type)) {
      throw new Error(`Node type "${definition.type}" is already registered`);
    }

    this.validateNodeDefinition(definition);
    
    this.nodes.set(definition.type, definition);
    
    const categorySet = this.categories.get(definition.category);
    if (categorySet) {
      categorySet.add(definition.type);
    }
    
    if (definition.executor.validate) {
      this.validators.set(definition.type, definition.executor.validate);
    }

    console.log(`Registered node: ${definition.type} in category: ${definition.category}`);
  }

  registerBulkNodes(definitions: NodeDefinition[]): void {
    const errors: string[] = [];
    
    for (const definition of definitions) {
      try {
        this.registerNode(definition);
      } catch (error) {
        errors.push(`Failed to register ${definition.type}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('Some nodes failed to register:', errors);
    }
  }

  unregisterNode(type: string): void {
    const definition = this.nodes.get(type);
    if (!definition) {
      throw new Error(`Node type "${type}" is not registered`);
    }
    
    this.nodes.delete(type);
    this.validators.delete(type);
    
    const categorySet = this.categories.get(definition.category);
    if (categorySet) {
      categorySet.delete(type);
    }
    
    console.log(`Unregistered node: ${type}`);
  }

  getNode(type: string): NodeExecutor {
    const definition = this.nodes.get(type);
    if (!definition) {
      throw new Error(`Node type "${type}" is not registered`);
    }
    return definition.executor;
  }

  getNodeDefinition(type: string): NodeDefinition | undefined {
    return this.nodes.get(type);
  }

  hasNode(type: string): boolean {
    return this.nodes.has(type);
  }

  getNodesByCategory(category: NodeCategory): NodeDefinition[] {
    const nodeTypes = this.categories.get(category);
    if (!nodeTypes) {
      return [];
    }
    
    return Array.from(nodeTypes)
      .map(type => this.nodes.get(type))
      .filter((def): def is NodeDefinition => def !== undefined);
  }

  getAllNodes(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  getAllCategories(): Array<{ 
    category: NodeCategory; 
    nodes: NodeDefinition[] 
  }> {
    return Array.from(this.categories.entries()).map(([category, nodeTypes]) => ({
      category,
      nodes: Array.from(nodeTypes)
        .map(type => this.nodes.get(type))
        .filter((def): def is NodeDefinition => def !== undefined)
    }));
  }

  validateNodeConfig(type: string, config: any): boolean {
    const validator = this.validators.get(type);
    if (!validator) {
      return true;
    }
    
    try {
      return validator(config);
    } catch (error) {
      console.error(`Validation error for node ${type}:`, error);
      return false;
    }
  }

  searchNodes(query: string): NodeDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.nodes.values()).filter(node => 
      node.type.toLowerCase().includes(lowercaseQuery) ||
      node.label.toLowerCase().includes(lowercaseQuery) ||
      node.description.toLowerCase().includes(lowercaseQuery) ||
      node.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  getNodeSchema(type: string): {
    inputs: NodeInput[];
    outputs: NodeOutput[];
    config?: Record<string, any>;
  } | null {
    const definition = this.nodes.get(type);
    if (!definition) {
      return null;
    }
    
    if (definition.executor.getSchema) {
      return definition.executor.getSchema();
    }
    
    return {
      inputs: definition.inputs,
      outputs: definition.outputs,
      config: definition.config
    };
  }

  private validateNodeDefinition(definition: NodeDefinition): void {
    const errors: string[] = [];
    
    if (!definition.type || typeof definition.type !== 'string') {
      errors.push('Node type must be a non-empty string');
    }
    
    if (!definition.label || typeof definition.label !== 'string') {
      errors.push('Node label must be a non-empty string');
    }
    
    if (!definition.description || typeof definition.description !== 'string') {
      errors.push('Node description must be a non-empty string');
    }
    
    if (!definition.category || !this.categories.has(definition.category)) {
      errors.push(`Invalid node category: ${definition.category}`);
    }
    
    if (!definition.executor || typeof definition.executor.execute !== 'function') {
      errors.push('Node must have an executor with an execute function');
    }
    
    if (!Array.isArray(definition.inputs)) {
      errors.push('Node inputs must be an array');
    } else {
      definition.inputs.forEach((input, index) => {
        if (!input.name || !input.type) {
          errors.push(`Input at index ${index} must have name and type`);
        }
      });
    }
    
    if (!Array.isArray(definition.outputs)) {
      errors.push('Node outputs must be an array');
    } else {
      definition.outputs.forEach((output, index) => {
        if (!output.name || !output.type) {
          errors.push(`Output at index ${index} must have name and type`);
        }
      });
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid node definition: ${errors.join(', ')}`);
    }
  }

  async loadNodesFromDirectory(directory: string): Promise<void> {
    console.log(`Loading nodes from directory: ${directory}`);
  }

  exportNodeDefinitions(): string {
    const definitions = Array.from(this.nodes.values()).map(def => ({
      type: def.type,
      category: def.category,
      label: def.label,
      description: def.description,
      icon: def.icon,
      color: def.color,
      inputs: def.inputs,
      outputs: def.outputs,
      config: def.config
    }));
    
    return JSON.stringify(definitions, null, 2);
  }

  importNodeDefinitions(json: string): void {
    try {
      const definitions = JSON.parse(json);
      if (!Array.isArray(definitions)) {
        throw new Error('Definitions must be an array');
      }
      
      console.log(`Importing ${definitions.length} node definitions`);
    } catch (error) {
      throw new Error(`Failed to import node definitions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  clearRegistry(): void {
    this.nodes.clear();
    this.validators.clear();
    this.initializeCategories();
    console.log('Node registry cleared');
  }

  getStatistics(): {
    totalNodes: number;
    nodesByCategory: Record<string, number>;
    nodesWithValidators: number;
  } {
    const nodesByCategory: Record<string, number> = {};
    
    for (const [category, nodes] of this.categories.entries()) {
      nodesByCategory[category] = nodes.size;
    }
    
    return {
      totalNodes: this.nodes.size,
      nodesByCategory,
      nodesWithValidators: this.validators.size
    };
  }
}