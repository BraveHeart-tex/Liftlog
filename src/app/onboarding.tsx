import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { useOnboardingActions } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [weightUnitPreference, setWeightUnitPreference] =
    useState<WeightUnit>('kg');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0;
  const shouldShowNameError = attemptedSubmit && !isNameValid;
  const { getStarted } = useOnboardingActions({
    name,
    weightUnitPreference,
    setAttemptedSubmit
  });

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className="bg-background"
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StyledScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-between px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <View>
              <Text variant="h1">Welcome to LiftLog</Text>
              <Text variant="small" tone="muted" className="mt-2">
                Set up your profile to get started.
              </Text>
            </View>

            <View className="mt-10 gap-8">
              <View>
                <Text variant="small" className="mb-2">
                  Your name
                </Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  error={shouldShowNameError ? 'Name is required' : undefined}
                />
              </View>

              <View>
                <Text variant="small" className="mb-2">
                  Weight unit
                </Text>
                <Text variant="caption" tone="muted" className="mb-3">
                  You can change this later in settings.
                </Text>
                <View className="flex-row gap-3">
                  {(['kg', 'lb'] as WeightUnit[]).map(unit => (
                    <Pressable
                      key={unit}
                      onPress={() => {
                        setWeightUnitPreference(unit);
                      }}
                      className={cn(
                        weightUnitPreference === unit
                          ? 'bg-primary border-primary'
                          : 'bg-card border-border',
                        'flex-1 items-center rounded-lg border py-4'
                      )}
                    >
                      <Text
                        variant="bodyMedium"
                        className={cn(
                          weightUnitPreference === unit
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        )}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <Button className="mt-10 w-full" onPress={getStarted}>
            Get started
          </Button>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
