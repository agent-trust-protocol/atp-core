import { DIDDocument, DIDRegistrationRequest, DIDRegistrationResponse, Service } from '../models/did.js';
import { StorageService } from './storage.js';
import { TrustLevel } from '@atp/shared';
export declare class IdentityService {
    private storage;
    constructor(storage: StorageService);
    registerDID(request?: DIDRegistrationRequest): Promise<DIDRegistrationResponse>;
    resolveDID(did: string): Promise<DIDDocument | null>;
    rotateKeys(did: string): Promise<DIDDocument | null>;
    addService(did: string, service: Service): Promise<DIDDocument | null>;
    listDIDs(): Promise<string[]>;
    updateTrustLevel(did: string, trustLevel: string): Promise<DIDDocument | null>;
    getTrustLevelInfo(did: string): Promise<{
        currentLevel: TrustLevel;
        capabilities: string[];
        nextLevel: TrustLevel | null;
        upgradeRequirements: string[];
    } | null>;
}
