import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { StyledActivityIndicator } from '@/src/components/styled/activity-indicator';
import { Text } from '@/src/components/ui/text';
import { showSnackbar } from '@/src/components/ui/snackbar';
import {
  exportBackup,
  loadSafetyBackupPreview,
  replaceAllWithBackup,
  undoLastImport,
  type SafetyBackupPreviewResult
} from '@/src/features/backup/backup.service';
import { pickBackupPreview } from '@/src/features/backup/backup-import.service';
import type { LiftLogBackupV1 } from '@/src/features/backup/backup.types';
import {
  getBackupErrorCategory,
  type BackupPreview
} from '@/src/features/backup/backup-preview';
import { useDrizzle } from '@/src/providers/database-provider';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { refreshLiveQueries } from '@/src/lib/db/live-query-refresh';
import { ChevronRight, FileDown, FileJson, FileUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, View } from 'react-native';

type BackupActionProps = {
  title: string;
  description: string;
  accessibilityLabel: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  icon?: ReactNode;
};

function BackupAction({
  title,
  description,
  accessibilityLabel,
  disabled,
  loading,
  onPress,
  icon = <Icon as={FileJson} tone="primary" />
}: BackupActionProps) {
  return (
    <PressableSurface
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={description}
      accessibilityState={{ busy: loading }}
      className="border-t-border min-h-20 flex-row items-center border-t px-4 py-4"
      disabled={disabled || loading}
      onPress={onPress}
      pressedClassName="bg-muted"
    >
      <View className="w-8 items-center">
        {loading ? (
          <StyledActivityIndicator className="text-primary" size="small" />
        ) : (
          icon
        )}
      </View>
      <View className="ml-3 flex-1">
        <Text variant="bodyMedium">{title}</Text>
        <Text variant="caption" tone="muted" className="mt-0.5">
          {description}
        </Text>
      </View>
      <Icon as={ChevronRight} tone="mutedForeground" size="sm" />
    </PressableSurface>
  );
}

export function DataBackupSection() {
  const db = useDrizzle();
  const { themePreference, setThemePreference } = useAppTheme();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [undoSafetyBackup, setUndoSafetyBackup] =
    useState<SafetyBackupPreviewResult | null>(null);

  const refreshUndoSafetyBackup = useCallback(async () => {
    setUndoSafetyBackup(await loadSafetyBackupPreview());
  }, []);

  useEffect(() => {
    void refreshUndoSafetyBackup();
  }, [refreshUndoSafetyBackup]);

  const runExport = useCallback(async () => {
    setIsExporting(true);

    try {
      await exportBackup(db, { themePreference });
      showSnackbar({ message: 'Backup ready to share.', variant: 'success' });
    } catch {
      showSnackbar({
        message: 'Could not create the backup. Please try again.',
        variant: 'danger'
      });
    } finally {
      setIsExporting(false);
    }
  }, [db, themePreference]);

  const confirmExport = useCallback(() => {
    Alert.alert(
      'Share readable backup?',
      'This JSON file contains your private workout data and can be read by anyone you share it with.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => void runExport() }
      ]
    );
  }, [runExport]);

  const runReplace = useCallback(
    async (backup: LiftLogBackupV1) => {
      setIsImporting(true);

      try {
        await replaceAllWithBackup(db, backup, {
          setTheme: setThemePreference,
          refreshLiveQueries
        });
        await refreshUndoSafetyBackup();
        router.dismissAll();
        router.replace('/(tabs)/workout');
        Alert.alert('Import complete', 'Your restored data is now loaded.', [
          { text: 'OK' }
        ]);
      } catch {
        showSnackbar({
          message: 'Could not replace data. Your existing data was kept.',
          variant: 'danger'
        });
      } finally {
        setIsImporting(false);
      }
    },
    [db, refreshUndoSafetyBackup, router, setThemePreference]
  );

  const runUndo = useCallback(async () => {
    setIsImporting(true);

    try {
      await undoLastImport(db, {
        setTheme: setThemePreference,
        refreshLiveQueries
      });
      setUndoSafetyBackup(null);
      router.dismissAll();
      router.replace('/(tabs)/workout');
      Alert.alert(
        'Undo complete',
        'Your data was restored to its pre-import state.',
        [{ text: 'OK' }]
      );
    } catch {
      showSnackbar({
        message: 'Could not undo the import. Your current data was kept.',
        variant: 'danger'
      });
      await refreshUndoSafetyBackup();
    } finally {
      setIsImporting(false);
    }
  }, [db, refreshUndoSafetyBackup, router, setThemePreference]);

  const runUndoPreview = useCallback(async () => {
    setIsImporting(true);

    try {
      const result = await loadSafetyBackupPreview();

      if (!result) {
        setUndoSafetyBackup(null);

        return;
      }

      setUndoSafetyBackup(result);
      const { counts } = result.preview;
      Alert.alert(
        'Undo last import?',
        [
          `Imported before ${new Date(result.preview.createdAt).toLocaleString()}`,
          '',
          `${counts.exercises} exercises, ${counts.workouts} workouts`,
          `${counts.sets} sets, ${counts.workoutTemplates} templates`,
          '',
          'This restores the data from before the import. The undo is one-way and cannot be repeated.'
        ].join('\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore pre-import data',
            style: 'destructive',
            onPress: () => void runUndo()
          }
        ]
      );
    } catch {
      showSnackbar({
        message: 'The undo backup is no longer available.',
        variant: 'danger'
      });
      setUndoSafetyBackup(null);
    } finally {
      setIsImporting(false);
    }
  }, [runUndo]);

  const showPreview = useCallback(
    (preview: BackupPreview, backup: LiftLogBackupV1) => {
      const { counts } = preview;
      const activeWorkoutMessage = preview.replacesActiveWorkout
        ? '\n\nThis will replace your active workout.'
        : '';
      Alert.alert(
        'Backup preview',
        [
          `Created ${new Date(preview.createdAt).toLocaleString()}`,
          `Source app: ${preview.appVersion}`,
          '',
          `${counts.exercises} exercises, ${counts.workouts} workouts`,
          `${counts.sets} sets, ${counts.workoutTemplates} templates`,
          activeWorkoutMessage,
          '\nNo data has been changed.'
        ].join('\n'),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              Alert.alert(
                'Replace all data?',
                `Your current workout data will be replaced by this backup.${
                  preview.replacesActiveWorkout
                    ? ' Any active workout and rest timer will be cancelled.'
                    : ' Any active rest timer will be cancelled.'
                } A private safety backup will be created first. The app must restart after a successful import.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Replace all data',
                    style: 'destructive',
                    onPress: () => void runReplace(backup)
                  }
                ]
              );
            }
          }
        ]
      );
    },
    [runReplace]
  );

  const runImport = useCallback(async () => {
    setIsImporting(true);

    try {
      const result = await pickBackupPreview();

      if (result.status === 'cancelled') {
        return;
      }

      showPreview(result.preview, result.backup);
    } catch (error) {
      const category = getBackupErrorCategory(error);
      const message =
        category === 'unsupported-version'
          ? 'This backup was created by a newer version of LiftLog.'
          : category === 'unrelated-file'
            ? 'That file is not a LiftLog backup.'
            : category === 'limit-exceeded'
              ? 'This backup is too large to open safely.'
              : category === 'invalid-json'
                ? 'The backup file contains invalid JSON.'
                : 'The backup could not be read or is not valid.';
      showSnackbar({ message, variant: 'danger' });
    } finally {
      setIsImporting(false);
    }
  }, [showPreview]);

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Data & Backup
      </Text>
      <Card className="overflow-hidden">
        <CardContent>
          <Text variant="bodyMedium">Backup your data</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Export exercises, workouts, templates, preferences, and your active
            workout as readable JSON.
          </Text>
        </CardContent>
        <BackupAction
          title="Export backup"
          description="Save a readable JSON file to your device"
          icon={<Icon as={FileUp} tone="primary" />}
          onPress={confirmExport}
          disabled={isExporting}
          loading={isExporting}
          accessibilityLabel="Export backup"
        />
        <BackupAction
          title="Import backup"
          description="Restore data from a LiftLog backup file"
          icon={<Icon as={FileDown} tone="primary" />}
          onPress={() => void runImport()}
          disabled={isExporting || isImporting}
          loading={isImporting}
          accessibilityLabel="Import backup"
        />
        {undoSafetyBackup ? (
          <BackupAction
            title="Undo last import"
            description="Restore the data saved before your last import"
            onPress={() => void runUndoPreview()}
            disabled={isExporting || isImporting}
            loading={isImporting}
            accessibilityLabel="Undo last import"
          />
        ) : null}
      </Card>
    </View>
  );
}
