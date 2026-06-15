import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Response, NextFunction } from 'express';

const mockSql = Object.assign(jest.fn<any>(), {
    query: jest.fn<any>(),
});
const mockPublishToTopic = jest.fn<any>();
const mockTemplate = jest.fn<any>(() => '<html/>');

jest.unstable_mockModule('../utils/db.js', () => ({ sql: mockSql }));
jest.unstable_mockModule('../utils/producer.js', () => ({ publishToTopic: mockPublishToTopic }));
jest.unstable_mockModule('../template/template.js', () => ({ applicationStatusUpdateTemplate: mockTemplate }));

const { createJobs, updateJobs, getAllActiveJobs, getSingleJobs, getAllApplicationsForJobs, updateApplications } =
    await import('../services/jobService.js');

const mockRes = () => {
    const res: Partial<Response> = {};
    res.json = jest.fn().mockReturnValue(res) as unknown as Response['json'];
    res.status = jest.fn().mockReturnValue(res) as unknown as Response['status'];
    return res as Response;
};

const mockNext: NextFunction = jest.fn();
const recruiter = { user_id: 1, role: 'recruiter' };
const jobseeker = { user_id: 2, role: 'jobseeker' };

const invoke = (handler: any, req: Partial<AuthenticatedRequest>, res: Response) =>
    handler(req as AuthenticatedRequest, res, mockNext);

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── createJobs ───────────────────────────────────────────────────────────────
describe('createJobs', () => {
    const baseBody = { title: 'Dev', description: 'Desc', salary: 100, location: 'NY', role: 'eng', job_type: 'full', work_location: 'remote', company_id: 5, openings: 2 };
    const baseReq = (): Partial<AuthenticatedRequest> => ({ user: recruiter as any, body: baseBody });

    it('returns 401 when user is missing', async () => {
        const res = mockRes();
        await invoke(createJobs, { body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not a recruiter', async () => {
        const res = mockRes();
        await invoke(createJobs, { user: jobseeker as any, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = mockRes();
        await invoke(createJobs, { user: recruiter as any, body: { title: 'Dev' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when company not found or not owned', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(createJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('creates job successfully', async () => {
        const res = mockRes();
        const newJob = { job_id: 1, title: 'Dev' };
        mockSql.mockResolvedValueOnce([{ company_id: 5 }]).mockResolvedValueOnce([newJob]);
        await invoke(createJobs, baseReq(), res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Job posted successfully', newJob });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(createJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── updateJobs ───────────────────────────────────────────────────────────────
describe('updateJobs', () => {
    const baseBody = { title: 'Dev', description: 'D', salary: 100, location: 'NY', role: 'eng', job_type: 'full', work_location: 'remote', company_id: 5, openings: 2, is_active: true };
    const baseReq = (): Partial<AuthenticatedRequest> => ({ user: recruiter as any, body: baseBody, params: { jobId: '10' } });

    it('returns 401 when user is missing', async () => {
        const res = mockRes();
        await invoke(updateJobs, { body: {}, params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not a recruiter', async () => {
        const res = mockRes();
        await invoke(updateJobs, { user: jobseeker as any, body: {}, params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 404 when job not found', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(updateJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when recruiter does not own the job', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([{ posted_by_recruiter_id: 99 }]);
        await invoke(updateJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates job successfully', async () => {
        const res = mockRes();
        const updatedJob = { job_id: 10, title: 'Dev' };
        mockSql
            .mockResolvedValueOnce([{ posted_by_recruiter_id: recruiter.user_id }])
            .mockResolvedValueOnce([updatedJob]);
        await invoke(updateJobs, baseReq(), res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Job updated successfully', updatedJob });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(updateJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── getAllActiveJobs ─────────────────────────────────────────────────────────
describe('getAllActiveJobs', () => {
    it('returns all active jobs without filters', async () => {
        const res = mockRes();
        const jobs = [{ job_id: 1 }];
        mockSql.query.mockResolvedValueOnce(jobs);
        await invoke(getAllActiveJobs, { query: {} }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Active jobs retrieved successfully', jobs });
    });

    it('returns filtered jobs by title', async () => {
        const res = mockRes();
        const jobs = [{ job_id: 2 }];
        mockSql.query.mockResolvedValueOnce(jobs);
        await invoke(getAllActiveJobs, { query: { title: 'Dev' } }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Active jobs retrieved successfully', jobs });
    });

    it('returns filtered jobs by location', async () => {
        const res = mockRes();
        const jobs = [{ job_id: 3 }];
        mockSql.query.mockResolvedValueOnce(jobs);
        await invoke(getAllActiveJobs, { query: { location: 'NY' } }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Active jobs retrieved successfully', jobs });
    });

    it('returns filtered jobs by title and location', async () => {
        const res = mockRes();
        const jobs = [{ job_id: 4 }];
        mockSql.query.mockResolvedValueOnce(jobs);
        await invoke(getAllActiveJobs, { query: { title: 'Dev', location: 'NY' } }, res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Active jobs retrieved successfully', jobs });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.query.mockRejectedValueOnce(new Error('DB error'));
        await invoke(getAllActiveJobs, { query: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── getSingleJobs ────────────────────────────────────────────────────────────
describe('getSingleJobs', () => {
    it('returns a single job', async () => {
        const res = mockRes();
        const job = { job_id: 1, title: 'Dev' };
        mockSql.mockResolvedValueOnce([job]);
        await invoke(getSingleJobs, { params: { jobId: '1' } }, res);
        expect(res.json).toHaveBeenCalledWith({ job });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(getSingleJobs, { params: { jobId: '1' } }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── getAllApplicationsForJobs ────────────────────────────────────────────────
describe('getAllApplicationsForJobs', () => {
    const baseReq = (): Partial<AuthenticatedRequest> => ({ user: recruiter as any, params: { jobId: '10' } });

    it('returns 401 when user is missing', async () => {
        const res = mockRes();
        await invoke(getAllApplicationsForJobs, { params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not a recruiter', async () => {
        const res = mockRes();
        await invoke(getAllApplicationsForJobs, { user: jobseeker as any, params: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 404 when job not found', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(getAllApplicationsForJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when recruiter does not own the job', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([{ posted_by_recruiter_id: 99 }]);
        await invoke(getAllApplicationsForJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns applications successfully', async () => {
        const res = mockRes();
        const applications = [{ application_id: 1 }];
        mockSql
            .mockResolvedValueOnce([{ posted_by_recruiter_id: recruiter.user_id }])
            .mockResolvedValueOnce(applications);
        await invoke(getAllApplicationsForJobs, baseReq(), res);
        expect(res.json).toHaveBeenCalledWith({ message: 'Applications retrieved successfully', applications });
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(getAllApplicationsForJobs, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── updateApplications ───────────────────────────────────────────────────────
describe('updateApplications', () => {
    const baseReq = (): Partial<AuthenticatedRequest> => ({
        user: recruiter as any,
        params: { id: '5' },
        body: { status: 'accepted' },
    });

    it('returns 401 when user is missing', async () => {
        const res = mockRes();
        await invoke(updateApplications, { params: {}, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 when user is not a recruiter', async () => {
        const res = mockRes();
        await invoke(updateApplications, { user: jobseeker as any, params: {}, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 404 when application not found', async () => {
        const res = mockRes();
        mockSql.mockResolvedValueOnce([]);
        await invoke(updateApplications, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 404 when associated job not found', async () => {
        const res = mockRes();
        mockSql
            .mockResolvedValueOnce([{ application_id: 5, job_id: 10, applicant_email: 'a@b.com' }])
            .mockResolvedValueOnce([]);
        await invoke(updateApplications, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when recruiter does not own the job', async () => {
        const res = mockRes();
        mockSql
            .mockResolvedValueOnce([{ application_id: 5, job_id: 10, applicant_email: 'a@b.com' }])
            .mockResolvedValueOnce([{ posted_by_recruiter_id: 99, title: 'Dev' }]);
        await invoke(updateApplications, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates application and publishes email successfully', async () => {
        const res = mockRes();
        const application = { application_id: 5, job_id: 10, applicant_email: 'a@b.com' };
        const job = { posted_by_recruiter_id: recruiter.user_id, title: 'Dev' };
        const updatedApplication = { ...application, status: 'accepted' };
        mockSql
            .mockResolvedValueOnce([application])
            .mockResolvedValueOnce([job])
            .mockResolvedValueOnce([updatedApplication]);
        mockPublishToTopic.mockResolvedValueOnce(undefined);

        await invoke(updateApplications, baseReq(), res);
        expect(mockPublishToTopic).toHaveBeenCalledWith('send-mail', expect.objectContaining({ to: 'a@b.com' }));
        expect(res.json).toHaveBeenCalledWith({ message: 'Application updated successfully', job, application: updatedApplication });
    });

    it('logs error when publishToTopic fails but still responds', async () => {
        const res = mockRes();
        const application = { application_id: 5, job_id: 10, applicant_email: 'a@b.com' };
        const job = { posted_by_recruiter_id: recruiter.user_id, title: 'Dev' };
        const updatedApplication = { ...application, status: 'accepted' };
        mockSql
            .mockResolvedValueOnce([application])
            .mockResolvedValueOnce([job])
            .mockResolvedValueOnce([updatedApplication]);
        mockPublishToTopic.mockRejectedValueOnce(new Error('Kafka down'));
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await invoke(updateApplications, baseReq(), res);
        // allow microtask queue to flush the catch
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(consoleSpy).toHaveBeenCalledWith('Failed to publish message to topic:', expect.any(Error));
        expect(res.json).toHaveBeenCalledWith({ message: 'Application updated successfully', job, application: updatedApplication });
        consoleSpy.mockRestore();
    });

    it('handles unexpected errors', async () => {
        const res = mockRes();
        mockSql.mockRejectedValueOnce(new Error('DB error'));
        await invoke(updateApplications, baseReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
