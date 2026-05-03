import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Keyboard, type TextInput } from 'react-native';

interface WorkoutRenameFlowParams<TWorkout extends { name: string }> {
  workout: TWorkout;
  renameWorkout: (workout: TWorkout, name: string) => TWorkout | undefined;
}

interface WorkoutRenameFlowResult {
  inputRef: RefObject<TextInput | null>;
  name: string;
  draftName: string;
  renameError: string | undefined;
  isRenaming: boolean;
  isSavingRename: boolean;
  beginRename: () => void;
  cancelRename: () => void;
  setDraftName: (name: string) => void;
  submitRename: () => void;
}

export function useWorkoutRenameFlow<TWorkout extends { name: string }>({
  workout,
  renameWorkout
}: WorkoutRenameFlowParams<TWorkout>): WorkoutRenameFlowResult {
  const inputRef = useRef<TextInput>(null);
  const isSavingRenameRef = useRef(false);

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftNameState] = useState('');
  const draftNameRef = useRef(draftName);
  const [renameError, setRenameError] = useState<string | undefined>();
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [optimisticWorkoutName, setOptimisticWorkoutName] = useState<
    string | undefined
  >();

  const name = optimisticWorkoutName ?? workout.name;

  useEffect(() => {
    if (!optimisticWorkoutName) {
      return;
    }

    if (workout.name === optimisticWorkoutName) {
      setOptimisticWorkoutName(undefined);
    }
  }, [optimisticWorkoutName, workout.name]);

  useEffect(() => {
    draftNameRef.current = draftName;
  }, [draftName]);

  useEffect(() => {
    if (!isRenaming) {
      return;
    }

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelection(0, draftNameRef.current.length);
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isRenaming]);

  const actions = useMemo(() => {
    const setDraftName = (nextName: string) => {
      setDraftNameState(nextName);
      setRenameError(undefined);
    };

    const beginRename = () => {
      if (isRenaming) {
        return;
      }

      setDraftNameState(name);
      setRenameError(undefined);
      setIsRenaming(true);
    };

    const cancelRename = () => {
      Keyboard.dismiss();
      isSavingRenameRef.current = false;
      setDraftNameState(name);
      setRenameError(undefined);
      setIsSavingRename(false);
      setIsRenaming(false);
    };

    const submitRename = () => {
      if (isSavingRenameRef.current) {
        return;
      }

      const nextName = draftName.trim();

      if (!nextName) {
        setRenameError('Workout name is required.');

        return;
      }

      if (nextName === workout.name) {
        Keyboard.dismiss();
        setDraftNameState(nextName);
        setIsRenaming(false);

        return;
      }

      isSavingRenameRef.current = true;
      setIsSavingRename(true);
      setRenameError(undefined);

      const previousOptimisticName = optimisticWorkoutName;

      setOptimisticWorkoutName(nextName);
      setDraftNameState(nextName);
      setIsRenaming(false);
      Keyboard.dismiss();

      try {
        const updatedWorkout = renameWorkout(workout, nextName);

        if (!updatedWorkout) {
          throw new Error('Rename returned no workout');
        }
      } catch (error) {
        console.error('Failed to rename workout', error);

        setOptimisticWorkoutName(previousOptimisticName);
        setDraftNameState(nextName);
        setRenameError('Could not rename workout. Try again.');
        setIsRenaming(true);
      } finally {
        isSavingRenameRef.current = false;
        setIsSavingRename(false);
      }
    };

    return {
      beginRename,
      cancelRename,
      setDraftName,
      submitRename
    };
  }, [
    draftName,
    isRenaming,
    name,
    optimisticWorkoutName,
    renameWorkout,
    workout
  ]);

  return {
    inputRef,
    name,
    draftName,
    renameError,
    isRenaming,
    isSavingRename,
    ...actions
  };
}
