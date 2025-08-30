import { z } from 'zod';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class RequestValidator {
  // Common schemas
  static readonly DIDSchema = z.string().regex(
    /^did:atp:[a-zA-Z0-9]{44,}$/,
    'Invalid DID format'
  );

  static readonly UUIDSchema = z.string().uuid('Invalid UUID format');

  static readonly PaginationSchema = z.object({
    limit: z.number().int().min(1).max(1000).default(50),
    offset: z.number().int().min(0).default(0)
  });

  static readonly TimestampSchema = z.string().datetime('Invalid timestamp format');

  // Sanitization helpers
  static sanitizeString(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    
    // Remove potential XSS vectors
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .substring(0, 10000); // Limit length
  }

  static sanitizeHTML(input: unknown): string | null {
    const sanitized = this.sanitizeString(input);
    if (!sanitized) return null;

    // Basic HTML sanitization - remove dangerous tags
    return sanitized
      .replace(/<(script|iframe|object|embed|form|input|textarea|select|button)[^>]*>.*?<\/\1>/gis, '')
      .replace(/<(script|iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi, '')
      .replace(/href\s*=\s*["']?javascript:/gi, 'href="#"')
      .replace(/src\s*=\s*["']?javascript:/gi, 'src="#"');
  }

  static validateAndSanitize<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): ValidationResult {
    try {
      const result = schema.parse(data);
      return {
        valid: true,
        errors: [],
        sanitizedData: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      
      return {
        valid: false,
        errors: ['Validation failed']
      };
    }
  }

  // Request body validators
  static validatePolicyCreation(data: unknown): ValidationResult {
    const schema = z.object({
      document: z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        rules: z.array(z.object({
          id: z.string(),
          name: z.string().min(1).max(255),
          condition: z.record(z.unknown()),
          action: z.object({
            id: z.string(),
            type: z.enum(['allow', 'deny', 'throttle', 'require_approval'])
          })
        })).min(1)
      }),
      organizationId: z.string().uuid().optional(),
      createdBy: this.DIDSchema.optional()
    });

    return this.validateAndSanitize(data, schema);
  }

  static validatePolicyEvaluation(data: unknown): ValidationResult {
    const schema = z.object({
      policyId: this.UUIDSchema,
      context: z.object({
        agentDID: this.DIDSchema,
        trustLevel: z.enum(['low', 'medium', 'high', 'critical']),
        tool: z.object({
          name: z.string().min(1).max(255),
          version: z.string().optional(),
          parameters: z.record(z.unknown()).optional()
        }),
        organizationId: z.string().uuid().optional(),
        timestamp: this.TimestampSchema.optional()
      })
    });

    return this.validateAndSanitize(data, schema);
  }

  static validatePermissionGrant(data: unknown): ValidationResult {
    const schema = z.object({
      granteeDID: this.DIDSchema,
      resource: z.string().min(1).max(255),
      permission: z.enum(['read', 'write', 'execute', 'admin']),
      duration: z.number().int().min(60).max(86400 * 365).optional(), // 1 minute to 1 year
      conditions: z.record(z.unknown()).optional()
    });

    return this.validateAndSanitize(data, schema);
  }

  static validateAuditEvent(data: unknown): ValidationResult {
    const schema = z.object({
      source: z.string().min(1).max(255),
      action: z.string().min(1).max(255),
      resource: z.string().min(1).max(255),
      actor: this.DIDSchema.optional(),
      metadata: z.record(z.unknown()).optional()
    });

    return this.validateAndSanitize(data, schema);
  }

  // Security checks
  static checkSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/|;|'|"|\||&)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static checkXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  static checkCommandInjection(input: string): boolean {
    const cmdPatterns = [
      /[;&|`$(){}]/,
      /\.\./,
      /(rm|ls|cat|grep|find|chmod|chown|sudo|su)\s/i,
      /(curl|wget|nc|netcat)\s/i
    ];

    return cmdPatterns.some(pattern => pattern.test(input));
  }

  static validateSecureInput(input: string): ValidationResult {
    const errors: string[] = [];

    if (this.checkSQLInjection(input)) {
      errors.push('Potential SQL injection detected');
    }

    if (this.checkXSS(input)) {
      errors.push('Potential XSS attack detected');
    }

    if (this.checkCommandInjection(input)) {
      errors.push('Potential command injection detected');
    }

    if (input.length > 50000) {
      errors.push('Input too large');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? this.sanitizeString(input) : null
    };
  }
}

// Middleware helper for Express
export function createValidationMiddleware<T>(
  validator: (data: unknown) => ValidationResult
) {
  return (req: any, res: any, next: any) => {
    const result = validator(req.body);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      });
    }

    req.validatedData = result.sanitizedData;
    next();
  };
}