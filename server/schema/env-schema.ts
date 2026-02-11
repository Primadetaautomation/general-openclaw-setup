export type VarType = 'token' | 'api_key' | 'url' | 'string' | 'boolean' | 'enum';
export type Platform = 'both' | 'cloudflare' | 'docker';

export interface EnvVarDef {
  key: string;
  type: VarType;
  required: boolean;
  description: string;
  hint?: string;
  pattern?: RegExp;
  default?: string;
  options?: string[];
  generate?: boolean;
  platform: Platform;
}

export interface EnvCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
  vars: EnvVarDef[];
}

export const ENV_SCHEMA: EnvCategory[] = [
  {
    id: 'core',
    label: 'Core Settings',
    description: 'Essential configuration for your Moltbot instance',
    icon: 'settings',
    vars: [
      {
        key: 'MOLTBOT_GATEWAY_TOKEN',
        type: 'token',
        required: true,
        description: 'Token to protect gateway access',
        hint: 'Click generate for a secure random token',
        generate: true,
        platform: 'both',
      },
      {
        key: 'DEV_MODE',
        type: 'boolean',
        required: false,
        description: 'Skip authentication in development',
        default: 'false',
        platform: 'both',
      },
      {
        key: 'DEBUG_ROUTES',
        type: 'boolean',
        required: false,
        description: 'Enable /debug/* diagnostic routes',
        default: 'false',
        platform: 'both',
      },
      {
        key: 'SANDBOX_SLEEP_AFTER',
        type: 'string',
        required: false,
        description: 'Container sleep timeout (never, 10m, 1h)',
        default: 'never',
        platform: 'cloudflare',
      },
    ],
  },
  {
    id: 'ai_providers',
    label: 'AI Providers',
    description: 'Configure at least one AI provider for Moltbot',
    icon: 'brain',
    vars: [
      {
        key: 'ANTHROPIC_API_KEY',
        type: 'api_key',
        required: false,
        description: 'Anthropic API key for Claude models',
        hint: 'Get yours at console.anthropic.com',
        pattern: /^sk-ant-/,
        platform: 'both',
      },
      {
        key: 'ANTHROPIC_BASE_URL',
        type: 'url',
        required: false,
        description: 'Custom Anthropic API endpoint',
        hint: 'Leave empty for default api.anthropic.com',
        platform: 'both',
      },
      {
        key: 'OPENAI_API_KEY',
        type: 'api_key',
        required: false,
        description: 'OpenAI API key',
        hint: 'Get yours at platform.openai.com',
        pattern: /^sk-/,
        platform: 'both',
      },
      {
        key: 'GEMINI_API_KEY',
        type: 'api_key',
        required: false,
        description: 'Google Gemini API key',
        pattern: /^AIza/,
        platform: 'both',
      },
      {
        key: 'GOOGLE_API_KEY',
        type: 'api_key',
        required: false,
        description: 'Google API key (native Moltbot support)',
        platform: 'both',
      },
      {
        key: 'TOGETHER_API_KEY',
        type: 'api_key',
        required: false,
        description: 'Together AI (GLM-4.7, Kimi K2.5, DeepSeek, Qwen)',
        platform: 'both',
      },
      {
        key: 'XAI_API_KEY',
        type: 'api_key',
        required: false,
        description: 'xAI Grok API key',
        platform: 'both',
      },
    ],
  },
  {
    id: 'ai_gateway',
    label: 'AI Gateway',
    description: 'Route API calls through Cloudflare AI Gateway for analytics & caching',
    icon: 'gateway',
    vars: [
      {
        key: 'AI_GATEWAY_API_KEY',
        type: 'api_key',
        required: false,
        description: 'API key for the provider configured in AI Gateway',
        platform: 'cloudflare',
      },
      {
        key: 'AI_GATEWAY_BASE_URL',
        type: 'url',
        required: false,
        description: 'AI Gateway URL endpoint',
        hint: 'e.g. https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic',
        platform: 'cloudflare',
      },
    ],
  },
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Protect your Moltbot instance from unauthorized access',
    icon: 'lock',
    vars: [
      {
        key: 'CF_ACCESS_TEAM_DOMAIN',
        type: 'string',
        required: false,
        description: 'Cloudflare Access team domain',
        hint: 'e.g. myteam.cloudflareaccess.com',
        platform: 'cloudflare',
      },
      {
        key: 'CF_ACCESS_AUD',
        type: 'string',
        required: false,
        description: 'Cloudflare Access application audience tag',
        platform: 'cloudflare',
      },
      {
        key: 'AUTH_USER',
        type: 'string',
        required: false,
        description: 'Basic auth username for admin access',
        hint: 'Used by Caddy reverse proxy',
        platform: 'docker',
      },
      {
        key: 'AUTH_PASSWORD',
        type: 'token',
        required: false,
        description: 'Basic auth password for admin access',
        platform: 'docker',
      },
    ],
  },
  {
    id: 'chat_platforms',
    label: 'Chat Platforms',
    description: 'Connect Moltbot to messaging platforms (all optional)',
    icon: 'chat',
    vars: [
      {
        key: 'TELEGRAM_BOT_TOKEN',
        type: 'string',
        required: false,
        description: 'Telegram bot token from @BotFather',
        platform: 'both',
      },
      {
        key: 'TELEGRAM_WEBHOOK_URL',
        type: 'url',
        required: false,
        description: 'Telegram webhook URL (auto-set from domain)',
        platform: 'both',
      },
      {
        key: 'TELEGRAM_WEBHOOK_SECRET',
        type: 'token',
        required: false,
        description: 'Secret for webhook validation',
        generate: true,
        platform: 'both',
      },
      {
        key: 'TELEGRAM_DM_POLICY',
        type: 'enum',
        required: false,
        description: 'Who can DM the Telegram bot',
        options: ['pairing', 'open', 'allowlist'],
        default: 'pairing',
        platform: 'both',
      },
      {
        key: 'DISCORD_BOT_TOKEN',
        type: 'string',
        required: false,
        description: 'Discord bot token',
        platform: 'both',
      },
      {
        key: 'DISCORD_DM_POLICY',
        type: 'enum',
        required: false,
        description: 'Who can DM the Discord bot',
        options: ['pairing', 'open', 'allowlist'],
        default: 'pairing',
        platform: 'both',
      },
      {
        key: 'SLACK_BOT_TOKEN',
        type: 'string',
        required: false,
        description: 'Slack bot token (xoxb-...)',
        pattern: /^xoxb-/,
        platform: 'both',
      },
      {
        key: 'SLACK_APP_TOKEN',
        type: 'string',
        required: false,
        description: 'Slack app token (xapp-...)',
        pattern: /^xapp-/,
        platform: 'both',
      },
    ],
  },
  {
    id: 'storage',
    label: 'Persistent Storage',
    description: 'Keep your data across restarts',
    icon: 'database',
    vars: [
      {
        key: 'R2_ACCESS_KEY_ID',
        type: 'string',
        required: false,
        description: 'R2 API token access key ID',
        platform: 'cloudflare',
      },
      {
        key: 'R2_SECRET_ACCESS_KEY',
        type: 'string',
        required: false,
        description: 'R2 API token secret access key',
        platform: 'cloudflare',
      },
      {
        key: 'CF_ACCOUNT_ID',
        type: 'string',
        required: false,
        description: 'Cloudflare account ID (for R2 endpoint)',
        platform: 'cloudflare',
      },
    ],
  },
  {
    id: 'browser',
    label: 'Browser Rendering',
    description: 'Enable web browsing and screenshot capabilities',
    icon: 'globe',
    vars: [
      {
        key: 'CDP_SECRET',
        type: 'token',
        required: false,
        description: 'Shared secret for CDP endpoint authentication',
        generate: true,
        platform: 'both',
      },
      {
        key: 'WORKER_URL',
        type: 'url',
        required: false,
        description: 'Public URL of your Moltbot instance',
        hint: 'e.g. https://moltbot.example.com',
        platform: 'both',
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Connect to external services (all optional)',
    icon: 'plug',
    vars: [
      {
        key: 'LATE_API_KEY',
        type: 'api_key',
        required: false,
        description: 'Late.dev social media API key',
        platform: 'both',
      },
      {
        key: 'RECRUITFLOW_ANON_KEY',
        type: 'string',
        required: false,
        description: 'RecruitFlow Supabase anonymous key',
        platform: 'both',
      },
      {
        key: 'RECRUITFLOW_SERVICE_KEY',
        type: 'string',
        required: false,
        description: 'RecruitFlow Supabase service role key',
        platform: 'both',
      },
      {
        key: 'RECRUITFLOW_API_URL',
        type: 'url',
        required: false,
        description: 'RecruitFlow Supabase API URL',
        platform: 'both',
      },
      {
        key: 'RECRUITFLOW_MCP_TOKEN',
        type: 'string',
        required: false,
        description: 'RecruitFlow MCP API token (mcp_xxx format)',
        pattern: /^mcp_/,
        platform: 'both',
      },
      {
        key: 'RECRUITFLOW_MCP_URL',
        type: 'url',
        required: false,
        description: 'RecruitFlow MCP SSE endpoint',
        platform: 'both',
      },
      {
        key: 'LINKEDIN_CLIENT_ID',
        type: 'string',
        required: false,
        description: 'LinkedIn app client ID',
        platform: 'both',
      },
      {
        key: 'LINKEDIN_CLIENT_SECRET',
        type: 'string',
        required: false,
        description: 'LinkedIn app client secret',
        platform: 'both',
      },
      {
        key: 'LINKEDIN_ACCESS_TOKEN',
        type: 'string',
        required: false,
        description: 'LinkedIn access token',
        platform: 'both',
      },
    ],
  },
  {
    id: 'domain',
    label: 'Domain & SSL',
    description: 'Configure your public domain (Docker/VPS only)',
    icon: 'world',
    vars: [
      {
        key: 'DOMAIN',
        type: 'string',
        required: false,
        description: 'Your public domain name',
        hint: 'e.g. moltbot.example.com',
        platform: 'docker',
      },
      {
        key: 'ACME_EMAIL',
        type: 'string',
        required: false,
        description: 'Email for Let\'s Encrypt SSL certificates',
        platform: 'docker',
      },
    ],
  },
];

export function getSchemaForPlatform(platform: 'cloudflare' | 'docker'): EnvCategory[] {
  return ENV_SCHEMA.map((category) => ({
    ...category,
    vars: category.vars.filter(
      (v) => v.platform === 'both' || v.platform === platform
    ),
  })).filter((category) => category.vars.length > 0);
}

export function getAllVarKeys(): string[] {
  return ENV_SCHEMA.flatMap((c) => c.vars.map((v) => v.key));
}

export function getRequiredVars(platform: 'cloudflare' | 'docker'): EnvVarDef[] {
  return ENV_SCHEMA.flatMap((c) => c.vars).filter(
    (v) => v.required && (v.platform === 'both' || v.platform === platform)
  );
}
