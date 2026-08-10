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
import { useEffect, useRef } from 'react';
import {
  Animated,
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
}

function DialogView({ request }: DialogViewProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    progress.stopAnimation();

    if (reduceMotion) {
      progress.setValue(1);

      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION_DURATION_MS.standard,
      useNativeDriver: true
    }).start();

    return () => progress.stopAnimation();
  }, [progress, reduceMotion, request.id]);

  const handleDismiss = () => resolveDialog(request.id, false);
  const handleConfirm = (_event: GestureResponderEvent) =>
    resolveDialog(request.id, true);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View
        className="flex-1 justify-center px-6"
        style={{
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24)
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
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1]
                })
              }
            ]
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

  if (!request) {
    return null;
  }

  return <DialogView key={request.id} request={request} />;
}
