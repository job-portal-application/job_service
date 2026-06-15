// uploadFile.test.ts
import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockMiddleware = jest.fn<() => any>();

const mockSingle = jest.fn(() => mockMiddleware);

const mockMemoryStorage = jest.fn(() => 'mock-storage');

const mockMulter = jest.fn(() => ({
    single: mockSingle,
}));

(mockMulter as any).memoryStorage = mockMemoryStorage;

jest.unstable_mockModule('multer', () => ({
    default: mockMulter,
}));

describe('uploadFile middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should create multer memory storage', async () => {
        await import('../middleware/multer.js');

        expect(mockMemoryStorage).toHaveBeenCalled();
    });

    it('should initialize multer with storage', async () => {
        await import('../middleware/multer.js');

        expect(mockMulter as any).toHaveBeenCalledWith({
            storage: 'mock-storage',
        });
    });

    it('should create single file upload middleware for resume field', async () => {
        await import('../middleware/multer.js');

        expect(mockSingle as any).toHaveBeenCalledWith('file');
    });

    it('should export upload middleware', async () => {
        const module = await import('../middleware/multer.js');

        expect(module.default).toBeDefined();
    });
});