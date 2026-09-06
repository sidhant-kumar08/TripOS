/**
 * @file ai.schemas.ts
 * @description Strict JSON Schemas for AI structured outputs.
 * Compatible with Gemini response_schema specifications.
 */

export const EXPENSE_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: ['CREATE_EXPENSE', 'UNKNOWN'],
      description: 'Whether the user intent is creating an expense proposal',
    },
    amountMinor: {
      type: 'integer',
      description: 'Amount in minor currency units (e.g. 5000 INR = 500000 paise/cents). 5k = 500000.',
    },
    currency: {
      type: 'string',
      description: 'ISO currency code such as INR, USD, EUR. Default to INR if ₹ or unstated in Indian context.',
    },
    payerAlias: {
      type: 'string',
      description: 'The name or pronoun of who paid (e.g., "Rahul", "me", "I", "maine", "Priya").',
    },
    participantAliases: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of names/pronouns participating in the split (e.g. ["all", "Rahul", "Priya"]). Use ["all"] if split among all.',
    },
    excludedAliases: {
      type: 'array',
      items: { type: 'string' },
      description: 'Names explicitly excluded from split (e.g. if "except Rahul" is said).',
    },
    description: {
      type: 'string',
      description: 'Clean description of the expense item (e.g., "Hotel", "Dinner", "Cab").',
    },
    splitMode: {
      type: 'string',
      enum: ['EQUAL', 'EXACT', 'PERCENTAGE'],
      description: 'Default to EQUAL unless custom splits are explicitly specified.',
    },
    confidence: {
      type: 'number',
      description: 'Confidence score from 0.0 to 1.0.',
    },
    needsClarification: {
      type: 'boolean',
      description: 'True if amount or payer or participants are severely ambiguous or missing.',
    },
    clarificationQuestion: {
      type: 'string',
      description: 'Question to ask the user if needsClarification is true.',
    },
  },
  required: [
    'intent',
    'amountMinor',
    'currency',
    'payerAlias',
    'participantAliases',
    'description',
    'splitMode',
    'confidence',
    'needsClarification',
  ],
};

export const TASK_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: ['CREATE_TASK', 'UNKNOWN'],
      description: 'Whether user intends to create a task',
    },
    title: {
      type: 'string',
      description: 'Clear, concise actionable title for the task (e.g. "Book airport cab", "Check hotel check-in")',
    },
    assigneeAlias: {
      type: 'string',
      description: 'Name or pronoun of the person assigned (e.g. "Priya", "Rahul", "me", "I"). Empty if unassigned.',
    },
    dueDateISO: {
      type: 'string',
      description: 'Estimated ISO date or datetime string (YYYY-MM-DD) resolved relative to current date and context. Empty if not mentioned.',
    },
    priority: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      description: 'Priority inferred from urgency words (e.g. "urgent", "abhi", "immediately" -> URGENT)',
    },
    context: {
      type: 'string',
      description: 'Any additional notes or details extracted from the text.',
    },
    confidence: {
      type: 'number',
      description: 'Confidence score from 0.0 to 1.0',
    },
    needsClarification: {
      type: 'boolean',
      description: 'True if critical information is missing or contradictory.',
    },
    clarificationQuestion: {
      type: 'string',
      description: 'Clarification question if needsClarification is true.',
    },
  },
  required: ['intent', 'title', 'priority', 'confidence', 'needsClarification'],
};

export const BRIEFING_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '2 sentence executive briefing on current trip health and status.',
    },
    readinessNote: {
      type: 'string',
      description: 'Observation on trip readiness score and what is blocking full readiness.',
    },
    attentionHighlight: {
      type: 'string',
      description: 'Immediate pending or overdue item requiring user action.',
    },
    financialHighlight: {
      type: 'string',
      description: 'Concise summary of expense balance or who is owed.',
    },
    recommendedNextAction: {
      type: 'string',
      description: 'Singular highest-impact recommendation for the trip coordinator.',
    },
  },
  required: ['summary', 'readinessNote', 'attentionHighlight', 'financialHighlight', 'recommendedNextAction'],
};
