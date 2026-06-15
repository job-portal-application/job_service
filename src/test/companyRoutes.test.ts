import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'http';

const isAuthMock = jest.fn<any>((req: Request, res: Response, next: NextFunction) => next());
const uploadFileMock = jest.fn<any>((req: Request, res: Response, next: NextFunction) => next());
const createCompaniesMock = jest.fn<any>((req: Request, res: Response) => res.status(201).json({ success: true }));
const deleteCompaniesMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const getAllCompaniesMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const getCompanyDetailsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));

jest.unstable_mockModule('../middleware/auth.js', () => ({ isAuth: isAuthMock }));
jest.unstable_mockModule('../middleware/multer.js', () => ({ default: uploadFileMock }));
jest.unstable_mockModule('../controllers/companyController.js', () => ({
    createCompanies: createCompaniesMock,
    deleteCompanies: deleteCompaniesMock,
    getAllCompanies: getAllCompaniesMock,
    getCompanyDetails: getCompanyDetailsMock,
}));

const { default: companyRouter } = await import('../routes/companyRoutes.js');

const app = express();
app.use(express.json());
app.use('/api', companyRouter);

const server = http.createServer(app);
await new Promise<void>(resolve => server.listen(0, resolve));
const port = (server.address() as any).port;

const request = (method: string, path: string): Promise<{ status: number }> =>
    new Promise((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port, method, path }, res => {
            res.resume();
            res.on('end', () => resolve({ status: res.statusCode! }));
        });
        req.on('error', reject);
        req.end();
    });

afterAll(() => { server.close(); });

describe('companyRoutes', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('POST /api/create-company calls isAuth, uploadFile, createCompanies', async () => {
        const res = await request('POST', '/api/create-company');
        expect(isAuthMock).toHaveBeenCalled();
        expect(uploadFileMock).toHaveBeenCalled();
        expect(createCompaniesMock).toHaveBeenCalled();
        expect(res.status).toBe(201);
    });

    it('GET /api/get-all-companies calls isAuth, getAllCompanies', async () => {
        const res = await request('GET', '/api/get-all-companies');
        expect(isAuthMock).toHaveBeenCalled();
        expect(getAllCompaniesMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('DELETE /api/delete-company/:companyId calls isAuth, deleteCompanies', async () => {
        const res = await request('DELETE', '/api/delete-company/123');
        expect(isAuthMock).toHaveBeenCalled();
        expect(deleteCompaniesMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('GET /api/get-company-details/:id calls isAuth, getCompanyDetails', async () => {
        const res = await request('GET', '/api/get-company-details/456');
        expect(isAuthMock).toHaveBeenCalled();
        expect(getCompanyDetailsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });
});
