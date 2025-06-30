import { SimpleAgent } from './agent.js';
export declare class WeatherAgent extends SimpleAgent {
    private weatherData;
    protected onReady(): void;
    private generateWeatherData;
    private handleWeatherRequest;
    requestWeatherPermission(targetAgentDid: string, city: string): Promise<void>;
    getAvailableLocations(): string[];
}
//# sourceMappingURL=weather-agent.d.ts.map