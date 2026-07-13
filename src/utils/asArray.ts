/** Coerce API/list values to arrays before .map/.filter. */
export function asArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}
