// isAuth.test.ts

import { jest, describe, beforeEach, expect, it } from '@jest/globals';

const mockVerify = jest.fn<any>();
const mockSql = jest.fn<any>();

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        verify: mockVerify,
    },
}));

jest.unstable_mockModule('../../src/utils/db.js', () => ({
    sql: mockSql,
}));

describe('isAuth middleware', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        process.env.JWT_SECRET_KEY = 'secret';
    });

    it('should return unauthorized when header is missing', async () => {
        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {},
        };

        const res: any = {
            status,
        };

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Unauthorized header',
        });

        expect(next).not.toHaveBeenCalled();
    });

    it('should return unauthorized when header does not start with Bearer', async () => {
        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {
                authorization: 'Token abc',
            },
        };

        const res: any = {
            status,
        };

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Unauthorized header',
        });
    });

    it('should return invalid token when decoded id is missing', async () => {
        mockVerify.mockReturnValue({});

        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {
            status,
        };

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(mockVerify).toHaveBeenCalledWith(
            'token',
            'secret'
        );

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Invalid token',
        });

        expect(next).not.toHaveBeenCalled();
    });

    it('should return user no longer exists when user is not found', async () => {
        mockVerify.mockReturnValue({
            id: 1,
        });

        mockSql.mockResolvedValue([]);

        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {
            status,
        };

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message:
                'User with this token no longer exists.',
        });

        expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate user successfully', async () => {
        mockVerify.mockReturnValue({
            id: 1,
        });

        mockSql.mockResolvedValue([
            {
                user_id: 1,
                name: 'John',
                email: 'john@test.com',
                phone_number: '9999999999',
                role: 'jobseeker',
                bio: 'Developer',
                resume: 'resume.pdf',
                resume_public_id: 'public-id',
                profile_pic: null,
                profile_pic_public_id: null,
                subscription: null,
                skills: ['Node.js'],
            },
        ]);

        const { isAuth } =
            await import('../middleware/auth.js');

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {};

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(req.user).toEqual({
            user_id: 1,
            name: 'John',
            email: 'john@test.com',
            phone_number: '9999999999',
            role: 'jobseeker',
            bio: 'Developer',
            resume: 'resume.pdf',
            resume_public_id: 'public-id',
            profile_pic: null,
            profile_pic_public_id: null,
            subscription: null,
            skills: ['Node.js'],
        });

        expect(next).toHaveBeenCalled();
    });

    it('should assign empty array when skills are null', async () => {
        mockVerify.mockReturnValue({
            id: 1,
        });

        mockSql.mockResolvedValue([
            {
                user_id: 1,
                skills: null,
            },
        ]);

        const { isAuth } =
            await import('../middleware/auth.js');

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {};

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(req.user.skills).toEqual([]);
    });

    it('should handle jwt verification failure', async () => {
        mockVerify.mockImplementation(() => {
            throw new Error('JWT failed');
        });

        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {
            status,
        };

        const next = jest.fn();

        await isAuth(req, res, next);

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Authentication  failed. Login again',
        });

        expect(next).not.toHaveBeenCalled();
    });

    it('should handle database failure', async () => {
        mockVerify.mockReturnValue({
            id: 1,
        });

        mockSql.mockRejectedValue(
            new Error('DB failed')
        );

        const { isAuth } =
            await import('../middleware/auth.js');

        const json = jest.fn();

        const status = jest.fn(() => ({
            json,
        }));

        const req: any = {
            headers: {
                authorization: 'Bearer token',
            },
        };

        const res: any = {
            status,
        };

        await isAuth(
            req,
            res,
            jest.fn()
        );

        expect(status as any).toHaveBeenCalledWith(401);

        expect(json).toHaveBeenCalledWith({
            message: 'Authentication  failed. Login again',
        });
    });
});