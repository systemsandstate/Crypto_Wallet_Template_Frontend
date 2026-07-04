import { CommonActions, type NavigationState } from "@react-navigation/native";
import { Platform } from "react-native";

import { navigationRef } from "../navigation/navigationRef";

type ResetRoute = { name: string; params?: object };

const queue: Array<() => void> = [];
let flushScheduled = false;

const ANDROID_SETTLE_MS = 64;

function runWhenIdle(callback: () => void) {
    const requestIdle = (
        globalThis as { requestIdleCallback?: (cb: () => void) => number }
    ).requestIdleCallback;
    if (typeof requestIdle === "function") {
        requestIdle(callback);
        return;
    }
    requestAnimationFrame(() => {
        setTimeout(callback, 0);
    });
}

function waitForNavReady(attempt = 0): Promise<void> {
    if (navigationRef.isReady()) return Promise.resolve();
    if (attempt > 40) return Promise.resolve();
    return new Promise((resolve) => {
        setTimeout(() => resolve(waitForNavReady(attempt + 1)), 50);
    });
}

function runFlush() {
    flushScheduled = false;
    void waitForNavReady().then(() => {
        if (!navigationRef.isReady()) {
            scheduleFlush();
            return;
        }
        const action = queue.shift();
        action?.();
        if (queue.length > 0) scheduleFlush();
    });
}

function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;

    runWhenIdle(() => {
        requestAnimationFrame(() => {
            const delay = Platform.OS === "android" ? ANDROID_SETTLE_MS : 0;
            setTimeout(runFlush, delay);
        });
    });
}

function enqueue(action: () => void) {
    queue.push(action);
    scheduleFlush();
}

export function safeReset(routes: ResetRoute[]) {
    enqueue(() => {
        navigationRef.dispatch(
            CommonActions.reset({
                index: 0,
                routes,
            })
        );
    });
}

export function safeNavigate(name: string, params?: object) {
    enqueue(() => {
        // Root stack param list is wide; route names are validated at runtime.
        (navigationRef.navigate as (n: string, p?: object) => void)(name, params);
    });
}

export function getFocusedRouteName(state: NavigationState | undefined): string | undefined {
    if (!state) return undefined;
    const route = state.routes[state.index ?? 0];
    if (route.state) {
        return getFocusedRouteName(route.state as NavigationState);
    }
    return route.name;
}
