/** Let React paint loading UI before running heavy synchronous work. */
export const yieldToUi = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
