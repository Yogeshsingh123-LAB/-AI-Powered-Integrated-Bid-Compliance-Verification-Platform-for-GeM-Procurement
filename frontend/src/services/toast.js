/**
 * Minimal in-app toast queue (replaces window.alert). The <Toaster />
 * component subscribes to this emitter and renders the messages with
 * aria-live="polite" so they are announced by screen readers.
 */
let listener = null;
let counter = 0;

export function onToast(cb) {
  listener = cb;
  return () => {
    if (listener === cb) listener = null;
  };
}

export function showToast(message, type = "info", duration = 4200) {
  const id = ++counter;
  if (listener) listener({ id, message, type });
  return id;
}
