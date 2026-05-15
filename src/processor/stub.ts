import type { MessageProcessor, ProcessInput, ProcessResult } from '../../shared/contract';

export const stubProcessor: MessageProcessor = {
  async processMessage(_: ProcessInput): Promise<ProcessResult> {
    return {
      kind: 'query_answered',
      reply: 'Mensagem recebida. Processamento por IA ainda não está ativo.',
    };
  },
};
