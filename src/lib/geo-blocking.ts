/**
 * Geo-blocking System
 * Block or allow authentication based on geographic location
 */

import { logSuspiciousActivity } from './auth-logger';

export interface GeoLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

export interface GeoBlockingConfig {
  mode: 'allow' | 'block'; // Allow list or block list
  countries: string[]; // ISO country codes (e.g., 'US', 'CN', 'RU')
  allowVPN?: boolean; // Allow VPN/proxy connections
  allowTor?: boolean; // Allow Tor exit nodes
}

class GeoBlockingService {
  private static instance: GeoBlockingService;
  private config: GeoBlockingConfig;
  private geoCache: Map<string, { location: GeoLocation; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Default config: Allow all except known high-risk countries
    this.config = {
      mode: 'block',
      countries: process.env.BLOCKED_COUNTRIES?.split(',') || [],
      allowVPN: true,
      allowTor: false,
    };
  }

  static getInstance(): GeoBlockingService {
    if (!GeoBlockingService.instance) {
      GeoBlockingService.instance = new GeoBlockingService();
    }
    return GeoBlockingService.instance;
  }

  /**
   * Update geo-blocking configuration
   */
  setConfig(config: Partial<GeoBlockingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[GeoBlocking] Config updated:', this.config);
  }

  /**
   * Get geo location for IP address
   */
  async getLocation(ip: string): Promise<GeoLocation | null> {
    // Check cache first
    const cached = this.geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.location;
    }

    try {
      // Use multiple geo-IP services for redundancy
      const location = await this.fetchFromGeoIPService(ip);
      
      if (location) {
        this.geoCache.set(ip, { location, timestamp: Date.now() });
        return location;
      }
    } catch (error) {
      console.error('[GeoBlocking] Failed to get location:', error);
    }

    return null;
  }

  /**
   * Check if IP should be blocked
   */
  async isBlocked(ip: string, userAgent: string): Promise<{
    blocked: boolean;
    reason?: string;
    location?: GeoLocation;
  }> {
    // Skip blocking for local/private IPs
    if (this.isLocalIP(ip)) {
      return { blocked: false };
    }

    const location = await this.getLocation(ip);
    
    if (!location) {
      // If we can't determine location, allow by default (or block if paranoid)
      return { blocked: false };
    }

    // Check VPN/Proxy
    if (location.isp?.toLowerCase().includes('vpn') || 
        location.isp?.toLowerCase().includes('proxy')) {
      if (!this.config.allowVPN) {
        logSuspiciousActivity('VPN connection blocked', ip, userAgent, {
          isp: location.isp,
          country: location.country
        });
        return {
          blocked: true,
          reason: 'VPN/Proxy connections are not allowed',
          location
        };
      }
    }

    // Check country-based blocking
    if (this.config.mode === 'block') {
      // Block list mode: block if country is in the list
      if (this.config.countries.includes(location.countryCode)) {
        logSuspiciousActivity(
          `Access from blocked country: ${location.country}`,
          ip,
          userAgent,
          { countryCode: location.countryCode }
        );
        return {
          blocked: true,
          reason: `Access from ${location.country} is not allowed`,
          location
        };
      }
    } else {
      // Allow list mode: block if country is NOT in the list
      if (!this.config.countries.includes(location.countryCode)) {
        logSuspiciousActivity(
          `Access from non-allowed country: ${location.country}`,
          ip,
          userAgent,
          { countryCode: location.countryCode }
        );
        return {
          blocked: true,
          reason: `Access is only allowed from specific countries`,
          location
        };
      }
    }

    return { blocked: false, location };
  }

  /**
   * Fetch location from geo-IP service
   */
  private async fetchFromGeoIPService(ip: string): Promise<GeoLocation | null> {
    try {
      // Option 1: ipapi.co (free tier: 1000 requests/day)
      if (process.env.IPAPI_KEY) {
        const response = await fetch(`https://ipapi.co/${ip}/json/?key=${process.env.IPAPI_KEY}`);
        if (response.ok) {
          const data = await response.json();
          return {
            country: data.country_name,
            countryCode: data.country_code,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.org,
          };
        }
      }

      // Option 2: ip-api.com (free, no key required, rate limited)
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,isp`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          return {
            country: data.country,
            countryCode: data.countryCode,
            region: data.region,
            city: data.city,
            latitude: data.lat,
            longitude: data.lon,
            isp: data.isp,
          };
        }
      }

      // Option 3: Fallback to MaxMind GeoLite2 (requires local database)
      // In production, use MaxMind GeoIP2 with local database for better performance
      
      return null;
    } catch (error) {
      console.error('[GeoBlocking] Geo-IP lookup failed:', error);
      return null;
    }
  }

  /**
   * Check if IP is local/private
   */
  private isLocalIP(ip: string): boolean {
    if (ip === 'unknown' || ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
      return true;
    }

    // Check private IP ranges
    const parts = ip.split('.');
    if (parts.length === 4) {
      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      
      // 10.0.0.0 - 10.255.255.255
      if (first === 10) return true;
      
      // 172.16.0.0 - 172.31.255.255
      if (first === 172 && second >= 16 && second <= 31) return true;
      
      // 192.168.0.0 - 192.168.255.255
      if (first === 192 && second === 168) return true;
    }

    return false;
  }

  /**
   * Get statistics on blocked countries
   */
  getStatistics(): {
    totalCached: number;
    countryCounts: Record<string, number>;
    blockedCountries: string[];
    mode: string;
  } {
    const countryCounts: Record<string, number> = {};

    const cacheValues = Array.from(this.geoCache.values());
    for (let i = 0; i < cacheValues.length; i++) {
      const { location } = cacheValues[i];
      const code = location.countryCode;
      countryCounts[code] = (countryCounts[code] || 0) + 1;
    }

    return {
      totalCached: this.geoCache.size,
      countryCounts,
      blockedCountries: this.config.countries,
      mode: this.config.mode,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.geoCache.clear();
    console.log('[GeoBlocking] Cache cleared');
  }
}

export const geoBlocking = GeoBlockingService.getInstance();

// Example country lists for different security postures

export const HIGH_RISK_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'SY', // Syria
  // Add more as needed
];

export const COMMON_BLOCKED_COUNTRIES = [
  'CN', // China (high bot traffic)
  'RU', // Russia
  'KP', // North Korea
  'IR', // Iran
];

export const GDPR_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB',
];

