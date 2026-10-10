import { z } from 'zod';

export const SyncStatusEnum = z.enum([
  'pending',
  'syncing',
  'synced',
  'failed'
]);

export type SyncStatus = z.infer<typeof SyncStatusEnum>;

export const OutboxItemSchema = z.object({
  id: z.string().uuid(),
  tableName: z.string().min(1),
  operation: z.enum(['INSERT', 'UPDATE', 'UPSERT']),
  clientUuid: z.string().uuid(),
  payload: z.record(z.string(), z.any()),
  status: SyncStatusEnum.default('pending'),
  retries: z.number().int().default(0),
  lastError: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
  syncedAt: z.string().datetime().nullable().default(null)
});

export type OutboxItem = z.infer<typeof OutboxItemSchema>;
