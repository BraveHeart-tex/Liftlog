import {
  registerOpenSheet,
  useBottomSheetStore
} from '@/src/components/ui/bottom-sheet.store';
import assert from 'node:assert/strict';

function isAnySheetOpen() {
  return useBottomSheetStore.getState().openSheetCount > 0;
}

afterEach(() => {
  useBottomSheetStore.setState({ openSheetCount: 0 });
});

test('content stays hidden until the last of several open sheets closes', () => {
  const closeFirst = registerOpenSheet();
  const closeSecond = registerOpenSheet();

  closeFirst();
  assert.equal(isAnySheetOpen(), true);

  closeSecond();
  assert.equal(isAnySheetOpen(), false);
});

test('closing the same sheet twice releases only its own count', () => {
  const closeFirst = registerOpenSheet();
  const closeSecond = registerOpenSheet();

  closeFirst();
  closeFirst();
  assert.equal(isAnySheetOpen(), true);

  closeSecond();
  assert.equal(isAnySheetOpen(), false);
});
