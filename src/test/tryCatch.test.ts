// tryCatch.test.ts
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

describe('tryCatch utility', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('should execute controller successfully', async () => {
        const { tryCatch } = await import('../utils/tryCatch.js');

        const controller = jest.fn(async (_req, _res, _next) => {
            return 'success';
        });

        const middleware = tryCatch(controller);

        const req: any = {};
        const json = jest.fn();
        const status = jest.fn(() => ({ json }));
        const res: any = { status };
        const next = jest.fn();

        await middleware(req, res, next);

        expect(controller).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    it('should handle ErrorHandler errors', async () => {
        const { tryCatch } = await import('../utils/tryCatch.js');

        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const controller = jest.fn(async () => {
            throw new ErrorHandler(
                400,
                'Bad Request'
            );
        });

        const middleware = tryCatch(controller);

        const req: any = {};

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const res: any = {
            status,
        };

        const next = jest.fn();

        await middleware(req, res, next);

        expect(status as any).toHaveBeenCalledWith(400);

        expect(json).toHaveBeenCalledWith({
            message: 'Bad Request',
        });
    });

    it('should handle generic errors', async () => {
        const { tryCatch } = await import('../utils/tryCatch.js');

        const controller = jest.fn(async () => {
            throw new Error('Internal Server Error');
        });

        const middleware = tryCatch(controller);

        const req: any = {};

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const res: any = {
            status,
        };

        const next = jest.fn();

        await middleware(req, res, next);

        expect(status as any).toHaveBeenCalledWith(500);

        expect(json).toHaveBeenCalledWith({
            message: 'Internal Server Error',
        });
    });

    it('should return response for ErrorHandler', async () => {
        const { tryCatch } = await import('../utils/tryCatch.js');

        const { default: ErrorHandler } = await import('../utils/errorHandler.js');

        const controller = jest.fn(async () => {
            throw new ErrorHandler(
                401,
                'Unauthorized'
            );
        });


        const middleware = tryCatch(controller);

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const res: any = {
            status,
        };

        await middleware(
            {} as any,
            res,
            jest.fn()
        );

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Unauthorized',
        });
    });
});