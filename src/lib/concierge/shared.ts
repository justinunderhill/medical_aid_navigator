import type { ChatMessage } from '@/lib/ai/types';
import type { PlanAnswerSegment } from '@/lib/plan/answer';

export interface ConciergeReply {
  segments: PlanAnswerSegment[];
  links: { label: string; href: string }[];
  isEmergency?: boolean;
}
export interface ConciergeTurn {
  question: string;
  reply: ConciergeReply;
}

/** Reject malformed or oversized history instead of silently changing its meaning. */
export function parseHistory(raw: string): ChatMessage[] {
  if (raw.length > 32000) throw new Error('Conversation is too long. Start a new chat.');
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 12 || value.length % 2) throw new Error('Invalid conversation.');
  return value.map((item, index) => {
    if (!item || item.role !== (index % 2 === 0 ? 'user' : 'assistant') ||
        typeof item.content !== 'string' || !item.content.trim() || item.content.length > 3000) {
      throw new Error('Invalid conversation.');
    }
    return { role: item.role, content: item.content };
  });
}
