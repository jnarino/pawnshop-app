import { useState, useCallback } from 'react';

type CanNavigateFn<T extends string> = (targetTab: T) => boolean;

interface UseWorkspaceTabsOptions<T extends string> {
    initialTab: T;
    canNavigate?: CanNavigateFn<T>;
}

export function useWorkspaceTabs<T extends string>({ initialTab, canNavigate }: UseWorkspaceTabsOptions<T>) {
    const [activeTab, setActiveTab] = useState<T>(initialTab);

    const navigateToTab = useCallback((targetTab: T) => {
        if (canNavigate && !canNavigate(targetTab)) {
            return false;
        }
        setActiveTab(targetTab);
        return true;
    }, [canNavigate]);

    return {
        activeTab,
        setActiveTab,
        navigateToTab
    };
}
