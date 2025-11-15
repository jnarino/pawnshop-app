import { getAccessToken, ensureFreshAccessToken } from '../auth/authService';

// ✅ Add rate limiting to prevent rapid duplicate requests
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_DURATION = 1000; // 1 second

// ✅ Base URL configuration with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function http(
  path: string, 
  options: RequestInit = {}
): Promise<any> {
  
  console.log(`🌐 Making request to: ${path}`);
  
  // ✅ Check for duplicate requests
  const cacheKey = `${options.method || 'GET'}:${path}`;
  const now = Date.now();
  const cached = requestCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`🔄 Using cached request for: ${path}`);
    return cached.promise;
  }
  
  const requestPromise = makeRequest(path, options);
  requestCache.set(cacheKey, { promise: requestPromise, timestamp: now });
  
  // ✅ Clean up old cache entries
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, CACHE_DURATION * 2);
  
  return requestPromise;
}

async function makeRequest(path: string, options: RequestInit = {}): Promise<any> {
  try {
    // ✅ Ensure we have a fresh access token
    const hasValidToken = await ensureFreshAccessToken();
    if (!hasValidToken) {
      console.warn('❌ No valid token available');
      throw new Error('Authentication required');
    }

    const token = getAccessToken();
    
    const fullUrl = path.startsWith('/') ? path : `/${path}`;
    const absoluteUrl = path.startsWith('http') ? path : `${BASE_URL}${fullUrl}`;
    
    console.log(`📤 Request: ${options.method || 'GET'} ${absoluteUrl}`);
    
    const response = await fetch(absoluteUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      
      // ✅ Better error handling for category loading
      if (path.includes('/category') || path.includes('/categories')) {
        console.error('❌ Category loading failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: absoluteUrl
        });
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Success:`, data);
    return data;
    
  } catch (error) {
    console.error('❌ Request failed:', error);
    
    // ✅ Network connection errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please check if the server is running on http://localhost:3000');
    }
    
    throw error;
  }
}
