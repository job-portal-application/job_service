import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'http';

const isAuthMock = jest.fn<any>((req: Request, res: Response, next: NextFunction) => next());
const createJobsMock = jest.fn<any>((req: Request, res: Response) => res.status(201).json({ success: true }));
const updateJobsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const getAllActiveJobsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const getSingleJobsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const getAllApplicationsForJobsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));
const updateApplicationsMock = jest.fn<any>((req: Request, res: Response) => res.status(200).json({ success: true }));

jest.unstable_mockModule('../middleware/auth.js', () => ({ isAuth: isAuthMock }));
jest.unstable_mockModule('../controllers/jobController.js', () => ({
    createJobs: createJobsMock,
    updateJobs: updateJobsMock,
    getAllActiveJobs: getAllActiveJobsMock,
    getSingleJobs: getSingleJobsMock,
    getAllApplicationsForJobs: getAllApplicationsForJobsMock,
    updateApplications: updateApplicationsMock,
}));

const { default: jobRouter } = await import('../routes/jobRoutes.js');

const app = express();
app.use(express.json());
app.use('/api', jobRouter);

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

describe('jobRoutes', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('POST /api/create-job calls isAuth, createJobs', async () => {
        const res = await request('POST', '/api/create-job');
        expect(isAuthMock).toHaveBeenCalled();
        expect(createJobsMock).toHaveBeenCalled();
        expect(res.status).toBe(201);
    });

    it('PUT /api/update-job/:jobId calls isAuth, updateJobs', async () => {
        const res = await request('PUT', '/api/update-job/123');
        expect(isAuthMock).toHaveBeenCalled();
        expect(updateJobsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('GET /api/active-jobs calls getAllActiveJobs', async () => {
        const res = await request('GET', '/api/active-jobs');
        expect(getAllActiveJobsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('GET /api/job/:jobId calls getSingleJobs', async () => {
        const res = await request('GET', '/api/job/456');
        expect(getSingleJobsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('GET /api/job/applications/:jobId calls isAuth, getAllApplicationsForJobs', async () => {
        const res = await request('GET', '/api/job/applications/789');
        expect(isAuthMock).toHaveBeenCalled();
        expect(getAllApplicationsForJobsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('PUT /api/application/update/:id calls isAuth, updateApplications', async () => {
        const res = await request('PUT', '/api/application/update/1');
        expect(isAuthMock).toHaveBeenCalled();
        expect(updateApplicationsMock).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });
});
