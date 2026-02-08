
// ... (previous content)
declare global {
    interface Window {
        electronAPI?: {
            getApiConfig: () => Promise<{ serverUrl: string }>;
        };
    }
}

let apiBaseUrl = '';

export const setApiBaseUrl = (url: string) => {
    apiBaseUrl = url;
};

export const getApiBaseUrl = () => {
    return apiBaseUrl;
};

export const initializeApiConfig = async () => {
    // Check if running in Electron
    if (window.electronAPI) {
        try {
            const config = await window.electronAPI.getApiConfig();
            if (config && config.serverUrl) {
                // Remove trailing slash if present
                const url = config.serverUrl.replace(/\/$/, '');
                console.log('[API] Initialized with Base URL:', url);
                setApiBaseUrl(url);
            }
        } catch (error) {
            console.error('[API] Failed to load config from Electron:', error);
        }
    } else {
        console.log('[API] Running in Browser Mode (using proxy)');
    }
};
