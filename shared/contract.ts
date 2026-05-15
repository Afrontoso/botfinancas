export interface ProcessInput {
  userId: string;
  text: string;
  receivedAt: Date;
  messageLogId: string;
}

export type ProcessResult =
  | {
      kind: 'transaction_created';
      transactionIds: string[];
      transferGroupId?: string;
      reply: string;
    }
  | {
      kind: 'needs_confirmation';
      draftIds: string[];
      reply: string;
    }
  | {
      kind: 'query_answered';
      reply: string;
    }
  | {
      kind: 'error';
      reply: string;
      reason: string;
    };

export interface MessageProcessor {
  processMessage(input: ProcessInput): Promise<ProcessResult>;
}
