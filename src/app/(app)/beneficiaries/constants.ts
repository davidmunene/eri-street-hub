import type { Stage } from '@prisma/client';
import type { Tone } from '@/components/ui';

export const STAGE_TONES: Record<Stage, Tone> = {
  HELPING_HAND: 'slate', IDENTIFICATION: 'amber', ACCESS_REHABILITATION: 'sky', REINTEGRATION: 'violet', RESOCIALIZATION: 'brand', GRADUATED: 'leaf',
};
