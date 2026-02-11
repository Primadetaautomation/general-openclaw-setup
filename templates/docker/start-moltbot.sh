#!/bin/bash
# Moltbot Docker Startup Script
# Simplified version for Docker deployments (no R2 mount/restore needed)
set -e

echo "=== Starting Moltbot (Docker) ==="
echo "Date: $(date)"
echo "Node: $(node --version)"
echo "OpenClaw: $(openclaw --version)"

# --- Configuration ---
CONFIG_DIR="/root/.openclaw"
TEMPLATE_DIR="/root/.openclaw-templates"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"
SKILLS_DIR="/root/clawd/skills"

# --- Initialize config from template if needed ---
if [ ! -f "$CONFIG_FILE" ]; then
    echo "No config found, initializing from template..."
    if [ -f "$TEMPLATE_DIR/moltbot.json.template" ]; then
        cp "$TEMPLATE_DIR/moltbot.json.template" "$CONFIG_FILE"
    else
        echo '{}' > "$CONFIG_FILE"
    fi
fi

# --- Update config from environment variables ---
echo "Updating configuration from environment..."

node --input-type=module << 'NODEEOF'
import fs from 'node:fs';

const configPath = '/root/.openclaw/openclaw.json';
let config = {};
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch {}

const env = process.env;

// Gateway configuration
config.gateway = config.gateway || {};
config.gateway.port = 18789;
config.gateway.mode = 'local';
config.gateway.trustedProxies = ['127.0.0.1', '::1', '172.16.0.0/12', '10.0.0.0/8'];

if (env.CLAWDBOT_GATEWAY_TOKEN || env.MOLTBOT_GATEWAY_TOKEN) {
    config.gateway.token = env.CLAWDBOT_GATEWAY_TOKEN || env.MOLTBOT_GATEWAY_TOKEN;
}

if (env.CLAWDBOT_DEV_MODE === 'true' || env.DEV_MODE === 'true') {
    config.gateway.devMode = true;
}

// Auto-compaction settings
config.autoCompact = config.autoCompact || {};
config.autoCompact.enabled = true;
config.autoCompact.maxTokens = (config.contextWindow || 200000) - 20000;

// Provider configuration
config.providers = config.providers || [];

// Anthropic
if (env.ANTHROPIC_API_KEY) {
    const existing = config.providers.findIndex(p => p.id === 'anthropic');
    const provider = {
        id: 'anthropic',
        type: 'anthropic',
        apiKey: env.ANTHROPIC_API_KEY,
        ...(env.ANTHROPIC_BASE_URL && { baseUrl: env.ANTHROPIC_BASE_URL }),
    };
    if (existing >= 0) config.providers[existing] = { ...config.providers[existing], ...provider };
    else config.providers.push(provider);
}

// OpenAI
if (env.OPENAI_API_KEY) {
    const existing = config.providers.findIndex(p => p.id === 'openai');
    const provider = {
        id: 'openai',
        type: 'openai',
        apiKey: env.OPENAI_API_KEY,
    };
    if (existing >= 0) config.providers[existing] = { ...config.providers[existing], ...provider };
    else config.providers.push(provider);
}

// Google Gemini
if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) {
    const existing = config.providers.findIndex(p => p.id === 'google');
    const provider = {
        id: 'google',
        type: 'google',
        apiKey: env.GEMINI_API_KEY || env.GOOGLE_API_KEY,
    };
    if (existing >= 0) config.providers[existing] = { ...config.providers[existing], ...provider };
    else config.providers.push(provider);
}

// Together AI
if (env.TOGETHER_API_KEY) {
    const existing = config.providers.findIndex(p => p.id === 'together');
    const provider = {
        id: 'together',
        type: 'openai',
        apiKey: env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/v1',
    };
    if (existing >= 0) config.providers[existing] = { ...config.providers[existing], ...provider };
    else config.providers.push(provider);
}

// xAI Grok
if (env.XAI_API_KEY) {
    const existing = config.providers.findIndex(p => p.id === 'xai');
    const provider = {
        id: 'xai',
        type: 'openai',
        apiKey: env.XAI_API_KEY,
        baseUrl: 'https://api.x.ai/v1',
    };
    if (existing >= 0) config.providers[existing] = { ...config.providers[existing], ...provider };
    else config.providers.push(provider);
}

// Channel configuration
config.channels = config.channels || [];

// Telegram
if (env.TELEGRAM_BOT_TOKEN) {
    const existing = config.channels.findIndex(c => c.type === 'telegram');
    const channel = {
        type: 'telegram',
        token: env.TELEGRAM_BOT_TOKEN,
        ...(env.TELEGRAM_WEBHOOK_URL && { webhookUrl: env.TELEGRAM_WEBHOOK_URL }),
        ...(env.TELEGRAM_WEBHOOK_SECRET && { webhookSecret: env.TELEGRAM_WEBHOOK_SECRET }),
        dmPolicy: env.TELEGRAM_DM_POLICY || 'pairing',
    };
    if (existing >= 0) config.channels[existing] = { ...config.channels[existing], ...channel };
    else config.channels.push(channel);
}

// Discord
if (env.DISCORD_BOT_TOKEN) {
    const existing = config.channels.findIndex(c => c.type === 'discord');
    const channel = {
        type: 'discord',
        token: env.DISCORD_BOT_TOKEN,
        dmPolicy: env.DISCORD_DM_POLICY || 'pairing',
    };
    if (existing >= 0) config.channels[existing] = { ...config.channels[existing], ...channel };
    else config.channels.push(channel);
}

// Slack
if (env.SLACK_BOT_TOKEN && env.SLACK_APP_TOKEN) {
    const existing = config.channels.findIndex(c => c.type === 'slack');
    const channel = {
        type: 'slack',
        botToken: env.SLACK_BOT_TOKEN,
        appToken: env.SLACK_APP_TOKEN,
    };
    if (existing >= 0) config.channels[existing] = { ...config.channels[existing], ...channel };
    else config.channels.push(channel);
}

// Skills directory
config.skills = config.skills || {};
config.skills.directory = '/root/clawd/skills';

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Config updated with', config.providers.length, 'providers and', config.channels.length, 'channels');
NODEEOF

# --- Start OpenClaw Gateway ---
echo ""
echo "Starting OpenClaw gateway on port 18789..."
exec openclaw gateway
