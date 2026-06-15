import { jest, describe, beforeEach, expect, it } from '@jest/globals';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Response, NextFunction } from 'express';

const mockSql = jest.fn<any>();
const mockGetBuffer = jest.fn<any>();
const mockAxiosPost = jest.fn<any>();

jest.unstable_mockModule('../utils/db.js', () => ({ sql: mockSql }));
jest.unstable_mockModule('../utils/buffer.js', () => ({ default: mockGetBuffer }));
jest.unstable_mockModule('axios', () => ({ default: { post: mockAxiosPost } }));

const { createCompanies, deleteCompanies, getAllCompanies, getCompanyDetails } =
    await import('../services/companyService.js');

const mockRes = () => {
    const res: Partial<Response> = {};
    res.json = jest.fn().mockReturnValue(res) as unknown as Response['json'];
    res.status = jest.fn().mockReturnValue(res) as unknown as Response['status'];
    return res as Response;
};

const mockNext: NextFunction = jest.fn();

const recruiterUser = { user_id: 1, role: 'recruiter' };
const jobseekerUser = { user_id: 2, role: 'jobseeker' };

const invoke = (handler: any, req: Partial<AuthenticatedRequest>, res: Response) =>
    handler(req as AuthenticatedRequest, res, mockNext);

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── createCompanies ──────────────────────────────────────────────────────────
describe('createCompanies', () => {
    const baseReq = (): Partial<AuthenticatedRequest> => ({
        user: recruiterUser as any,
        body: { name: 'Acme', description: 'Desc', website: 'https://acme.com' },
        file: { originalname: 'logo.png', buffer: Buffer.from('img') } as any,
    });

    it('returns 401 when user is not authenticated', async () => {
        const res = mockRes();
        await invoke(createCompanies, { body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not a recruiter', async () => {
        const res = mockRes();
        await invoke(createCompanies, { user: jobseekerUser as any, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = mockRes();
        await invoke(createCompanies, { user: recruiterUser as any, body: { name: 'Acme' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 409 when company name already exists', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([{ company_id: 99 }]);
        await invoke(createCompanies, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('returns 400 when file is missing', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        const req = baseReq();
        req.file = undefined;
        await invoke(createCompanies, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when buffer generation fails', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        mockGetBuffer.mockReturnValueOnce(null);
        await invoke(createCompanies, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when buffer content is falsy', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        mockGetBuffer.mockReturnValueOnce({ content: null });
        await invoke(createCompanies, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates company successfully', async () => {
        const res = mockRes();
        const newCompany = { company_id: 1, name: 'Acme' };
        mockSql
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([newCompany]);
        mockGetBuffer.mockReturnValueOnce({ content: 'data:image/png;base64,abc' });
        mockAxiosPost.mockResolvedValueOnce({ data: { url: 'http://img.url', public_id: 'pub_123' } });

        await invoke(createCompanies, baseReq(), res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Company created successfully', newCompany });
    });

    it('handles unexpected errors (non-ErrorHandler)', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB down'));
        await invoke(createCompanies, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── deleteCompanies ──────────────────────────────────────────────────────────
describe('deleteCompanies', () => {
    const req = (): Partial<AuthenticatedRequest> => ({
        user: recruiterUser as any,
        params: { companyId: '10' },
    });

    it('returns 404 when company not found or not owned', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(deleteCompanies, req(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deletes company successfully', async () => {
        const res = mockRes();
        mockSql
            .mockResolvedValueOnce([{ logo_public_id: 'pub_1' }])
            .mockResolvedValueOnce([]);
        await invoke(deleteCompanies, req(), res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Company and its related jobs have been deleted successfully' });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(deleteCompanies, req(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── getAllCompanies ──────────────────────────────────────────────────────────
describe('getAllCompanies', () => {
    it('returns all companies for recruiter', async () => {
        const res = mockRes();
        const companies = [{ company_id: 1 }, { company_id: 2 }];
        mockSql.mockResolvedValueOnce(companies);
        await invoke(getAllCompanies, { user: recruiterUser as any }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Companies retrieved successfully', companies });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(getAllCompanies, { user: recruiterUser as any }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── getCompanyDetails ────────────────────────────────────────────────────────
describe('getCompanyDetails', () => {
    it('returns 400 when id is missing', async () => {
        const res = mockRes();
        await invoke(getCompanyDetails, { params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when company not found', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(getCompanyDetails, { params: { id: '99' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns company details successfully', async () => {
        const res = mockRes();
        const companyData = { company_id: 1, name: 'Acme', jobs: [] };
        mockSql.mockResolvedValueOnce([companyData]);
        await invoke(getCompanyDetails, { params: { id: '1' } }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Company details retrieved successfully', companyData });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(getCompanyDetails, { params: { id: '1' } }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
