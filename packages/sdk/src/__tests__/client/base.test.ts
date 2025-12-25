/**
 * Tests for BaseClient HTTP layer
 */

import axios from 'axios';
import { BaseClient } from '../../client/base';
import { ATPConfig, ATPError, ATPNetworkError, ATPAuthenticationError } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a concrete implementation for testing
class TestClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'identity');
  }

  // Expose protected methods for testing
  public async testGet<T>(url: string) {
    return this.get<T>(url);
  }

  public async testPost<T>(url: string, data: any) {
    return this.post<T>(url, data);
  }

  public async testPut<T>(url: string, data: any) {
    return this.put<T>(url, data);
  }

  public async testDelete<T>(url: string) {
    return this.delete<T>(url);
  }

  public async testPatch<T>(url: string, data: any) {
    return this.patch<T>(url, data);
  }
}

describe('BaseClient', () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let responseInterceptor: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            requestInterceptor = { onFulfilled, onRejected };
          })
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            responseInterceptor = { onFulfilled, onRejected };
          })
        }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      const config: ATPConfig = {
        baseUrl: 'http://localhost',
        services: {
          identity: 'http://identity-service:3001'
        }
      };

      new TestClient(config);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://identity-service:3001',
        timeout: 30000, // default
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ATP-SDK/0.1.0'
        }
      });
    });

    it('should use default service path when service URL not provided', () => {
      const config: ATPConfig = {
        baseUrl: 'http://localhost'
      };

      new TestClient(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3001'
        })
      );
    });

    it('should use custom timeout', () => {
      const config: ATPConfig = {
        baseUrl: 'http://localhost',
        timeout: 60000
      };

      new TestClient(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000
        })
      );
    });

    it('should include custom headers', () => {
      const config: ATPConfig = {
        baseUrl: 'http://localhost',
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      };

      new TestClient(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value'
          })
        })
      );
    });

    it('should setup request and response interceptors', () => {
      new TestClient({ baseUrl: 'http://localhost' });

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    it('should add bearer token when auth.token is provided', async () => {
      const config: ATPConfig = {
        baseUrl: 'http://localhost',
        auth: { token: 'test-token' }
      };

      new TestClient(config);

      const requestConfig = { headers: {} as any };
      const result = await requestInterceptor.onFulfilled(requestConfig);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add authorization when no auth provided', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const requestConfig = { headers: {} as any };
      const result = await requestInterceptor.onFulfilled(requestConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should log request in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const config: ATPConfig = {
        baseUrl: 'http://localhost',
        debug: true
      };

      new TestClient(config);

      const requestConfig = {
        method: 'post',
        url: '/test',
        data: { foo: 'bar' },
        headers: {}
      };
      await requestInterceptor.onFulfilled(requestConfig);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ATP SDK] POST /test',
        { foo: 'bar' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('response interceptor', () => {
    it('should pass through successful responses', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const response = { data: { success: true } };
      const result = await responseInterceptor.onFulfilled(response);

      expect(result).toBe(response);
    });

    it('should log response in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      new TestClient({
        baseUrl: 'http://localhost',
        debug: true
      });

      const response = { data: { result: 'test' } };
      await responseInterceptor.onFulfilled(response);

      expect(consoleSpy).toHaveBeenCalledWith('[ATP SDK] Response:', { result: 'test' });

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle network errors (ECONNREFUSED)', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const networkError = { code: 'ECONNREFUSED', message: 'Connection refused' };

      await expect(
        responseInterceptor.onRejected(networkError)
      ).rejects.toBeInstanceOf(ATPNetworkError);
    });

    it('should handle network errors (ETIMEDOUT)', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const timeoutError = { code: 'ETIMEDOUT', message: 'Connection timed out' };

      await expect(
        responseInterceptor.onRejected(timeoutError)
      ).rejects.toBeInstanceOf(ATPNetworkError);
    });

    it('should handle 401 authentication errors', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const authError = {
        response: {
          status: 401,
          data: { error: 'Invalid token' }
        }
      };

      await expect(
        responseInterceptor.onRejected(authError)
      ).rejects.toBeInstanceOf(ATPAuthenticationError);
    });

    it('should handle 403 authorization errors', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const authzError = {
        response: {
          status: 403,
          data: { error: 'Access denied' }
        }
      };

      try {
        await responseInterceptor.onRejected(authzError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).code).toBe('AUTHZ_ERROR');
      }
    });

    it('should handle 400 validation errors', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const validationError = {
        response: {
          status: 400,
          data: { error: 'Invalid input', details: { field: 'email' } }
        }
      };

      try {
        await responseInterceptor.onRejected(validationError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle 404 not found errors', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Resource not found' }
        }
      };

      try {
        await responseInterceptor.onRejected(notFoundError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).code).toBe('NOT_FOUND');
      }
    });

    it('should handle 500 server errors', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };

      try {
        await responseInterceptor.onRejected(serverError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).code).toBe('SERVER_ERROR');
      }
    });

    it('should handle unknown status codes', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const unknownError = {
        response: {
          status: 418,
          data: { error: "I'm a teapot" }
        }
      };

      try {
        await responseInterceptor.onRejected(unknownError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).code).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle errors without response', async () => {
      new TestClient({ baseUrl: 'http://localhost' });

      const genericError = { message: 'Something went wrong' };

      try {
        await responseInterceptor.onRejected(genericError);
      } catch (error) {
        expect(error).toBeInstanceOf(ATPError);
        expect((error as ATPError).message).toBe('Something went wrong');
      }
    });
  });

  describe('HTTP methods', () => {
    let client: TestClient;

    beforeEach(() => {
      client = new TestClient({ baseUrl: 'http://localhost' });
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });
    });

    it('should make GET requests', async () => {
      await client.testGet('/test');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
        data: undefined
      });
    });

    it('should make POST requests with data', async () => {
      await client.testPost('/test', { foo: 'bar' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data: { foo: 'bar' }
      });
    });

    it('should make PUT requests with data', async () => {
      await client.testPut('/test', { foo: 'bar' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test',
        data: { foo: 'bar' }
      });
    });

    it('should make DELETE requests', async () => {
      await client.testDelete('/test');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test',
        data: undefined
      });
    });

    it('should make PATCH requests with data', async () => {
      await client.testPatch('/test', { foo: 'bar' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/test',
        data: { foo: 'bar' }
      });
    });
  });

  describe('authentication methods', () => {
    it('should set auth token', () => {
      const client = new TestClient({ baseUrl: 'http://localhost' });

      client.setAuthToken('new-token');

      expect(client.isAuthenticated()).toBe(true);
      expect(client.getConfig().auth?.token).toBe('new-token');
    });

    it('should set DID auth and clear token', () => {
      const client = new TestClient({
        baseUrl: 'http://localhost',
        auth: { token: 'old-token' }
      });

      client.setDIDAuth('did:atp:test', 'private-key');

      const config = client.getConfig();
      expect(config.auth?.did).toBe('did:atp:test');
      expect(config.auth?.privateKey).toBe('private-key');
      expect(config.auth?.token).toBeUndefined();
    });

    it('should update auth partially', () => {
      const client = new TestClient({
        baseUrl: 'http://localhost',
        auth: { did: 'did:atp:old' }
      });

      client.updateAuth({ token: 'new-token' });

      const config = client.getConfig();
      expect(config.auth?.did).toBe('did:atp:old');
      expect(config.auth?.token).toBe('new-token');
    });

    it('should report authenticated state correctly', () => {
      // No auth
      const client1 = new TestClient({ baseUrl: 'http://localhost' });
      expect(client1.isAuthenticated()).toBe(false);

      // Token auth
      const client2 = new TestClient({
        baseUrl: 'http://localhost',
        auth: { token: 'token' }
      });
      expect(client2.isAuthenticated()).toBe(true);

      // DID auth
      const client3 = new TestClient({
        baseUrl: 'http://localhost',
        auth: { did: 'did:atp:test', privateKey: 'key' }
      });
      expect(client3.isAuthenticated()).toBe(true);

      // Partial DID auth (missing privateKey)
      const client4 = new TestClient({
        baseUrl: 'http://localhost',
        auth: { did: 'did:atp:test' }
      });
      expect(client4.isAuthenticated()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const client = new TestClient({
        baseUrl: 'http://localhost',
        timeout: 5000,
        auth: { token: 'test' }
      });

      const config = client.getConfig();

      expect(config.baseUrl).toBe('http://localhost');
      expect(config.timeout).toBe(5000);
      expect(config.auth?.token).toBe('test');
    });

    it('should return a copy of configuration', () => {
      const client = new TestClient({ baseUrl: 'http://localhost' });

      const config1 = client.getConfig();
      const config2 = client.getConfig();

      expect(config1).not.toBe(config2);
    });
  });
});
