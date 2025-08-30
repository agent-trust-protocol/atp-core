import { Parser } from 'expr-eval';
export class PolicyEngine {
    rules = new Map();
    addRule(rule) {
        if (rule.active) {
            this.rules.set(rule.id, rule);
        }
    }
    removeRule(ruleId) {
        this.rules.delete(ruleId);
    }
    async evaluate(context) {
        const applicableRules = Array.from(this.rules.values())
            .filter(rule => rule.active)
            .sort((a, b) => b.priority - a.priority);
        for (const rule of applicableRules) {
            try {
                const result = this.evaluateRule(rule, context);
                if (result !== null) {
                    return {
                        allowed: rule.effect === 'allow',
                        reason: `Policy rule '${rule.name}' ${rule.effect}ed access`,
                    };
                }
            }
            catch (error) {
                console.warn(`Error evaluating policy rule ${rule.id}:`, error);
            }
        }
        return {
            allowed: false,
            reason: 'No applicable policy rules found - default deny',
        };
    }
    evaluateRule(rule, context) {
        try {
            const safeContext = this.createSafeContext(context);
            // Use safe expression parser instead of new Function()
            const parser = new Parser();
            const expr = parser.parse(rule.condition);
            // Evaluate with limited context to prevent code injection
            const result = expr.evaluate(safeContext);
            return typeof result === 'boolean' ? result : null;
        }
        catch (error) {
            console.error('Policy evaluation error:', error);
            return null;
        }
    }
    createSafeContext(context) {
        return {
            subject: context.subject,
            action: context.action,
            resource: context.resource,
            grant: {
                id: context.grant.id,
                grantor: context.grant.grantor,
                grantee: context.grant.grantee,
                scopes: context.grant.scopes,
                resource: context.grant.resource,
                createdAt: context.grant.createdAt,
                expiresAt: context.grant.expiresAt,
            },
            context: context.context || {},
            now: Date.now(),
        };
    }
    getDefaultRules() {
        return [
            {
                id: 'default-time-check',
                name: 'Check Grant Expiration',
                condition: '!context.grant.expiresAt || context.grant.expiresAt > context.now',
                effect: 'allow',
                priority: 1000,
                active: true,
            },
            {
                id: 'admin-override',
                name: 'Admin Override',
                condition: 'context.grant.scopes.includes("admin")',
                effect: 'allow',
                priority: 900,
                active: true,
            },
            {
                id: 'self-access',
                name: 'Self Access',
                condition: 'context.subject === context.resource',
                effect: 'allow',
                priority: 800,
                active: true,
            },
        ];
    }
}
