/**
 * REST Client utility for making HTTP requests
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface RestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  duration: number;
}

export interface CurlCommand {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Make a REST request
 */
export const makeRequest = async (config: RequestConfig): Promise<RestResponse> => {
  const startTime = Date.now();
  
  try {
    // Build headers - only set default Content-Type if body exists and no Content-Type is provided
    const headers: Record<string, string> = { ...config.headers };
    
    // Check if Content-Type header is already provided (case-insensitive)
    const hasContentType = Object.keys(headers).some(
      key => key.toLowerCase() === 'content-type'
    );
    
    // Only set default Content-Type to application/json if:
    // 1. A request body exists
    // 2. No Content-Type header is already provided by the user
    if (config.body && !hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      headers,
      timeout: config.timeout || 30000,
      data: config.body,
      transformResponse: [(data: any) => data], // Keep raw response
    };

    const response: AxiosResponse = await axios(axiosConfig);
    const duration = Date.now() - startTime;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers as Record<string, string>,
        data: typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data, null, 2),
        duration,
      };
    } else if (error.request) {
      // Request was made but no response received
      throw new Error(`Network error: ${error.message}`);
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
  }
};

/**
 * Parse a curl command and extract request details
 */
export const parseCurlCommand = (curlCommand: string): CurlCommand => {
  const normalizedCurl = curlCommand.trim();
  
  // Basic validation
  if (!normalizedCurl.startsWith('curl')) {
    throw new Error('Invalid curl command: must start with "curl"');
  }

  const result: CurlCommand = {
    url: '',
    method: 'GET',
    headers: {},
    body: undefined,
  };

  // Extract method first
  const methodMatch = normalizedCurl.match(/-X\s+(\w+)/i) || 
                     normalizedCurl.match(/--request\s+(\w+)/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract headers
  const headerRegex = /-H\s+['"]([^'"]+)['"]|--header\s+['"]([^'"]+)['"]/g;
  let headerMatch;
  while ((headerMatch = headerRegex.exec(normalizedCurl)) !== null) {
    const headerValue = headerMatch[1] || headerMatch[2];
    const [key, ...valueParts] = headerValue.split(':');
    if (key && valueParts.length > 0) {
      result.headers[key.trim()] = valueParts.join(':').trim();
    }
  }

  // Extract body data - handle both quoted and unquoted with proper precedence
  // Try single quotes first
  let dataMatch = normalizedCurl.match(/-d\s+'([^']+)'|--data\s+'([^']+)'/);
  if (dataMatch) {
    result.body = dataMatch[1] || dataMatch[2];
  } else {
    // Try double quotes
    dataMatch = normalizedCurl.match(/-d\s+"([^"]+)"|--data\s+"([^"]+)"/);
    if (dataMatch) {
      result.body = dataMatch[1] || dataMatch[2];
    } else {
      // Try unquoted data
      dataMatch = normalizedCurl.match(/-d\s+([^\s]+)|--data\s+([^\s]+)/);
      if (dataMatch) {
        result.body = dataMatch[1] || dataMatch[2];
      }
    }
  }
  
  // If body is provided and no explicit method, default to POST
  if (result.body && result.method === 'GET') {
    result.method = 'POST';
  }

  // Extract URL - handle URLs with and without quotes properly
  // First try to find quoted URLs
  let urlMatch = normalizedCurl.match(/["'](https?:\/\/[^"']+)["']/);
  if (urlMatch) {
    result.url = urlMatch[1];
  } else {
    // Try unquoted URLs - match until space or end of string
    urlMatch = normalizedCurl.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      result.url = urlMatch[0];
    } else {
      // Fallback: extract the last non-flag argument
      // Remove curl and all known flags to find the URL
      let remaining = normalizedCurl.replace(/^curl\s+/, '');
      remaining = remaining.replace(/-X\s+\w+/gi, '');
      remaining = remaining.replace(/--request\s+\w+/gi, '');
      remaining = remaining.replace(/-H\s+['"][^'"]+['"]/g, '');
      remaining = remaining.replace(/--header\s+['"][^'"]+['"]/g, '');
      remaining = remaining.replace(/-d\s+['"][^'"]*['"]/g, '');
      remaining = remaining.replace(/--data\s+['"][^'"]*['"]/g, '');
      remaining = remaining.replace(/-d\s+[^\s]+/g, '');
      remaining = remaining.replace(/--data\s+[^\s]+/g, '');
      
      // Clean up extra spaces and get the remaining non-empty part
      const parts = remaining.trim().split(/\s+/).filter(part => part.length > 0);
      if (parts.length > 0) {
        // Take the first part that looks like a URL or the first part if no URL found
        const potentialUrl = parts.find(part => part.includes('.') || part.startsWith('/')) || parts[0];
        if (potentialUrl) {
          result.url = potentialUrl.replace(/^['"]|['"]$/g, ''); // Remove quotes
        }
      }
    }
  }

  if (!result.url) {
    throw new Error('Invalid curl command: URL not found');
  }

  return result;
};

/**
 * Convert curl command to RequestConfig
 */
export const curlToRequestConfig = (curlCommand: string): RequestConfig => {
  const parsed = parseCurlCommand(curlCommand);
  
  return {
    url: parsed.url,
    method: parsed.method as RequestConfig['method'],
    headers: parsed.headers,
    body: parsed.body,
  };
};

/**
 * Generate curl command from RequestConfig
 */
export const requestConfigToCurl = (config: RequestConfig): string => {
  let curl = `curl -X ${config.method}`;
  
  // Add headers
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });
  }
  
  // Add body
  if (config.body) {
    curl += ` -d '${config.body}'`;
  }
  
  // Add URL
  curl += ` "${config.url}"`;
  
  return curl;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Format JSON string with proper indentation
 */
export const formatJsonResponse = (data: string): string => {
  try {
    const parsed = JSON.parse(data);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Return original data if not valid JSON
    return data;
  }
};
