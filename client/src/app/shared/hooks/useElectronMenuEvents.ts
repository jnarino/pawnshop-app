import { useEffect, useRef } from 'react';

export function useElectronMenuEvents(
    handlers: Partial<Record<keyof NonNullable<typeof window.electronAPI>, () => void>>
) {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        const api = globalThis.electronAPI;
        if (!api) return;

        const unsubscribes: Array<() => void> = [];
        const currentHandlers = handlersRef.current;

        Object.entries(currentHandlers).forEach(([method, handler]) => {
            // @ts-ignore - Dynamic access to API methods
            const subscribeFn = api[method];
            if (typeof subscribeFn === 'function' && handler) {
                const dispose = subscribeFn(handler);
                if (dispose) unsubscribes.push(dispose);
            }
        });

        return () => {
            unsubscribes.forEach((fn) => fn());
        };
    }, []);
}
