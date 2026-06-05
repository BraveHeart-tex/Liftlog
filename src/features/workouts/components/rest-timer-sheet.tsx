import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { useSettings } from '@/src/features/settings/hooks';
import { RestTimerIdleContent } from '@/src/features/workouts/components/rest-timer-idle-content';
import { RestTimerPausedContent } from '@/src/features/workouts/components/rest-timer-paused-content';
import { RestTimerRunningContent } from '@/src/features/workouts/components/rest-timer-running-content';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import { XIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestTimerSheet({ isOpen, onClose }: RestTimerSheetProps) {
  const { restTimerDuration: defaultDuration } = useSettings();
  const status = useRestTimerStore(state => state.status);
  const syncDefaultDuration = useRestTimerStore(
    state => state.syncDefaultDuration
  );
  const syncOnOpen = useRestTimerStore(state => state.syncOnOpen);
  const setSheetOpen = useRestTimerStore(state => state.setSheetOpen);
  const wasOpenRef = useRef(false);
  const registeredOpenRef = useRef(false);
  const [openToken, setOpenToken] = useState(0);

  useEffect(() => {
    syncDefaultDuration(defaultDuration);
  }, [defaultDuration, syncDefaultDuration]);

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

  useEffect(() => {
    const didOpen = isOpen && !wasOpenRef.current;

    wasOpenRef.current = isOpen;

    if (!didOpen) {
      return;
    }

    setOpenToken(currentToken => currentToken + 1);
    syncOnOpen(defaultDuration);
  }, [defaultDuration, isOpen, syncOnOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
      enableContentPanningGesture={false}
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <BottomSheetTitle>Rest Timer</BottomSheetTitle>
        <Button variant="secondary" size="icon" onPress={handleClose}>
          <Icon icon={XIcon} size="lg" className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="gap-6 px-4 pt-4 pb-6">
        {status === 'idle' ? (
          <RestTimerIdleContent
            defaultDuration={defaultDuration}
            openToken={openToken}
          />
        ) : null}
        {status === 'running' ? <RestTimerRunningContent /> : null}
        {status === 'paused' ? <RestTimerPausedContent /> : null}
      </View>
    </BottomSheet>
  );
}
