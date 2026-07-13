import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

/** Load screen data once on first focus; dedupe parallel/in-flight calls. */
export function useInitialScreenLoad(
    load: () => void | Promise<void>,
    beforeLoad?: () => void
) {
    const hasLoadedRef = useRef(false);
    const inFlightRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            beforeLoad?.();
            if (hasLoadedRef.current || inFlightRef.current) return;
            inFlightRef.current = true;
            void Promise.resolve(load()).finally(() => {
                hasLoadedRef.current = true;
                inFlightRef.current = false;
            });
        }, [beforeLoad, load])
    );

    const reload = useCallback(() => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        void Promise.resolve(load()).finally(() => {
            inFlightRef.current = false;
        });
    }, [load]);

    return { reload, hasLoadedRef, inFlightRef };
}
