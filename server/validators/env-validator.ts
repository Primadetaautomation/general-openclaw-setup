import { ENV_SCHEMA, type EnvVarDef, type Platform } from '../schema/env-schema.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidationWarning {
  key: string;
  message: string;
}

export function validateEnvVars(
  vars: Record<string, string>,
  platform: 'cloudflare' | 'docker'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const allVars = ENV_SCHEMA.flatMap((c) => c.vars).filter(
    (v) => v.platform === 'both' || v.platform === platform
  );

  // Check required fields
  for (const varDef of allVars) {
    if (varDef.required && !vars[varDef.key]?.trim()) {
      errors.push({
        key: varDef.key,
        message: `${varDef.key} is required`,
      });
    }
  }

  // Check at least one AI provider
  const aiProviderKeys = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'TOGETHER_API_KEY',
    'XAI_API_KEY',
    'AI_GATEWAY_API_KEY',
  ];
  const hasAiProvider = aiProviderKeys.some((k) => vars[k]?.trim());
  if (!hasAiProvider) {
    errors.push({
      key: 'ai_providers',
      message: 'At least one AI provider API key is required',
    });
  }

  // Validate individual field patterns
  for (const varDef of allVars) {
    const value = vars[varDef.key]?.trim();
    if (!value) continue;

    if (varDef.pattern && !varDef.pattern.test(value)) {
      warnings.push({
        key: varDef.key,
        message: `${varDef.key} doesn't match expected format (${varDef.pattern.source})`,
      });
    }

    if (varDef.type === 'url') {
      try {
        new URL(value);
      } catch {
        errors.push({
          key: varDef.key,
          message: `${varDef.key} is not a valid URL`,
        });
      }
    }

    if (varDef.type === 'boolean' && !['true', 'false'].includes(value)) {
      errors.push({
        key: varDef.key,
        message: `${varDef.key} must be "true" or "false"`,
      });
    }

    if (varDef.type === 'enum' && varDef.options && !varDef.options.includes(value)) {
      errors.push({
        key: varDef.key,
        message: `${varDef.key} must be one of: ${varDef.options.join(', ')}`,
      });
    }
  }

  // Cross-field validations
  if (vars['AI_GATEWAY_API_KEY']?.trim() && !vars['AI_GATEWAY_BASE_URL']?.trim()) {
    errors.push({
      key: 'AI_GATEWAY_BASE_URL',
      message: 'AI Gateway Base URL is required when AI Gateway API Key is set',
    });
  }

  if (vars['SLACK_BOT_TOKEN']?.trim() && !vars['SLACK_APP_TOKEN']?.trim()) {
    warnings.push({
      key: 'SLACK_APP_TOKEN',
      message: 'Slack App Token is recommended when Slack Bot Token is set',
    });
  }

  // R2 cross-field: all 3 required together
  const r2Keys = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'CF_ACCOUNT_ID'];
  const r2Set = r2Keys.filter((k) => vars[k]?.trim());
  if (r2Set.length > 0 && r2Set.length < 3) {
    const missing = r2Keys.filter((k) => !vars[k]?.trim());
    for (const key of missing) {
      errors.push({
        key,
        message: `${key} is required when using R2 storage (all 3 R2 fields must be set together)`,
      });
    }
  }

  // Docker-specific: recommend auth
  if (platform === 'docker') {
    if (!vars['AUTH_USER']?.trim() && !vars['DEV_MODE']?.trim()) {
      warnings.push({
        key: 'AUTH_USER',
        message: 'Setting up authentication is strongly recommended for production',
      });
    }
    if (vars['DOMAIN']?.trim() && !vars['ACME_EMAIL']?.trim()) {
      warnings.push({
        key: 'ACME_EMAIL',
        message: 'ACME email is recommended for automatic SSL certificates',
      });
    }
  }

  // Cloudflare-specific: recommend CF Access
  if (platform === 'cloudflare') {
    if (!vars['CF_ACCESS_TEAM_DOMAIN']?.trim() && !vars['DEV_MODE']?.trim()) {
      warnings.push({
        key: 'CF_ACCESS_TEAM_DOMAIN',
        message: 'Cloudflare Access is strongly recommended for production',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateSingleVar(
  key: string,
  value: string
): { valid: boolean; message?: string } {
  const varDef = ENV_SCHEMA.flatMap((c) => c.vars).find((v) => v.key === key);
  if (!varDef) return { valid: true };

  if (!value.trim()) {
    return varDef.required
      ? { valid: false, message: 'This field is required' }
      : { valid: true };
  }

  if (varDef.pattern && !varDef.pattern.test(value)) {
    return { valid: false, message: `Doesn't match expected format` };
  }

  if (varDef.type === 'url') {
    try {
      new URL(value);
    } catch {
      return { valid: false, message: 'Invalid URL' };
    }
  }

  return { valid: true };
}
