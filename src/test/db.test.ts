// db.test.ts
import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockNeonInstance = jest.fn<() => any>();

const mockNeon = jest.fn(() => mockNeonInstance);

const mockConfig = jest.fn();

jest.unstable_mockModule('@neondatabase/serverless', () => ({
    neon: mockNeon,
}));

jest.unstable_mockModule('dotenv', () => ({
    default: {
        config: mockConfig,
    },
}));

describe('db config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should call dotenv config', async () => {
        process.env.DB_URL = 'postgres://localhost:5432/db';

        await import('../utils/db.js');

        expect(mockConfig).toHaveBeenCalled();
    });

    it('should initialize neon with DB_URL', async () => {
        process.env.DB_URL = 'postgres://localhost:5432/db';

        await import('../utils/db.js');

        expect(mockNeon as any).toHaveBeenCalledWith(
            'postgres://localhost:5432/db'
        );
    });

    it('should export sql instance', async () => {
        process.env.DB_URL = 'postgres://localhost:5432/db';

        const module = await import('../utils/db.js');

        expect(module.sql).toBeDefined();

        expect(module.sql).toBe(mockNeonInstance);
    });
});