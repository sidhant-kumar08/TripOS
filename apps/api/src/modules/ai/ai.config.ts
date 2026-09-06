/**
 * @file ai.config.ts
 * @description Centralized configuration for TripOS AI layer.
 * Enforces ₹0 budget rules, rate limits, and fallback defaults.
 */

export interface AIConfig {
  provider: 'gemini' | 'mock';
  apiKey?: string;
  model: string;
  enabled: boolean;
  maxOutputTokens: number;
  dailyRequestLimit: number;
  perUserDailyLimit: number;
  timeoutMs: number;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || (process.env.AI_API_KEY || process.env.GEMINI_API_KEY ? 'gemini' : 'mock')) as 'gemini' | 'mock';
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
  const model = process.env.AI_MODEL || 'gemini-3.6-flash';
  const enabled = process.env.AI_ENABLED !== 'false';
  const maxOutputTokens = parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '1024', 10);
  const dailyRequestLimit = parseInt(process.env.AI_DAILY_REQUEST_LIMIT || '200', 10);
  const perUserDailyLimit = parseInt(process.env.AI_PER_USER_DAILY_LIMIT || '50', 10);
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '12000', 10);

  return {
    provider,
    apiKey,
    model,
    enabled,
    maxOutputTokens,
    dailyRequestLimit,
    perUserDailyLimit,
    timeoutMs,
  };
}
