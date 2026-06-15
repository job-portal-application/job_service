import { jest, describe, beforeEach, afterEach, expect, it } from '@jest/globals';

const mockSql = jest.fn<() => Promise<any>>();

jest.unstable_mockModule('../utils/db.js', () => ({
    sql: mockSql,
}));

const { initDB } = await import('../config/connect.js');

describe('initDB', () => {
    let consoleLogSpy: ReturnType<typeof jest.spyOn>;
    let processExitSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    it('should initialize the database successfully', async () => {
        mockSql.mockResolvedValue([]);

        await initDB();

        expect(mockSql).toHaveBeenCalledTimes(4);
        expect(consoleLogSpy).toHaveBeenCalledWith('Database initialized successfully');
    });

    it('should log error and call process.exit(1) when sql throws', async () => {
        const error = new Error('DB connection failed');
        mockSql.mockRejectedValue(error);

        await initDB();

        expect(consoleLogSpy).toHaveBeenCalledWith(`Error initializing database: ${error}`);
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
