import {
  BottomSheet,
  BottomSheetContent
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { InputGroup, InputSlot } from '@/src/components/ui/input-group';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { Text } from '@/src/components/ui/text';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { iconSizes } from '@/src/theme/sizes';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CircleXIcon,
  DumbbellIcon,
  SearchXIcon,
  XIcon
} from 'lucide-react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef
} from 'react';
import { useWindowDimensions, View } from 'react-native';

type SheetPanel = 'start' | 'templates';
type PendingStart = 'empty' | string | null;

interface StartWorkoutSheetProps {
  isOpen: boolean;
  templates: WorkoutStartTemplateItem[];
  onClose: () => void;
  onStartEmpty: () => boolean;
  onStartTemplate: (templateId: string) => boolean;
  onWorkoutStarted: () => void;
}

interface TemplateRowProps {
  disabled: boolean;
  item: WorkoutStartTemplateItem;
  loading: boolean;
  onPress: (templateId: string) => void;
}

function TemplateRow({ disabled, item, loading, onPress }: TemplateRowProps) {
  const exerciseLabel =
    item.exerciseCount === 1 ? '1 exercise' : `${item.exerciseCount} exercises`;
  const metadata = item.exerciseSummary
    ? `${exerciseLabel} · ${item.exerciseSummary}`
    : exerciseLabel;

  return (
    <PressableSurface
      className="border-border min-h-[68px] flex-row items-center border-b py-3"
      accessibilityLabel={`Start ${item.template.name} workout`}
      accessibilityState={{ busy: loading }}
      disabled={disabled}
      onPress={() => onPress(item.template.id)}
    >
      <View className="min-w-0 flex-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.template.name}
        </Text>
        <Text variant="small" tone="muted" className="mt-1" numberOfLines={1}>
          {loading ? 'Starting workout...' : metadata}
        </Text>
      </View>
      <Icon
        as={ChevronRightIcon}
        tone="mutedForeground"
        size={iconSizes.md}
        className="ml-4 shrink-0"
      />
    </PressableSurface>
  );
}

export function StartWorkoutSheet({
  isOpen,
  templates,
  onClose,
  onStartEmpty,
  onStartTemplate,
  onWorkoutStarted
}: StartWorkoutSheetProps) {
  const { height } = useWindowDimensions();
  const searchInputRef = useRef<ComponentRef<typeof BottomSheetInput>>(null);
  const [panel, setPanel] = useState<SheetPanel>('start');
  const [query, setQuery] = useState('');
  const [pendingStart, setPendingStart] = useState<PendingStart>(null);
  const isStarting = pendingStart !== null;

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return templates;
    }

    return templates.filter(item =>
      item.template.name.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [query, templates]);

  const resetSheet = useCallback(() => {
    setPanel('start');
    setQuery('');
    setPendingStart(null);
  }, []);

  const handleClose = useCallback(() => {
    resetSheet();
    onClose();
  }, [onClose, resetSheet]);

  useEffect(() => {
    if (!isOpen) {
      resetSheet();
    }
  }, [isOpen, resetSheet]);

  const finishStart = useCallback(
    (didStart: boolean) => {
      if (didStart) {
        onWorkoutStarted();
        handleClose();

        return;
      }

      setPendingStart(null);
    },
    [handleClose, onWorkoutStarted]
  );

  const handleStartEmpty = useCallback(() => {
    if (isStarting) {
      return;
    }

    setPendingStart('empty');
    finishStart(onStartEmpty());
  }, [finishStart, isStarting, onStartEmpty]);

  const handleStartTemplate = useCallback(
    (templateId: string) => {
      if (isStarting) {
        return;
      }

      setPendingStart(templateId);
      finishStart(onStartTemplate(templateId));
    },
    [finishStart, isStarting, onStartTemplate]
  );

  const renderTemplateRows = (items: WorkoutStartTemplateItem[]) => (
    <View className="border-border border-t">
      {items.map(item => (
        <TemplateRow
          key={item.template.id}
          item={item}
          disabled={isStarting}
          loading={pendingStart === item.template.id}
          onPress={handleStartTemplate}
        />
      ))}
    </View>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
      maxDynamicContentSize={height * 0.9}
      wrapDynamicContent={false}
    >
      <BottomSheetContent className="pt-0">
        <View className="min-h-14 flex-row items-center pb-2">
          {panel === 'templates' ? (
            <PressableSurface
              className="h-11 w-11 items-center justify-center rounded-md"
              accessibilityLabel="Back to start workout options"
              disabled={isStarting}
              onPress={() => setPanel('start')}
            >
              <Icon as={ArrowLeftIcon} tone="mutedForeground" />
            </PressableSurface>
          ) : (
            <View className="h-11 w-11" />
          )}

          <Text variant="h3" className="flex-1 text-center">
            {panel === 'start' ? 'Start workout' : 'Templates'}
          </Text>

          <PressableSurface
            className="h-11 w-11 items-center justify-center rounded-md"
            accessibilityLabel="Close start workout options"
            disabled={isStarting}
            onPress={handleClose}
          >
            <Icon as={XIcon} tone="mutedForeground" />
          </PressableSurface>
        </View>

        {panel === 'start' ? (
          <View>
            <Button
              className="h-14 rounded-lg"
              fullWidth
              leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
              loading={pendingStart === 'empty'}
              loadingLabel="Starting workout..."
              disabled={isStarting}
              onPress={handleStartEmpty}
            >
              Start empty workout
            </Button>
            <Text tone="muted" variant="caption" className="mt-2 text-center">
              No setup. Add exercises during the workout.
            </Text>

            <View className="mt-4 min-h-11 flex-row items-center justify-between">
              <Text variant="overline" tone="muted">
                Templates
              </Text>
              {templates.length > 3 ? (
                <PressableSurface
                  className="min-h-11 flex-row items-center pl-3"
                  accessibilityLabel="See all workout templates"
                  disabled={isStarting}
                  onPress={() => setPanel('templates')}
                >
                  <Text variant="caption" tone="primary">
                    See all
                  </Text>
                  <Icon as={ChevronRightIcon} tone="primary" size="sm" />
                </PressableSurface>
              ) : null}
            </View>

            {renderTemplateRows(templates.slice(0, 3))}
          </View>
        ) : (
          <View>
            <InputGroup className="mb-3 min-h-12 px-3 py-2">
              <InputSlot className="mr-3">
                <SearchInputIcon />
              </InputSlot>
              <BottomSheetInput
                ref={searchInputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search templates"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search templates"
                className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0"
              />
              {query.length > 0 ? (
                <PressableSurface
                  className="h-10 w-10 items-center justify-center rounded-md"
                  accessibilityLabel="Clear template search"
                  disabled={isStarting}
                  onPress={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                >
                  <Icon
                    as={CircleXIcon}
                    size={iconSizes.md}
                    tone="mutedForeground"
                  />
                </PressableSurface>
              ) : null}
            </InputGroup>

            {filteredTemplates.length > 0 ? (
              renderTemplateRows(filteredTemplates)
            ) : (
              <View className="min-h-44 items-center justify-center gap-2 px-4">
                <Icon as={SearchXIcon} tone="mutedForeground" />
                <Text variant="bodyMedium">No templates found</Text>
                <Text variant="small" tone="muted">
                  Try a different name.
                </Text>
              </View>
            )}
          </View>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}
