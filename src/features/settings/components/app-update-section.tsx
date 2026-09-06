import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import { useAppUpdates } from '@/src/features/app-updates/update-provider';
import { presentUpdateState } from '@/src/features/app-updates/update-presenter';
import { Platform, View } from 'react-native';

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-1">
      <Text variant="bodyMedium">{label}</Text>
      <Text variant="body" tone="muted" className="shrink text-right">
        {value}
      </Text>
    </View>
  );
}

export function AppUpdateSection() {
  const { state, checkForUpdates } = useAppUpdates();
  const presentation = presentUpdateState(state);

  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Updates
      </Text>
      <Card>
        <CardContent className="gap-3">
          <MetadataRow
            label="Installed"
            value={presentation.installedVersion}
          />
          {presentation.availableVersion ? (
            <MetadataRow
              label="Available"
              value={presentation.availableVersion}
            />
          ) : null}
          {presentation.size ? (
            <MetadataRow label="Download size" value={presentation.size} />
          ) : null}
          {state.lastSuccessfulCheckAt ? (
            <MetadataRow
              label="Last checked"
              value={new Date(state.lastSuccessfulCheckAt).toLocaleString()}
            />
          ) : null}
          {presentation.releaseNotes ? (
            <View className="border-border border-t pt-3">
              <Text variant="bodyMedium">Release notes</Text>
              <Text variant="caption" tone="muted" className="mt-1">
                {presentation.releaseNotes}
              </Text>
            </View>
          ) : null}
          {presentation.message ? (
            <Text
              variant="caption"
              tone={state.status === 'error' ? 'danger' : 'muted'}
              accessibilityRole="alert"
            >
              {presentation.message}
            </Text>
          ) : null}
          <Button
            variant="secondary"
            fullWidth
            loading={state.status === 'checking'}
            loadingLabel="Checking..."
            onPress={checkForUpdates}
          >
            Check for updates
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
