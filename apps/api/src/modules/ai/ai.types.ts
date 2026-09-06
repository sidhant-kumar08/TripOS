/**
 * @file ai.types.ts
 * @description Type definitions and DTOs for the TripOS AI layer.
 */

export type SplitMode = 'EQUAL' | 'EXACT' | 'PERCENTAGE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ResolvedMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  matchScore: number;
}

export interface RawExpenseExtraction {
  intent: 'CREATE_EXPENSE' | 'UNKNOWN';
  amountMinor: number;
  currency: string;
  payerAlias: string;
  participantAliases: string[];
  excludedAliases?: string[];
  description: string;
  splitMode: SplitMode;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

export interface ExpenseProposal {
  rawExtraction: RawExpenseExtraction;
  amountMinor: number;
  currency: string;
  description: string;
  payer: ResolvedMember | null;
  participants: ResolvedMember[];
  splitMode: SplitMode;
  confidence: number;
  needsClarification: boolean;
  clarificationMessage?: string;
  unresolvedAliases: string[];
}

export interface RawTaskExtraction {
  intent: 'CREATE_TASK' | 'UNKNOWN';
  title: string;
  assigneeAlias?: string;
  dueDateISO?: string;
  priority: TaskPriority;
  context?: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

export interface TaskProposal {
  rawExtraction: RawTaskExtraction;
  title: string;
  assignee: ResolvedMember | null;
  dueDate: string | null;
  priority: TaskPriority;
  context?: string;
  confidence: number;
  needsClarification: boolean;
  clarificationMessage?: string;
}

export interface AskTripOSResponse {
  question: string;
  answer: string;
  suggestedActions: Array<{
    label: string;
    actionType: 'NAVIGATE' | 'VIEW_EXPENSE' | 'VIEW_TASK' | 'VIEW_READINESS';
    targetPath?: string;
  }>;
}

export interface TripBriefingResponse {
  summary: string;
  readinessNote: string;
  attentionHighlight: string;
  financialHighlight: string;
  recommendedNextAction: string;
  generatedAt: string;
}
