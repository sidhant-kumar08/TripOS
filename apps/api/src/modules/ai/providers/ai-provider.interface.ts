/**
 * @file ai-provider.interface.ts
 * @description Provider-agnostic abstraction for AI capabilities in TripOS.
 * Shields business logic from provider-specific SDKs and APIs.
 */

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
}

export interface AIProvider {
  readonly name: string;

  /**
   * Generates structured data strictly conforming to the provided JSON schema.
   */
  generateStructured<T>(prompt: string, schema: Record<string, any>, options?: AIOptions): Promise<T>;

  /**
   * Generates free-form natural language text.
   */
  generateText(prompt: string, options?: AIOptions): Promise<string>;

  /**
   * Checks whether the provider is currently available and configured.
   */
  isAvailable(): boolean;
}
