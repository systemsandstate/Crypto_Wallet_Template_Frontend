import { useSyncExternalStore } from "react";

import store, { type RootState } from "../store/store";

/**
 * Redux selector without react-redux's useSelector (avoids Hermes/runtime
 * "Property useSelector doesn't exist" issues in some bundles).
 */
export function useAppSelector<T>(selector: (state: RootState) => T): T {
    return useSyncExternalStore(
        store.subscribe,
        () => selector(store.getState()),
        () => selector(store.getState())
    );
}
