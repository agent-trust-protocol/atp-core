import { SimpleAgent } from './agent.js';
export class WeatherAgent extends SimpleAgent {
    constructor() {
        super(...arguments);
        this.weatherData = new Map();
    }
    onReady() {
        super.onReady();
        console.log('Weather Agent is ready to provide weather data!');
        // Subscribe to weather requests
        this.subscribe('weather-request', this.handleWeatherRequest.bind(this));
        // Start generating mock weather data
        this.generateWeatherData();
        setInterval(() => this.generateWeatherData(), 30000); // Update every 30 seconds
    }
    generateWeatherData() {
        const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Paris'];
        for (const city of cities) {
            const weather = {
                city,
                temperature: Math.round(Math.random() * 40 - 10), // -10 to 30°C
                humidity: Math.round(Math.random() * 100),
                conditions: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
                timestamp: new Date().toISOString(),
                source: this.getDID(),
            };
            this.weatherData.set(city.toLowerCase(), weather);
        }
        console.log(`Updated weather data for ${cities.length} cities`);
    }
    async handleWeatherRequest(request) {
        const { city, requesterDid } = request;
        console.log(`Weather request for ${city} from ${requesterDid}`);
        // Check if we have permission to share weather data
        try {
            const permissionCheck = await this.invoke('permission.check', {
                subject: this.getDID(),
                action: 'read',
                resource: `weather:${city}`,
            });
            if (!permissionCheck.result.data.allowed) {
                console.log('Permission denied for weather request');
                return;
            }
        }
        catch (error) {
            console.error('Permission check failed:', error);
            return;
        }
        const weather = this.weatherData.get(city.toLowerCase());
        if (weather) {
            // Create and issue a verifiable credential for the weather data
            try {
                const credential = await this.invoke('vc.issue', {
                    schemaId: 'weather-data-v1',
                    subject: requesterDid,
                    claims: weather,
                    issuerDid: this.getDID(),
                    issuerPrivateKey: this.privateKey,
                });
                console.log(`Issued weather credential for ${city}`);
            }
            catch (error) {
                console.error('Failed to issue weather credential:', error);
            }
        }
        else {
            console.log(`No weather data available for ${city}`);
        }
    }
    async requestWeatherPermission(targetAgentDid, city) {
        try {
            await this.invoke('permission.grant', {
                grantor: this.getDID(),
                grantee: targetAgentDid,
                scopes: ['read'],
                resource: `weather:${city}`,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            });
            console.log(`Granted weather permission for ${city} to ${targetAgentDid}`);
        }
        catch (error) {
            console.error('Failed to grant weather permission:', error);
        }
    }
    getAvailableLocations() {
        return Array.from(this.weatherData.keys());
    }
}
