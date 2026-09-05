import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { exportBackup } from '@/src/features/backup/backup.service';
import { useDrizzle } from '@/src/providers/database-provider';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import { FileJson } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

export function DataBackupSection() {
  const db = useDrizzle();
  const { themePreference } = useAppTheme();
  const [isExporting, setIsExporting] = useState(false);

  const runExport = useCallback(async () => {
    setIsExporting(true);

    try {
      await exportBackup(db, { themePreference });
      showSnackbar({ message: 'Backup ready to share.', variant: 'success' });
    } catch (error) {
      console.error('Failed to export backup', error);
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
      </Card>
    </View>
  );
}
