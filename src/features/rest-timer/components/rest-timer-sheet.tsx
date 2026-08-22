import {
  BottomSheet,
  BottomSheetHeader
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { RestTimerActiveContent } from '@/src/features/rest-timer/components/rest-timer-active-content';
import { RestTimerIdleContent } from '@/src/features/rest-timer/components/rest-timer-idle-content';
import {
  type RestTimerContext,
  useRestTimerStore
} from '@/src/features/rest-timer/rest-timer.store';
import { cn } from '@/src/lib/utils/cn.utils';
import { XIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerSheetProps {
  isOpen: boolean;
  context?: RestTimerContext;
  onClose: () => void;
}

export function RestTimerSheet({
  isOpen,
  context,
  onClose
}: RestTimerSheetProps) {
  const setSheetOpen = useRestTimerStore(state => state.setSheetOpen);
  const registeredOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !registeredOpenRef.current) {
      registeredOpenRef.current = true;
      setSheetOpen(true);
    }

    if (!isOpen && registeredOpenRef.current) {
      registeredOpenRef.current = false;
      setSheetOpen(false);
    }
  }, [isOpen, setSheetOpen]);

  useEffect(
    () => () => {
      if (registeredOpenRef.current) {
        registeredOpenRef.current = false;
        setSheetOpen(false);
      }
    },
    [setSheetOpen]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
      enableContentPanningGesture={false}
    >
      <RestTimerSheetContent
        isOpen={isOpen}
        context={context}
        onClose={handleClose}
      />
    </BottomSheet>
  );
}

type RestTimerSheetContentProps = RestTimerSheetProps;

const RestTimerSheetContent = memo(function RestTimerSheetContent({
  isOpen,
  context,
  onClose
}: RestTimerSheetContentProps) {
  const { restTimerDuration: defaultDuration } = useSettings();
  const status = useRestTimerStore(state => state.status);
  const activeContext = useRestTimerStore(state => state.context);
  const syncDefaultDuration = useRestTimerStore(
    state => state.syncDefaultDuration
  );
  const syncOnOpen = useRestTimerStore(state => state.syncOnOpen);
  const wasOpenRef = useRef(false);
  const [openToken, setOpenToken] = useState(0);
  const subtitle =
    status === 'idle'
      ? 'Set the next rest interval'
      : (activeContext.exerciseName ??
        (status === 'paused' ? 'Rest paused' : 'Rest in progress'));

  useEffect(() => {
    syncDefaultDuration(defaultDuration);
  }, [defaultDuration, syncDefaultDuration]);

  useEffect(() => {
    const didOpen = isOpen && !wasOpenRef.current;

    wasOpenRef.current = isOpen;

    if (!didOpen) {
      return;
    }

    setOpenToken(currentToken => currentToken + 1);
    syncOnOpen(defaultDuration);
  }, [defaultDuration, isOpen, syncOnOpen]);

  return (
    <>
      <BottomSheetHeader className="flex-row items-center justify-between pt-2 pb-3">
        <View className="min-w-0 flex-1 gap-1 pr-3">
          <Text variant="h2">Rest timer</Text>
          <Text
            variant="small"
            numberOfLines={1}
            className="text-secondary-foreground font-medium"
          >
            {subtitle}
          </Text>
        </View>
        <Button
          variant="secondary"
          size="icon"
          accessibilityLabel="Close rest timer"
          onPress={onClose}
        >
          <Icon as={XIcon} size="lg" tone="foreground" />
        </Button>
      </BottomSheetHeader>

      <View
        className={cn(
          'pb-safe-offset-2 px-4 pt-2',
          status === 'idle' && 'gap-4'
        )}
      >
        <View
          pointerEvents={status === 'idle' ? 'auto' : 'none'}
          accessibilityElementsHidden={status !== 'idle'}
          importantForAccessibility={
            status === 'idle' ? 'auto' : 'no-hide-descendants'
          }
          className={cn(
            'gap-4',
            status !== 'idle' && 'absolute inset-x-4 top-2 opacity-0'
          )}
        >
          <RestTimerIdleContent
            defaultDuration={defaultDuration}
            context={context}
            openToken={openToken}
          />
        </View>
        {status !== 'idle' ? <RestTimerActiveContent /> : null}
      </View>
    </>
  );
});
