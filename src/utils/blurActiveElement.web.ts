export function blurActiveElement() {
    const active = document.activeElement as HTMLElement | null;
    active?.blur?.();
}
