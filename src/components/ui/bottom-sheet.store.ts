import { create } from 'zustand';

interface BottomSheetState {
  openSheetCount: number;
}

export const useBottomSheetStore = create<BottomSheetState>(() => ({
  openSheetCount: 0
}));

export function registerOpenSheet() {
  useBottomSheetStore.setState(state => ({
    openSheetCount: state.openSheetCount + 1
  }));

  let isRegistered = true;

  return () => {
    if (!isRegistered) {
      return;
    }

    isRegistered = false;
    useBottomSheetStore.setState(state => ({
      openSheetCount: Math.max(0, state.openSheetCount - 1)
    }));
  };
}

export function useIsAnySheetOpen() {
  return useBottomSheetStore(state => state.openSheetCount > 0);
}
