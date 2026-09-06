/**
 * @file gemini.provider.ts
 * @description Google Gemini AI provider implementation using Generative Language REST API.
 * Optimized for low latency, zero extraneous dependencies, and strict schema compliance.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIOptions } from './ai-provider.interface';
import { getAIConfig } from '../ai.config';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);

  /**
   * Verifies if Google Gemini is enabled and has a valid API key configured.
   * @returns boolean indicating operational readiness.
   */
  isAvailable(): boolean {
    const config = getAIConfig();
    return Boolean(config.apiKey && config.enabled);
  }

  /**
   * Executes a prompt against Google Gemini with strict JSON Schema output enforcement.
   * Uses the native `responseSchema` feature of the Gemini REST API to guarantee
   * 100% compliant structured JSON output.
   *
   * @template T The target structured interface.
   * @param prompt The user prompt accompanied by authorized domain context.
   * @param schema The JSON schema definition constraining the model's output.
   * @param options Optional tuning parameters (temperature, maxTokens, systemInstruction, timeout).
   * @returns Parsed JSON object strictly conforming to schema T.
   * @throws Error with 'AI_QUOTA_EXCEEDED' when HTTP 429 rate limit is received.
   * @throws Error with 'AI_TIMEOUT' if the request exceeds timeoutMs threshold.
   */
  async generateStructured<T>(prompt: string, schema: Record<string, any>, options?: AIOptions): Promise<T> {
    const config = getAIConfig();
    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not available or missing API key.');
    }

    const model = config.model;
    const apiKey = config.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: Record<string, any> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.1,
        maxOutputTokens: options?.maxTokens ?? config.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    };

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Gemini API error [${response.status}]: ${errorText.slice(0, 200)}`);
        if (response.status === 429) {
          throw new Error('AI_QUOTA_EXCEEDED');
        }
        throw new Error(`Gemini request failed: HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response received from Gemini');
      }

      return JSON.parse(rawText) as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      throw err;
    }
  }

  /**
   * Generates free-form natural language text from Gemini with strict timeout management.
   * Suitable for conversational Q&A and narrative briefings.
   *
   * @param prompt User prompt accompanied by contextual domain records.
   * @param options Optional tuning parameters (temperature, maxTokens, systemInstruction, timeout).
   * @returns Free-form text response string.
   */
  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    const config = getAIConfig();
    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not available or missing API key.');
    }

    const model = config.model;
    const apiKey = config.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body: Record<string, any> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? config.maxOutputTokens,
      },
    };

    if (options?.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 429) throw new Error('AI_QUOTA_EXCEEDED');
        throw new Error(`Gemini request failed: HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('AI_TIMEOUT');
      throw err;
    }
  }
}
