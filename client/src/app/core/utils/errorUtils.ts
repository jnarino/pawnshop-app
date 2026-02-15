
interface ErrorResponse {
    message?: string;
    error?: string;
    statusCode?: number;
}

export function getFriendlyErrorMessage(error: any): string {

    if (!error) return 'An unexpected error occurred';

    // Handle Network/Fetch errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Handle string errors
    if (typeof error === 'string') return error;

    // Handle Error objects
    if (error instanceof Error) {
        if (error.message.includes('HTTP 404')) return 'Requested resource not found (404).';
        if (error.message.includes('HTTP 500')) return 'Internal Server Error. Please contact support.';
        if (error.message.includes('<html')) return 'Server returned an invalid response. Please try again later.';
        return error.message;
    }

    // Handle API Error Responses (assuming standard format)
    if (typeof error === 'object') {
        const errObj = error as ErrorResponse;
        if (errObj.message) return errObj.message;
        if (errObj.error) return errObj.error;
    }

    return 'Something went wrong. Please try again.';
}
