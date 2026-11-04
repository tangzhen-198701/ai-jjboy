export type ExecutionMode = 'draft' | 'limited-auto';

export interface ProjectPolicy {
  executionMode: ExecutionMode;
  requireVideoApproval: boolean;
  dailyReplyLimit: number;
  monthlyBudgetCny: number;
}

export const defaultPolicy: Readonly<ProjectPolicy> = Object.freeze({
  executionMode: 'limited-auto',
  requireVideoApproval: true,
  dailyReplyLimit: 20,
  monthlyBudgetCny: 500,
});

export * from './workspace.js';
