/**
 * @file mock.provider.ts
 * @description Zero-network heuristic provider for local development, hermetic testing, and fallback.
 * Employs deterministic regex heuristics to parse Indian colloquial expense and task inputs.
 */

import { Injectable } from '@nestjs/common';
import { AIProvider, AIOptions } from './ai-provider.interface';
import { RawExpenseExtraction, RawTaskExtraction } from '../ai.types';

@Injectable()
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  isAvailable(): boolean {
    return true;
  }

  async generateStructured<T>(prompt: string, schema: Record<string, any>, _options?: AIOptions): Promise<T> {
    // 1. Detect Expense Intent
    if (schema.properties?.amountMinor) {
      const parsedExpense = this.heuristicParseExpense(prompt);
      return parsedExpense as unknown as T;
    }

    // 2. Detect Task Intent
    if (schema.properties?.title && schema.properties?.priority) {
      const parsedTask = this.heuristicParseTask(prompt);
      return parsedTask as unknown as T;
    }

    // 3. Detect Briefing Intent
    if (schema.properties?.summary && schema.properties?.readinessNote) {
      return {
        summary: 'Trip preparation is actively advancing. Critical tasks and expenses are tracking on schedule.',
        readinessNote: 'Readiness score reflects pending group confirmations and transport booking completion.',
        attentionHighlight: 'Review outstanding group tasks and unconfirmed invitations.',
        financialHighlight: 'All recorded group expenses are split and balances calculated.',
        recommendedNextAction: 'Settle pending obligations and finalize departure timeline.',
      } as unknown as T;
    }

    throw new Error('Unsupported schema in MockAIProvider');
  }

  async generateText(prompt: string, _options?: AIOptions): Promise<string> {
    const lower = prompt.toLowerCase();
    if (lower.includes('owe') || lower.includes('balance') || lower.includes('money')) {
      return 'Based on current trip records, check the Expenses tab for individual net balances and settlement suggestions.';
    }
    if (lower.includes('task') || lower.includes('pending') || lower.includes('do')) {
      return 'You have active tasks visible under Next Up in the Command Center. Complete pending transport items first.';
    }
    if (lower.includes('ready') || lower.includes('readiness')) {
      return 'Trip readiness is progressing well. Ensure all travel documents are saved in the Vault and pending tasks are assigned.';
    }
    return 'TripOS is tracking your trip progress. You can manage expenses, itinerary activities, and vault documents anytime.';
  }

  /**
   * Deterministic heuristic parser for colloquial Indian expense text.
   */
  private heuristicParseExpense(input: string): RawExpenseExtraction {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Parse Amount: e.g. 5000, 5k, 5 k, 2 hazar, 2.5k, rs 500, ₹5000
    let amountMajor = 0;
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|hazar|thousand)/);
    const rsMatch = lower.match(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)/);
    const numMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|rupaye|bucks)?/);

    if (kMatch) {
      amountMajor = parseFloat(kMatch[1]) * 1000;
    } else if (rsMatch) {
      amountMajor = parseFloat(rsMatch[1]);
    } else if (numMatch) {
      amountMajor = parseFloat(numMatch[1]);
    }

    const amountMinor = Math.round(amountMajor * 100);

    // 2. Parse Payer
    let payerAlias = 'me';
    const neMatch = text.match(/([A-Z][a-z]+)\s+ne/i);
    const paidByMatch = lower.match(/([a-z]+)\s+paid/i);

    if (neMatch && !['hotel', 'cab', 'bill'].includes(neMatch[1].toLowerCase())) {
      payerAlias = neMatch[1];
    } else if (paidByMatch && !['i', 'we', 'hotel'].includes(paidByMatch[1])) {
      payerAlias = paidByMatch[1];
    } else if (lower.includes('maine') || lower.includes('i paid') || lower.includes('i gave')) {
      payerAlias = 'me';
    }

    // 3. Parse Description: hotel, dinner, cab, airport, food, drinks, tickets
    let description = 'Trip expense';
    if (lower.includes('hotel')) description = 'Hotel';
    else if (lower.includes('dinner')) description = 'Dinner';
    else if (lower.includes('lunch')) description = 'Lunch';
    else if (lower.includes('cab') || lower.includes('taxi') || lower.includes('uber')) description = 'Cab';
    else if (lower.includes('flight') || lower.includes('ticket')) description = 'Tickets';
    else if (lower.includes('food') || lower.includes('snack')) description = 'Food';

    // 4. Parse Exclusions and Participants
    const excludedAliases: string[] = [];
    const exceptMatch = lower.match(/except\s+([a-z]+)/i);
    if (exceptMatch) {
      excludedAliases.push(exceptMatch[1]);
    }

    const participantAliases = ['all'];

    // 5. Ambiguity check
    const needsClarification = amountMinor <= 0;
    const clarificationQuestion = needsClarification ? 'Could you please specify the amount spent?' : undefined;

    return {
      intent: 'CREATE_EXPENSE',
      amountMinor: amountMinor > 0 ? amountMinor : 0,
      currency: 'INR',
      payerAlias,
      participantAliases,
      excludedAliases: excludedAliases.length > 0 ? excludedAliases : undefined,
      description,
      splitMode: 'EQUAL',
      confidence: amountMinor > 0 ? 0.95 : 0.4,
      needsClarification,
      clarificationQuestion,
    };
  }

  /**
   * Deterministic heuristic parser for colloquial Indian task text.
   */
  private heuristicParseTask(input: string): RawTaskExtraction {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Title inference
    let title = text;
    if (lower.includes('airport')) title = 'Airport transfer / pickup';
    else if (lower.includes('cab') || lower.includes('taxi')) title = 'Book cab';
    else if (lower.includes('hotel') || lower.includes('check-in')) title = 'Confirm hotel check-in';
    else if (lower.includes('ticket')) title = 'Book tickets';
    else if (lower.includes('shoes') || lower.includes('pack')) title = 'Pack essentials';

    // 2. Assignee inference
    let assigneeAlias: string | undefined = undefined;
    const bolDenaMatch = text.match(/([A-Z][a-z]+)\s+ko\s+/i);
    const byMatch = text.match(/by\s+([A-Z][a-z]+)/i);

    if (bolDenaMatch) {
      assigneeAlias = bolDenaMatch[1];
    } else if (byMatch) {
      assigneeAlias = byMatch[1];
    }

    // 3. Priority
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    if (lower.includes('urgent') || lower.includes('abhi') || lower.includes('asap')) {
      priority = 'URGENT';
    } else if (lower.includes('kal') || lower.includes('tomorrow') || lower.includes('aaj')) {
      priority = 'HIGH';
    }

    // 4. Due date
    let dueDateISO: string | undefined = undefined;
    const now = new Date();
    if (lower.includes('kal') || lower.includes('tomorrow')) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      dueDateISO = tomorrow.toISOString().split('T')[0];
    } else if (lower.includes('aaj') || lower.includes('today')) {
      dueDateISO = now.toISOString().split('T')[0];
    }

    return {
      intent: 'CREATE_TASK',
      title,
      assigneeAlias,
      dueDateISO,
      priority,
      confidence: 0.9,
      needsClarification: false,
    };
  }
}
