import type { WorkoutExercise, WorkoutTemplateExercise } from '@/src/db/schema';
import { generateUuid } from '@/src/lib/utils/uuid.utils';

type SupersetRow = {
  id: string;
  supersetId: string | null;
};

export type SupersetBlock<T extends SupersetRow> = {
  id: string;
  rows: T[];
  supersetId: string | null;
};

export function createSupersetId(): string {
  return generateUuid();
}

export function formatSupersetLetter(index: number): string {
  let value = index + 1;
  let label = '';

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

export function formatSupersetLabel(index: number): string {
  return `Superset ${formatSupersetLetter(index)}`;
}

export function normalizeSupersetRows<T extends SupersetRow>(rows: T[]): T[] {
  const counts = new Map<string, number>();
  const validSupersetIds = new Set<string>();

  for (const row of rows) {
    if (!row.supersetId) {
      continue;
    }

    counts.set(row.supersetId, (counts.get(row.supersetId) ?? 0) + 1);
  }

  rows.forEach((row, index) => {
    const nextRow = rows[index + 1];

    if (
      row.supersetId &&
      row.supersetId === nextRow?.supersetId &&
      counts.get(row.supersetId) === 2
    ) {
      validSupersetIds.add(row.supersetId);
    }
  });

  return rows.map(row =>
    row.supersetId && validSupersetIds.has(row.supersetId)
      ? row
      : { ...row, supersetId: null }
  );
}

export function groupSupersetBlocks<T extends SupersetRow>(
  rows: T[]
): SupersetBlock<T>[] {
  const normalizedRows = normalizeSupersetRows(rows);
  const blocks: SupersetBlock<T>[] = [];
  let index = 0;

  while (index < normalizedRows.length) {
    const row = normalizedRows[index];
    const nextRow = normalizedRows[index + 1];

    if (
      row.supersetId &&
      nextRow?.supersetId &&
      row.supersetId === nextRow.supersetId
    ) {
      blocks.push({
        id: row.supersetId,
        rows: [row, nextRow],
        supersetId: row.supersetId
      });
      index += 2;

      continue;
    }

    blocks.push({
      id: row.id,
      rows: [row],
      supersetId: null
    });
    index += 1;
  }

  return blocks;
}

export function flattenSupersetBlocks<T extends SupersetRow>(
  blocks: SupersetBlock<T>[]
): T[] {
  return blocks.flatMap(block => block.rows);
}

export function getSupersetLabelByRowId<T extends SupersetRow>(
  rows: T[]
): Map<T['id'], string> {
  let supersetIndex = 0;
  const labels = new Map<T['id'], string>();

  groupSupersetBlocks(rows).forEach(block => {
    if (!block.supersetId) {
      return;
    }

    const label = formatSupersetLabel(supersetIndex++);

    block.rows.forEach(row => {
      labels.set(row.id, label);
    });
  });

  return labels;
}

export function linkAdjacentSupersetRows<T extends SupersetRow>(
  rows: T[],
  firstRowId: T['id']
): T[] {
  const normalizedRows = normalizeSupersetRows(rows);
  const firstIndex = normalizedRows.findIndex(row => row.id === firstRowId);
  const nextRow = normalizedRows[firstIndex + 1];

  if (firstIndex < 0 || !nextRow) {
    return normalizedRows;
  }

  const firstRow = normalizedRows[firstIndex];

  if (firstRow.supersetId || nextRow.supersetId) {
    return normalizedRows;
  }

  const supersetId = createSupersetId();

  return normalizedRows.map((row, index) =>
    index === firstIndex || index === firstIndex + 1
      ? { ...row, supersetId }
      : row
  );
}

export function unlinkSupersetRows<T extends SupersetRow>(
  rows: T[],
  supersetId: string
): T[] {
  return rows.map(row =>
    row.supersetId === supersetId ? { ...row, supersetId: null } : row
  );
}

export type WorkoutSupersetFields = Pick<WorkoutExercise, 'id' | 'supersetId'>;

export type TemplateSupersetFields = Pick<
  WorkoutTemplateExercise,
  'id' | 'supersetId'
>;
