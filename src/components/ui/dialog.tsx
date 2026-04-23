import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { cn } from '@/src/lib/utils/cn';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  Text,
  View
} from 'react-native';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

interface DialogSectionProps {
  children: ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, children, className }: DialogProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    progress.stopAnimation();

    if (isOpen) {
      Animated.spring(progress, {
        toValue: 1,
        damping: 20,
        mass: 0.9,
        stiffness: 240,
        useNativeDriver: true
      }).start();

      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  }, [isOpen, isVisible, progress]);

  if (!isVisible) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0]
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1]
  });

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={isVisible}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View
          className="absolute inset-0"
          style={{ opacity: progress }}
        >
          <BlurView
            experimentalBlurMethod={
              Platform.OS === 'android' ? 'dimezisBlurView' : undefined
            }
            intensity={32}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }}
          />

          <View className="bg-background/35 absolute inset-0" />
        </Animated.View>

        <Pressable className="absolute inset-0" onPress={onClose} />

        <Animated.View
          className={cn(
            'border-border bg-card max-h-[85%] w-[90%] rounded-xl border',
            className
          )}
          style={{
            opacity: progress,
            transform: [{ translateY }, { scale }]
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export function DialogHeader({ children, className }: DialogSectionProps) {
  return <View className={cn('p-4 pb-2', className)}>{children}</View>;
}

export function DialogTitle({ children, className }: DialogSectionProps) {
  return (
    <Text className={cn('text-h3 text-foreground', className)}>{children}</Text>
  );
}

export function DialogDescription({ children, className }: DialogSectionProps) {
  return (
    <Text className={cn('text-small text-muted-foreground mt-1', className)}>
      {children}
    </Text>
  );
}

export function DialogContent({ children, className }: DialogSectionProps) {
  return (
    <StyledScrollView
      className="shrink"
      contentContainerClassName={cn('px-4 pb-2', className)}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </StyledScrollView>
  );
}

export function DialogFooter({ children, className }: DialogSectionProps) {
  return (
    <View className={cn('flex-row justify-end gap-2 p-4 pt-2', className)}>
      {children}
    </View>
  );
}
