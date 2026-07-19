type UnauthorizedHandler = () => Promise<void> | void;

let handler: UnauthorizedHandler | null = null;
let pendingClear: Promise<void> | null = null;

export function registerUnauthorizedHandler(nextHandler: UnauthorizedHandler) {
  handler = nextHandler;

  return () => {
    if (handler === nextHandler) {
      handler = null;
    }
  };
}

export async function handleConfirmedUnauthorized() {
  if (!handler) {
    return;
  }

  if (!pendingClear) {
    pendingClear = Promise.resolve(handler()).finally(() => {
      pendingClear = null;
    });
  }

  await pendingClear;
}
