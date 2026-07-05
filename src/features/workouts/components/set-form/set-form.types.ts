import type { Set } from '@/src/db/schema';
import type {
  SetValues,
  TrackingFieldDefinition
} from '@/src/features/progress/tracking.domain';

export type RowPhase = 'editing' | 'saving' | 'awaiting_sync' | 'error';

export interface DraftRowState {
  key: string;
  phase: RowPhase;
  createdSetId?: Set['id'];
}

export interface PersistedEditState {
  baselineValues: Record<string, string>;
  phase: RowPhase;
  savedValues?: SetValues;
  values: Record<string, string>;
}

export interface ActiveDurationPickerState {
  rowKey: string;
  field: TrackingFieldDefinition;
}

interface BaseRowView {
  animateOnMount: boolean;
  fieldValues: Record<string, string>;
  isCommitted: boolean;
  isSaving: boolean;
  order: Set['order'];
  previousSet: Set | undefined;
  setNumber: number;
  validatedValues: SetValues | undefined;
}

export interface PersistedSetFormRow extends BaseRowView {
  hasSavedChanges: boolean;
  key: Set['id'];
  kind: 'persisted';
  phase: RowPhase;
  set: Set;
}

export interface DraftSetFormRow extends BaseRowView {
  key: string;
  kind: 'draft';
  phase: RowPhase;
}

export type SetFormRow = DraftSetFormRow | PersistedSetFormRow;
