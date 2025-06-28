import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createJWT } from 'did-jwt';
import { ATPConfig, ATPError, ATPNetworkError, ATPAuthenticationError, ATPResponse } from '../types.js';

export abstract class BaseClient {
  protected http: AxiosInstance;
  protected config: Required<ATPConfig>;

  constructor(config: ATPConfig, serviceKey: 'identity' | 'credentials' | 'permissions' | 'audit' | 'gateway') {
    this.config = this.normalizeConfig(config);
    
    const baseURL = this.config.services[serviceKey!] || 
                   `${this.config.baseUrl}${this.getServicePath(serviceKey)}`;

    this.http = axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ATP-SDK/0.1.0',
        ...this.config.headers
      }
    });

    this.setupInterceptors();
  }

  private normalizeConfig(config: ATPConfig): Required<ATPConfig> {
    return {
      baseUrl: config.baseUrl,
      services: {
        identity: config.services?.identity,
        credentials: config.services?.credentials,
        permissions: config.services?.permissions,
        audit: config.services?.audit,
        gateway: config.services?.gateway,
        ...config.services
      },
      auth: {
        did: config.auth?.did,
        privateKey: config.auth?.privateKey,
        token: config.auth?.token,
        ...config.auth
      },
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false,
      headers: config.headers || {}
    };
  }

  private getServicePath(serviceKey: 'identity' | 'credentials' | 'permissions' | 'audit' | 'gateway'): string {
    const paths = {
      identity: ':3001',
      credentials: ':3002',
      permissions: ':3003',
      audit: ':3005',
      gateway: ':3000'
    };
    return paths[serviceKey!] || '';
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.http.interceptors.request.use(
      async (config) => {
        if (this.config.auth.token) {
          config.headers.Authorization = `Bearer ${this.config.auth.token}`;
        } else if (this.config.auth.did && this.config.auth.privateKey) {
          const token = await this.generateJWT();
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (this.config.debug) {
          console.log(`[ATP SDK] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          console.log(`[ATP SDK] Response:`, response.data);
        }
        return response;
      },
      (error) => {
        const atpError = this.handleError(error);
        if (this.config.debug) {
          console.error(`[ATP SDK] Error:`, atpError);
        }
        return Promise.reject(atpError);
      }
    );
  }

  private async generateJWT(): Promise<string> {
    if (!this.config.auth.did || !this.config.auth.privateKey) {
      throw new ATPAuthenticationError('DID and private key required for JWT generation');
    }

    try {
      // Create JWT payload
      const payload = {
        iss: this.config.auth.did,
        sub: this.config.auth.did,
        aud: 'atp-services',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        nbf: Math.floor(Date.now() / 1000)
      };

      // Sign JWT with DID private key
      const jwt = await createJWT(
        payload,
        { issuer: this.config.auth.did!, signer: () => Promise.resolve(this.config.auth.privateKey!) },
        { alg: 'EdDSA' }
      );

      return jwt;
    } catch (error) {
      throw new ATPAuthenticationError(`Failed to generate JWT: ${error}`);
    }
  }

  private handleError(error: any): ATPError {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new ATPNetworkError(`Network error: ${error.message}`, error);
    }

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new ATPAuthenticationError(data?.error || 'Authentication failed');
        case 403:
          return new ATPError(data?.error || 'Authorization failed', 'AUTHZ_ERROR', 403);
        case 400:
          return new ATPError(data?.error || 'Bad request', 'VALIDATION_ERROR', 400, data?.details);
        case 404:
          return new ATPError(data?.error || 'Not found', 'NOT_FOUND', 404);
        case 500:
          return new ATPError(data?.error || 'Internal server error', 'SERVER_ERROR', 500);
        default:
          return new ATPError(data?.error || 'Unknown error', 'UNKNOWN_ERROR', status);
      }
    }

    return new ATPError(error.message || 'Unknown error occurred');
  }

  protected async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ATPResponse<T>> {
    try {
      const response: AxiosResponse<ATPResponse<T>> = await this.http.request({
        method,
        url,
        data,
        ...config
      });

      return response.data;
    } catch (error) {
      throw error; // Re-throw as it's already handled by interceptor
    }
  }

  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ATPResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ATPResponse<T>> {
    return this.request<T>('POST', url, data, config);
  }

  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ATPResponse<T>> {
    return this.request<T>('PUT', url, data, config);
  }

  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ATPResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  protected async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ATPResponse<T>> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * Update authentication token
   */
  public setAuthToken(token: string): void {
    this.config.auth.token = token;
  }

  /**
   * Update DID and private key for authentication
   */
  public setDIDAuth(did: string, privateKey: string): void {
    this.config.auth.did = did;
    this.config.auth.privateKey = privateKey;
    this.config.auth.token = undefined; // Clear token when using DID auth
  }

  /**
   * Update authentication configuration
   */
  public updateAuth(auth: {
    did?: string;
    privateKey?: string;
    token?: string;
  }): void {
    this.config.auth = { ...this.config.auth, ...auth };
  }

  /**
   * Check if client is authenticated
   */
  public isAuthenticated(): boolean {
    return !!(this.config.auth.token || (this.config.auth.did && this.config.auth.privateKey));
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ATPConfig> {
    return { ...this.config };
  }
}