/**
 * @file mock.provider.ts
 * @description Zero-network heuristic provider for local development, hermetic testing, and fallback.
 * Employs deterministic regex heuristics to parse Indian colloquial expense and task inputs.
 */

import { Injectable } from '@nestjs/common';
import { AIProvider, AIOptions } from './ai-provider.interface';
import { RawExpenseExtraction, RawTaskExtraction } from '../ai.types';

/**
 * MockAIProvider serves as the deterministic, zero-network fallback and test engine.
 *
 * Core Architectural Roles:
 * 1. Hermetic Testing: Allows Jest tests to run fully offline without external API keys or rate limits.
 * 2. Zero-Cost Fallback: When the user's daily free Gemini quota is exhausted, the system automatically
 *    routes through here instead of generating unexpected credit card bills or throwing 500 crashes.
 * 3. Deterministic Parsing: Uses targeted regular expressions to extract Indian amounts (5k, 2 hazar),
 *    postposition payers ('Rahul ne', 'maine'), exclusion targets ('except Rahul'), and conversational dates ('kal').
 */
@Injectable()
export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  /**
   * The mock provider is always considered available as it relies solely on local CPU memory.
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Generates structured proposals by matching the expected schema properties
   * and delegating to the appropriate deterministic extraction heuristic.
   *
   * @param prompt The user text and authorized contextual member list.
   * @param schema The target JSON schema defining whether an expense, task, or briefing is requested.
   * @returns Deterministically extracted proposal matching the requested schema.
   */
  async generateStructured<T>(prompt: string, schema: Record<string, any>, _options?: AIOptions): Promise<T> {
    // 1. Detect Expense Intent: Schema requires amountMinor
    if (schema.properties?.amountMinor) {
      const parsedExpense = this.heuristicParseExpense(prompt);
      return parsedExpense as unknown as T;
    }

    // 2. Detect Task Intent: Schema requires title and priority
    if (schema.properties?.title && schema.properties?.priority) {
      const parsedTask = this.heuristicParseTask(prompt);
      return parsedTask as unknown as T;
    }

    // 3. Detect Briefing Intent: Schema requires summary and readinessNote
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

  /**
   * Generates grounded contextual answers based on user query and parsed authorized trip context.
   */
  async generateText(prompt: string, _options?: AIOptions): Promise<string> {
    // 1. Extract the actual User Question
    const qMatch = prompt.match(/User Question:\s*["']?([^"'\n]+)["']?/i);
    const userQuestion = qMatch ? qMatch[1].trim() : prompt.trim();
    const qLower = userQuestion.toLowerCase();

    // 2. Extract Context Elements from the prompt
    const tripMatch = prompt.match(/Trip:\s*"([^"]+)"(?:\s+to\s+([^.\n]+))?/i);
    const tripName = tripMatch ? tripMatch[1] : 'your trip';
    const destination = tripMatch && tripMatch[2] ? tripMatch[2].trim() : '';

    const pendingTasksMatch = prompt.match(/User's Pending Tasks:\s*([^\n]+)/i);
    const pendingTasksRaw = pendingTasksMatch ? pendingTasksMatch[1].trim() : 'None';
    const hasPendingTasks = pendingTasksRaw !== 'None' && pendingTasksRaw.length > 0;

    const totalTasksMatch = prompt.match(/Total Trip Tasks:\s*(\d+)\s*\(([^)]+)\)/i);
    const tasksDone = totalTasksMatch ? totalTasksMatch[2] : '';

    const totalExpensesMatch = prompt.match(/Total Group Expenses Recorded:\s*([^\n]+)/i);
    const totalExpenses = totalExpensesMatch ? totalExpensesMatch[1].trim() : '0.00 INR';

    const balanceMatch = prompt.match(/User Net Balance:\s*([^\n]+)/i);
    const userBalance = balanceMatch ? balanceMatch[1].trim() : '';

    // 3. Match Intent on User Question:

    // A. Tasks / "What do I need to do?" / "What is pending?" / "What should I pack/bring?"
    if (
      qLower.includes('do') ||
      qLower.includes('task') ||
      qLower.includes('pending') ||
      qLower.includes('need') ||
      qLower.includes('pack') ||
      qLower.includes('bring') ||
      qLower.includes('action') ||
      qLower.includes('todo')
    ) {
      if (hasPendingTasks) {
        return `Based on trip records for "${tripName}", you have pending tasks: ${pendingTasksRaw}. Make sure to complete them before departure!`;
      }
      return `Great news! You currently have no pending tasks assigned to you for "${tripName}". ${tasksDone ? `The group has ${tasksDone} overall.` : ''}`;
    }

    // B. Expenses / Balances / "Who owes me?" / "How much do I owe?" / "How much spent?"
    if (
      qLower.includes('owe') ||
      qLower.includes('balance') ||
      qLower.includes('money') ||
      qLower.includes('expense') ||
      qLower.includes('spend') ||
      qLower.includes('spent') ||
      qLower.includes('cost') ||
      qLower.includes('paid') ||
      qLower.includes('hisab') ||
      qLower.includes('paisa')
    ) {
      return `Your net balance for "${tripName}" is ${userBalance || 'balanced'}. Total group spend recorded is ${totalExpenses}. Check the Expenses tab for individual settlement pairs.`;
    }

    // C. Readiness / "Are we ready?" / "Status"
    if (
      qLower.includes('ready') ||
      qLower.includes('status') ||
      qLower.includes('progress') ||
      qLower.includes('prepared')
    ) {
      return `Trip readiness for "${tripName}": ${tasksDone || 'Tasks in progress'}, with ${totalExpenses} recorded in expenses. ${hasPendingTasks ? `You still have: ${pendingTasksRaw}.` : 'All your individual items are cleared!'}`;
    }

    // D. Itinerary / Dates / Destination / "Where are we going?" / "When are we leaving?"
    if (
      qLower.includes('where') ||
      qLower.includes('when') ||
      qLower.includes('date') ||
      qLower.includes('destination') ||
      qLower.includes('time') ||
      qLower.includes('plan') ||
      qLower.includes('schedule')
    ) {
      return `"${tripName}" ${destination ? `is heading to ${destination}` : ''}. You can view the full schedule and milestones in the Itinerary tab.`;
    }

    // E. General Fallback
    return `For "${tripName}", you have ${hasPendingTasks ? `pending tasks (${pendingTasksRaw})` : 'no urgent tasks assigned'} and a net balance of ${userBalance || '₹0'}. You can ask about tasks, expenses, or itinerary anytime!`;
  }

  /**
   * Deterministic heuristic parser for colloquial Indian expense text.
   */
  private heuristicParseExpense(input: string): RawExpenseExtraction {
    // Isolate actual user text if input was wrapped with trip member context
    let userText = input;
    if (input.includes('User Input to Parse:')) {
      const parts = input.split(/User Input to Parse:\s*/i);
      if (parts.length > 1) {
        userText = parts[parts.length - 1].replace(/^["'\s]+|["'\s]+$/g, '');
      }
    }
    const text = userText.trim();
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

    // Protect against PostgreSQL 32-bit integer overflow (max 2,147,483,647)
    const MAX_ALLOWED_MINOR = 2000000000;
    const calculatedMinor = Math.round(amountMajor * 100);
    const amountMinor = Math.min(calculatedMinor, MAX_ALLOWED_MINOR);

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
    let userText = input;
    if (input.includes('User Input to Parse:')) {
      const parts = input.split(/User Input to Parse:\s*/i);
      if (parts.length > 1) {
        userText = parts[parts.length - 1].replace(/^["'\s]+|["'\s]+$/g, '');
      }
    }
    const text = userText.trim();
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
