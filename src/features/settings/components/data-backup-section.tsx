import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { exportBackup } from '@/src/features/backup/backup.service';
import { pickBackupPreview } from '@/src/features/backup/backup-import.service';
import {
  getBackupErrorCategory,
  type BackupPreview
} from '@/src/features/backup/backup-preview';
import { useDrizzle } from '@/src/providers/database-provider';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { FileJson } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

export function DataBackupSection() {
  const db = useDrizzle();
  const { themePreference } = useAppTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const showPreview = useCallback((preview: BackupPreview) => {
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
      [{ text: 'Done', style: 'cancel' }]
    );
  }, []);

  const runImport = useCallback(async () => {
    setIsImporting(true);

    try {
      const result = await pickBackupPreview();

      if (result.status === 'cancelled') {
        return;
      }

      showPreview(result.preview);
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
      <Card>
        <CardContent>
          <Text variant="bodyMedium">Keep a copy of your LiftLog data</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Export exercises, workouts, templates, preferences, and your active
            workout as readable JSON.
          </Text>
        </CardContent>
        <Button
          variant="secondary"
          className="border-t-border rounded-none border-0 border-t"
          onPress={confirmExport}
          disabled={isExporting}
          loading={isExporting}
          loadingLabel="Preparing backup..."
          accessibilityLabel="Export backup"
          leftIcon={<Icon as={FileJson} tone="primary" size="sm" />}
          textClassName="text-primary"
        >
          Export backup
        </Button>
        <Button
          variant="secondary"
          className="border-t-border rounded-none border-0 border-t"
          onPress={() => void runImport()}
          disabled={isExporting || isImporting}
          loading={isImporting}
          loadingLabel="Checking backup..."
          accessibilityLabel="Import backup"
          leftIcon={<Icon as={FileJson} tone="primary" size="sm" />}
          textClassName="text-primary"
        >
          Import backup
        </Button>
      </Card>
    </View>
  );
}
