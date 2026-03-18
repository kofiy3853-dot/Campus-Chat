/**
 * Centralized error handling utility
 * Provides user-friendly error messages and logging
 */

export interface ApiError {
  status?: number;
  message: string;
  details?: string;
  timestamp?: string;
}

/**
 * Parse API error and return user-friendly message
 */
export const parseApiError = (error: any): ApiError => {
  const status = error.response?.status;
  const data = error.response?.data;
  const message = data?.message || error.message || 'An error occurred';

  let userMessage = message;
  let details = '';

  switch (status) {
    case 400:
      userMessage = 'Invalid request. Please check your input.';
      details = message;
      break;

    case 401:
      userMessage = 'Session expired. Please login again.';
      details = 'Your authentication token is invalid or expired.';
      break;

    case 403:
      userMessage = 'You do not have permission to perform this action.';
      details = message;
      break;

    case 404:
      userMessage = 'The requested resource was not found.';
      details = `Endpoint: ${error.config?.url}`;
      break;

    case 409:
      userMessage = 'This resource already exists.';
      details = message;
      break;

    case 429:
      userMessage = 'Too many requests. Please try again later.';
      details = 'You have exceeded the rate limit.';
      break;

    case 500:
      userMessage = 'Server error. Please try again later.';
      details = 'The server encountered an error processing your request.';
      break;

    case 503:
      userMessage = 'Service unavailable. Please try again later.';
      details = 'The server is temporarily unavailable.';
      break;

    default:
      if (!error.response) {
        userMessage = 'Network error. Please check your connection.';
        details = `Unable to reach: ${error.config?.baseURL}`;
      }
  }

  return {
    status,
    message: userMessage,
    details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log error with context
 */
export const logError = (context: string, error: any, additionalInfo?: any) => {
  const parsed = parseApiError(error);

  console.error(`[${context}] Error:`, {
    status: parsed.status,
    message: parsed.message,
    details: parsed.details,
    originalError: error.message,
    url: error.config?.url,
    method: error.config?.method,
    additionalInfo,
    timestamp: parsed.timestamp,
  });
};

/**
 * Show user-friendly error notification
 * (Integrate with your notification system)
 */
export const showErrorNotification = (error: any, context?: string) => {
  const parsed = parseApiError(error);

  // Log for debugging
  if (context) {
    logError(context, error);
  }

  // Return parsed error for UI display
  return parsed;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.message === 'Network Error';
};

/**
 * Check if error is a 404
 */
export const is404Error = (error: any): boolean => {
  return error.response?.status === 404;
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Check if error is server error
 */
export const isServerError = (error: any): boolean => {
  const status = error.response?.status;
  return status && status >= 500 && status < 600;
};

/**
 * Retry logic for failed requests
 */
export const retryRequest = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors (except 429)
      if ((error as any).response?.status && (error as any).response.status < 500 && (error as any).response.status !== 429) {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        console.warn(`[Retry] Attempt ${i + 1} failed. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

/**
 * Format error for display
 */
export const formatErrorForDisplay = (error: any): string => {
  const parsed = parseApiError(error);
  return parsed.details ? `${parsed.message}\n${parsed.details}` : parsed.message;
};
