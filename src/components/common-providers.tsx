import { DatabaseProvider } from "@/src/components/database-provider";
import { PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export function CommonProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <DatabaseProvider>{children}</DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
