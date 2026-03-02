/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Centralized API Client
 * Mirrors: Axios interceptor patterns + TanStack Query best practices
 * Handles all HTTP requests with retry, timeout, caching, error handling
 * 
 * Usage:
 * const client = new APIClient({ baseURL: 'https://api.example.com', retries: 3 });
 * const data = await client.get<User>('/users/123');
 * const result = await client.post<Response>('/users', { name: 'John' });
 */

import { APIError, NetworkError, TimeoutError, RateLimitError, errorRecovery, logError, parseError, ValidationError } from './error-handler';
import { z } from 'zod';
export interface APIConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTime?: number; // in milliseconds
}
export interface RequestOptions<T = any> extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
  skipCache?: boolean;
  skipRetry?: boolean;
  schema?: z.ZodSchema<T>;
}
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Professional API Client with retry, timeout, and caching
 */
export class APIClient {
  private config: Required<APIConfig>;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private activeRequests: Map<string, Promise<any>> = new Map();
  constructor(config: APIConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      useCache: config.useCache ?? true,
      cacheTime: config.cacheTime || 1000 * 60 * 5 // 5 minutes default
    };
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body || '';
    return `${method}:${url}:${headers}:${body}`;
  }

  /**
   * Get cached response if available and not expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Store response in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTime
    });
  }

  /**
   * Clear cache (optionally by pattern)
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`, timeoutMs);
      }
      throw new NetworkError(error.message || 'Network request failed');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: Response, endpoint: string, method: string): Promise<never> {
    let errorMessage = `${method} ${endpoint} failed with status ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
    } catch (e) {
      console.warn('Failed to parse error response:', e);
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new RateLimitError(errorMessage, retryAfterSeconds);
    }
    throw new APIError(errorMessage, endpoint, response.status, method);
  }

  /**
   * Core request method with retry and caching
   */
  async request<T>(endpoint: string, options: RequestOptions<T> = {}): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const timeout = options.timeout || this.config.timeout;

    // Build query string from params
    let finalUrl = url;
    if (options.params) {
      const queryString = new URLSearchParams(Object.entries(options.params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])).toString();
      if (queryString) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    // Remove params and schema from options (internal use)
    const {
      params: _params,
      schema,
      ...restOptions
    } = options;
    const fetchOptions: RequestInit = {
      ...restOptions,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers
      }
    };

    // Generate cache key
    const cacheKey = this.getCacheKey(finalUrl, fetchOptions);

    // Check cache for GET requests
    if (method === 'GET' && this.config.useCache && !options.skipCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Check if request is already in flight (request deduplication)
      const activeRequest = this.activeRequests.get(cacheKey);
      if (activeRequest) {
        return activeRequest;
      }
    }

    // Create request function
    const requestFn = async (): Promise<T> => {
      const response = await this.fetchWithTimeout(finalUrl, fetchOptions, timeout);
      if (!response.ok) {
        await this.parseErrorResponse(response, endpoint, method);
      }

      // Handle empty responses
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return {} as T;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Runtime validation with Zod if schema provided
      if (options.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          const validationError = new ValidationError(`API response validation failed for ${endpoint}`, undefined, result.error.format());
          logError(validationError, {
            endpoint,
            method
          });
          throw validationError;
        }
        data = result.data;
      }

      // Cache successful GET requests
      if (method === 'GET' && this.config.useCache && !options.skipCache) {
        this.setCache(cacheKey, data);
      }
      return data as T;
    };
    try {
      // Store active request for deduplication
      if (method === 'GET' && !options.skipCache) {
        const requestPromise = options.skipRetry ? requestFn() : errorRecovery.retry(requestFn, this.config.retries, this.config.retryDelay);
        this.activeRequests.set(cacheKey, requestPromise);
        const result = await requestPromise;
        this.activeRequests.delete(cacheKey);
        return result;
      }

      // Non-GET requests or when cache is disabled
      return options.skipRetry ? await requestFn() : await errorRecovery.retry(requestFn, this.config.retries, this.config.retryDelay);
    } catch (error) {
      this.activeRequests.delete(cacheKey);
      const appError = parseError(error);
      logError(appError, {
        endpoint,
        method
      });
      throw appError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'params'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      params
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

/**
 * Create specialized API clients for different services
 */

// GitHub API Client
export const githubAPI = new APIClient({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28'
  },
  retries: 3,
  retryDelay: 1000,
  useCache: true,
  cacheTime: 1000 * 60 * 30,
  // 30 minutes
  timeout: 15000
});

// Reddit API Client (public endpoints)
export const redditAPI = new APIClient({
  baseURL: 'https://www.reddit.com',
  headers: {
    'User-Agent': 'TheCouncil-Research-Bot/1.0.0 (by /u/TheCouncilBot)'
  },
  retries: 2,
  retryDelay: 2000,
  // Reddit is more aggressive with rate limiting
  useCache: true,
  cacheTime: 1000 * 60 * 15,
  // 15 minutes
  timeout: 20000
});

// HackerNews Algolia API Client
export const hackerNewsAPI = new APIClient({
  baseURL: 'https://hn.algolia.com/api/v1',
  headers: {
    'Accept': 'application/json'
  },
  retries: 3,
  retryDelay: 1000,
  useCache: true,
  cacheTime: 1000 * 60 * 10,
  // 10 minutes
  timeout: 10000
});

// Generic API client factory
export const createAPIClient = (config: APIConfig): APIClient => {
  return new APIClient(config);
};