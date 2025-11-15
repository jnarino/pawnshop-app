import { getAccessToken, ensureFreshAccessToken } from '../auth/authService';

// ✅ Base URL configuration with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ✅ Enhanced error handling and logging
export async function http(
  path: string, 
  options: RequestInit = {}
): Promise<any> {
  
  console.log(`🌐 Making request to: ${path}`);
  
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
