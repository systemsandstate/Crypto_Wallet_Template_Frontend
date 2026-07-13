import { useRef, useCallback, useEffect } from "react";
import { Animated, Easing } from "react-native";

type Options = {
    /** Simulated progress ceiling while work is in-flight (0–1). */
    cap?: number;
    /** Duration to creep toward cap when no real progress events arrive. */
    durationMs?: number;
};

/**
 * Smooth setup progress: creeps forward during long crypto work and eases to 100% on finish.
 * Real progress callbacks (e.g. scrypt) can bump the bar but never move it backwards.
 */
export function useSmoothSetupProgress() {
    const anim = useRef(new Animated.Value(0)).current;
    const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const displayed = useRef(0);

    const stopCreep = useCallback(() => {
        if (creepTimer.current) {
            clearInterval(creepTimer.current);
            creepTimer.current = null;
        }
    }, []);

    const animateTo = useCallback(
        (target: number, duration = 220) => {
            const clamped = Math.min(1, Math.max(displayed.current, target));
            displayed.current = clamped;
            Animated.timing(anim, {
                toValue: clamped,
                duration,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        },
        [anim]
    );

    const reset = useCallback(() => {
        stopCreep();
        anim.stopAnimation();
        displayed.current = 0;
        anim.setValue(0);
    }, [anim, stopCreep]);

    const start = useCallback(
        ({ cap = 0.9, durationMs = 12_000 }: Options = {}) => {
            reset();
            animateTo(0.06, 120);
            const startAt = Date.now();
            creepTimer.current = setInterval(() => {
                const t = Math.min(1, (Date.now() - startAt) / durationMs);
                const eased = 1 - (1 - t) ** 2;
                const value = 0.06 + eased * (cap - 0.06);
                if (value > displayed.current) {
                    anim.setValue(value);
                    displayed.current = value;
                }
            }, 50);
        },
        [anim, animateTo, reset]
    );

    const report = useCallback(
        (fraction: number) => {
            animateTo(Math.min(0.98, Math.max(0.06, fraction)));
        },
        [animateTo]
    );

    const finish = useCallback(async () => {
        stopCreep();
        return new Promise<void>((resolve) => {
            displayed.current = 1;
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start(() => resolve());
        });
    }, [anim, stopCreep]);

    useEffect(() => () => stopCreep(), [stopCreep]);

    const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return { width, start, report, finish, reset };
}
