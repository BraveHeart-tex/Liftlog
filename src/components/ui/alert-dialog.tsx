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

const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);
const DIALOG_SCALE_DELTA = 0.97;

const DIALOG_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.24,
  shadowRadius: 24,
  elevation: 12
};

function DialogView({ request, isClosing, onExit }: DialogViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(DIALOG_SCALE_DELTA)).current;
  const [modalReady, setModalReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const verticalPadding = Math.max(insets.top, insets.bottom, 24);

  const hasResolvedRef = useRef(false);

  useEffect(() => {
    hasResolvedRef.current = false;
  }, [request.id]);

  useEffect(() => {
    opacity.stopAnimation();
    scale.stopAnimation();

    if (!modalReady) {
      if (isClosing) {
        onExit(request.id);
      }

      return;
    }

    if (reduceMotion) {
      opacity.setValue(isClosing ? 0 : 1);
      scale.setValue(1);

      if (isClosing) {
        onExit(request.id);
      }

      return;
    }

    if (isClosing) {
      opacity.setValue(1);
      scale.setValue(1);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: MOTION_DURATION_MS.exit,
          easing: EXIT_EASING,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: DIALOG_SCALE_DELTA,
          duration: MOTION_DURATION_MS.exit,
          easing: EXIT_EASING,
          useNativeDriver: true
        })
      ]).start(({ finished }) => {
        if (finished) {
          onExit(request.id);
        }
      });
    } else {
      opacity.setValue(0);
      scale.setValue(DIALOG_SCALE_DELTA);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: MOTION_DURATION_MS.standard,
          easing: ENTER_EASING,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: MOTION_DURATION_MS.standard,
          easing: ENTER_EASING,
          useNativeDriver: true
        })
      ]).start();
    }

    return () => {
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [isClosing, modalReady, onExit, opacity, reduceMotion, request.id, scale]);

  const resolve = useCallback(
    (value: boolean) => {
      if (hasResolvedRef.current) {
        return;
      }

      hasResolvedRef.current = true;
      resolveDialog(request.id, value);
    },
    [request.id]
  );

  const handleDismiss = () => resolve(false);
  const handleConfirm = (_event: GestureResponderEvent) => resolve(true);

  const interactive = !isClosing && !hasResolvedRef.current;

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
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <Animated.View
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', opacity }}
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
            opacity,
            transform: [{ scale }],
            ...DIALOG_SHADOW
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
                disabled={!interactive}
                onPress={handleDismiss}
              >
                {request.cancelLabel}
              </Button>
            ) : null}
            <Button
              variant={request.destructive ? 'destructive' : 'primary'}
              size="sm"
              accessibilityLabel={request.confirmLabel}
              disabled={!interactive}
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
  const [renderedDialog, setRenderedDialog] = useState<{
    request: DialogRequest;
    isClosing: boolean;
  } | null>(null);

  const handleExit = useCallback((dialogId: number) => {
    setRenderedDialog(currentDialog =>
      currentDialog?.request.id === dialogId ? null : currentDialog
    );
  }, []);

  useEffect(() => {
    setRenderedDialog(currentDialog => {
      if (request) {
        if (
          currentDialog?.request.id === request.id &&
          !currentDialog.isClosing
        ) {
          return currentDialog;
        }

        return { request, isClosing: false };
      }

      return currentDialog
        ? { ...currentDialog, isClosing: true }
        : currentDialog;
    });
  }, [request]);

  if (!renderedDialog) {
    return null;
  }

  return (
    <DialogView
      key={renderedDialog.request.id}
      request={renderedDialog.request}
      isClosing={renderedDialog.isClosing}
      onExit={handleExit}
    />
  );
}
