// ErrorHandler.test.ts
import { describe, expect, it, jest } from '@jest/globals';

describe('ErrorHandler class', () => {

    it('should create error with message', async () => {
        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const error = new ErrorHandler(
            400,
            'Bad Request'
        );

        expect(error.message).toBe('Bad Request');
    });

    it('should set statusCode correctly', async () => {
        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const error = new ErrorHandler(
            404,
            'Not Found'
        );

        expect(error.statusCode).toBe(404);
    });

    it('should extend native Error class', async () => {
        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const error = new ErrorHandler(
            500,
            'Server Error'
        );

        expect(error instanceof Error).toBe(true);
    });

    it('should call Error.captureStackTrace', async () => {
        const captureSpy = jest.spyOn(Error, 'captureStackTrace');

        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        new ErrorHandler(
            500,
            'Stack Error'
        );

        expect(captureSpy).toHaveBeenCalled();

        captureSpy.mockRestore();
    });

    it('should preserve stack trace', async () => {
        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const error = new ErrorHandler(
            500,
            'Stack Trace Test'
        );

        expect(error.stack).toBeDefined();
    });
});