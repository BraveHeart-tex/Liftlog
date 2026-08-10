import {
  confirmDialog,
  dismissDialog,
  resolveDialog,
  showDialog,
  useAlertDialogStore
} from '@/src/components/ui/alert-dialog.store';
import assert from 'node:assert/strict';
import test from 'node:test';

test.afterEach(() => {
  dismissDialog();
  useAlertDialogStore.setState({ request: null });
});

test('confirm resolves true when accepted', async () => {
  const promise = confirmDialog({ title: 'Confirm' });
  const request = useAlertDialogStore.getState().request;

  assert.ok(request);
  resolveDialog(request.id, true);

  assert.equal(await promise, true);
});

test('confirm resolves false when cancelled', async () => {
  const promise = confirmDialog({ title: 'Confirm' });
  dismissDialog();

  assert.equal(await promise, false);
});

test('backdrop and Android back dismiss the active confirmation', async () => {
  const backdropPromise = confirmDialog({ title: 'Backdrop' });
  const backdropRequest = useAlertDialogStore.getState().request;

  assert.ok(backdropRequest);
  resolveDialog(backdropRequest.id, false);
  assert.equal(await backdropPromise, false);

  const backPromise = confirmDialog({ title: 'Android back' });
  dismissDialog();
  assert.equal(await backPromise, false);
});

test('dismissDialog resolves the active confirmation as false', async () => {
  const promise = confirmDialog({ title: 'Dismiss' });
  dismissDialog();

  assert.equal(await promise, false);
  assert.equal(useAlertDialogStore.getState().request, null);
});

test('a newer request cancels the previous request', async () => {
  const firstPromise = confirmDialog({ title: 'First' });
  const firstRequest = useAlertDialogStore.getState().request;
  assert.ok(firstRequest);

  const secondPromise = confirmDialog({ title: 'Second' });
  const secondRequest = useAlertDialogStore.getState().request;
  assert.ok(secondRequest);
  assert.notEqual(secondRequest.id, firstRequest.id);

  assert.equal(await firstPromise, false);
  resolveDialog(secondRequest.id, true);
  assert.equal(await secondPromise, true);
});

test('re-entrant requests replace rather than overlap', async () => {
  const firstPromise = confirmDialog({ title: 'First' });
  const secondPromise = confirmDialog({ title: 'Second' });
  const request = useAlertDialogStore.getState().request;

  assert.ok(request);
  assert.equal(await firstPromise, false);
  resolveDialog(request.id, false);
  assert.equal(await secondPromise, false);
  assert.equal(useAlertDialogStore.getState().request, null);
});

test('stale callbacks cannot resolve a newer request', async () => {
  const firstPromise = confirmDialog({ title: 'First' });
  const firstRequest = useAlertDialogStore.getState().request;
  assert.ok(firstRequest);

  const secondPromise = confirmDialog({ title: 'Second' });
  const secondRequest = useAlertDialogStore.getState().request;
  assert.ok(secondRequest);

  resolveDialog(firstRequest.id, true);
  assert.equal(useAlertDialogStore.getState().request?.id, secondRequest.id);
  resolveDialog(secondRequest.id, true);

  assert.equal(await firstPromise, false);
  assert.equal(await secondPromise, true);
});

test('showDialog resolves after acknowledgement or dismissal', async () => {
  const acknowledgementPromise = showDialog({ title: 'Notice' });
  const acknowledgementRequest = useAlertDialogStore.getState().request;

  assert.ok(acknowledgementRequest);
  resolveDialog(acknowledgementRequest.id, true);
  await acknowledgementPromise;

  const dismissalPromise = showDialog({ title: 'Dismissible notice' });
  dismissDialog();
  await dismissalPromise;
});
