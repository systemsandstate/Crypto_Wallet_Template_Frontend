type IdleTask = { cancel: () => void };

/** Schedule work when the runtime is idle — replaces deprecated InteractionManager. */
export const runWhenIdle = (callback: () => void): IdleTask => {
  let cancelled = false;
  const run = () => {
    if (!cancelled) callback();
  };

  if (typeof globalThis.requestIdleCallback === 'function') {
    const id = globalThis.requestIdleCallback(run);
    return {
      cancel: () => {
        cancelled = true;
        globalThis.cancelIdleCallback?.(id);
      },
    };
  }

  const timeoutId = setTimeout(run, 0);
  return {
    cancel: () => {
      cancelled = true;
      clearTimeout(timeoutId);
    },
  };
};
