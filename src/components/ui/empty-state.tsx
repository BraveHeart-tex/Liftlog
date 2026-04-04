import { Button } from "@/src/components/ui/button";
import { Icon } from "@/src/components/ui/icon";

import { cn } from "@/src/lib/utils/cn";
import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn("flex-1 items-center justify-center px-8", className)}>
      {icon ? (
        <Icon icon={icon} className="fill-muted-foreground" size={48} />
      ) : null}
      <Text
        className={cn("text-h3 text-foreground text-center", icon && "mt-4")}
      >
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-small text-muted-foreground text-center">
          {description}
        </Text>
      ) : null}
      {action ? (
        <Button className="mt-6" onPress={action.onPress}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}
