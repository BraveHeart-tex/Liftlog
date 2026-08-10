import {
  confirmDialog,
  dismissDialog,
  resolveDialog,
  showDialog,
  useAlertDialogStore,
  type DialogRequest
} from '@/src/components/ui/alert-dialog.store';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  View,
  type GestureResponderEvent
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type {
  ConfirmDialogOptions,
  ShowDialogOptions
} from '@/src/components/ui/alert-dialog.store';

export { confirmDialog, dismissDialog, showDialog };

interface DialogViewProps {
  request: DialogRequest;
  isClosing: boolean;
  onExit: (dialogId: number) => void;
}

const DIALOG_EASING = Easing.bezier(0.23, 1, 0.32, 1);

function DialogView({ request, isClosing, onExit }: DialogViewProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [modalReady, setModalReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const verticalPadding = Math.max(insets.top, insets.bottom, 24);

  useEffect(() => {
    progress.stopAnimation();

    if (!modalReady) {
      if (isClosing) {
        onExit(request.id);
      }

      return;
    }

    if (reduceMotion) {
      progress.setValue(isClosing ? 0 : 1);

      if (isClosing) {
        onExit(request.id);
      }

      return;
    }

    progress.setValue(isClosing ? 1 : 0);
    Animated.timing(progress, {
      toValue: isClosing ? 0 : 1,
      duration: isClosing
        ? MOTION_DURATION_MS.exit
        : MOTION_DURATION_MS.standard,
      easing: DIALOG_EASING,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && isClosing) {
        onExit(request.id);
      }
    });

    return () => progress.stopAnimation();
  }, [isClosing, modalReady, onExit, progress, reduceMotion, request.id]);

  const handleDismiss = () => resolveDialog(request.id, false);
  const handleConfirm = (_event: GestureResponderEvent) =>
    resolveDialog(request.id, true);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={() => setModalReady(true)}
      onRequestClose={handleDismiss}
    >
      <View
        className="flex-1 justify-center px-6"
        style={{
          paddingVertical: verticalPadding
        }}
      >
        <Animated.View
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity: progress }}
        />
        <Pressable
          accessibilityLabel="Dismiss dialog"
          accessibilityRole="button"
          className="absolute inset-0"
          onPress={handleDismiss}
        />
        <Animated.View
          accessibilityViewIsModal
          className="bg-card border-border w-full self-center rounded-2xl border p-5"
          style={{
            maxWidth: 420,
            opacity: progress
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text variant="h3" accessibilityRole="header">
            {request.title}
          </Text>
          {request.message ? (
            <Text variant="body" className="text-muted-foreground mt-3">
              {request.message}
            </Text>
          ) : null}

          <View className="mt-6 flex-row justify-end gap-3">
            {request.kind === 'confirm' ? (
              <Button
                variant="secondary"
                size="sm"
                accessibilityLabel={request.cancelLabel}
                onPress={handleDismiss}
              >
                {request.cancelLabel}
              </Button>
            ) : null}
            <Button
              variant={request.destructive ? 'destructive' : 'primary'}
              size="sm"
              accessibilityLabel={request.confirmLabel}
              onPress={handleConfirm}
            >
              {request.confirmLabel}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function AlertDialogHost() {
  const request = useAlertDialogStore(state => state.request);
  const [renderedRequest, setRenderedRequest] = useState<DialogRequest | null>(
    null
  );
  const handleExit = useCallback((dialogId: number) => {
    setRenderedRequest(currentRequest =>
      currentRequest?.id === dialogId ? null : currentRequest
    );
  }, []);

  useEffect(() => {
    if (request) {
      setRenderedRequest(request);
    }
  }, [request]);

  const displayedRequest = request ?? renderedRequest;

  if (!displayedRequest) {
    return null;
  }

  return (
    <DialogView
      request={displayedRequest}
      isClosing={!request}
      onExit={handleExit}
    />
  );
}
