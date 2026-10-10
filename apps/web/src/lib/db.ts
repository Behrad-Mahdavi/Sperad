import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  WorkoutSession,
  Set as WorkoutSet,
  DailyCheckin,
  BodyMetrics,
  OutboxItem
} from '@sperad/shared';

export class SperadDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  sessions!: Table<WorkoutSession, string>;
  sets!: Table<WorkoutSet, string>;
  dailyCheckins!: Table<DailyCheckin, string>;
  bodyMetrics!: Table<BodyMetrics, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('SperadAppDB');
    this.version(1).stores({
      exercises: 'id, movementPattern, equipment',
      sessions: 'clientUuid, startedAt, completedAt',
      sets: 'clientUuid, sessionId, exerciseId, performedAt',
      dailyCheckins: 'checkinDate',
      bodyMetrics: 'id, recordedAt',
      outbox: 'id, clientUuid, tableName, status, createdAt'
    });
  }
}

export const db = new SperadDatabase();
