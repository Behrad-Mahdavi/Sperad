import { db } from './db';
import { supabase } from './supabase';
import type { OutboxItem } from '@sperad/shared';

let isSyncing = false;

/**
 * Enqueues an operation into the local outbox and immediately tries to sync if online.
 */
export async function enqueueOutbox(
  tableName: string,
  operation: 'INSERT' | 'UPDATE' | 'UPSERT',
  clientUuid: string,
  payload: Record<string, any>
): Promise<void> {
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    tableName,
    operation,
    clientUuid,
    payload,
    status: 'pending',
    retries: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    syncedAt: null
  };

  await db.outbox.put(item);

  // Trigger sync in the background
  syncOutbox().catch(console.error);
}

/**
 * Processes all pending items in the outbox in FIFO order.
 */
export async function syncOutbox(): Promise<{ processed: number; errors: number }> {
  if (isSyncing) return { processed: 0, errors: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, errors: 0 };
  }

  isSyncing = true;
  let processed = 0;
  let errors = 0;

  try {
    const pendingItems = await db.outbox
      .where('status')
      .anyOf(['pending', 'failed'])
      .sortBy('createdAt');

    for (const item of pendingItems) {
      try {
        await db.outbox.update(item.id, { status: 'syncing' });

        // Idempotent upsert via client_uuid
        const { error } = await (supabase.from(item.tableName as any) as any).upsert(
          item.payload,
          { onConflict: item.tableName === 'daily_checkins' ? 'user_id,checkin_date' : 'client_uuid' }
        );

        if (error) {
          throw error;
        }

        // Successfully synced
        await db.outbox.update(item.id, {
          status: 'synced',
          syncedAt: new Date().toISOString(),
          lastError: null
        });
        processed++;
      } catch (err: any) {
        errors++;
        await db.outbox.update(item.id, {
          status: 'failed',
          retries: item.retries + 1,
          lastError: err?.message || 'Unknown network error'
        });
      }
    }
  } finally {
    isSyncing = false;
  }

  return { processed, errors };
}

// Auto-register network listeners in browser environment
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOutbox().catch(console.error);
  });
}
