import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockCreateJobs = jest.fn();
const mockUpdateJobs = jest.fn();
const mockGetAllActiveJobs = jest.fn();
const mockGetSingleJobs = jest.fn();
const mockGetAllApplicationsForJobs = jest.fn();
const mockUpdateApplications = jest.fn();

jest.unstable_mockModule('../services/jobService.js', () => ({
    createJobs: mockCreateJobs,
    updateJobs: mockUpdateJobs,
    getAllActiveJobs: mockGetAllActiveJobs,
    getSingleJobs: mockGetSingleJobs,
    getAllApplicationsForJobs: mockGetAllApplicationsForJobs,
    updateApplications: mockUpdateApplications,
}));

const { createJobs, updateJobs, getAllActiveJobs, getSingleJobs, getAllApplicationsForJobs, updateApplications } =
    await import('../controllers/jobController.js');

const req = {} as any;
const res = {} as any;
const next = jest.fn();

describe('jobController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createJobs calls createJob service', async () => {
        await createJobs(req, res, next);
        expect(mockCreateJobs).toHaveBeenCalledWith(req, res, next);
    });

    it('updateJobs calls updateJob service', async () => {
        await updateJobs(req, res, next);
        expect(mockUpdateJobs).toHaveBeenCalledWith(req, res, next);
    });

    it('getAllActiveJobs calls getAllActiveJob service', async () => {
        await getAllActiveJobs(req, res, next);
        expect(mockGetAllActiveJobs).toHaveBeenCalledWith(req, res, next);
    });

    it('getSingleJobs calls getSingleJob service', async () => {
        await getSingleJobs(req, res, next);
        expect(mockGetSingleJobs).toHaveBeenCalledWith(req, res, next);
    });

    it('getAllApplicationsForJobs calls getAllApplicationsForJob service', async () => {
        await getAllApplicationsForJobs(req, res, next);
        expect(mockGetAllApplicationsForJobs).toHaveBeenCalledWith(req, res, next);
    });

    it('updateApplications calls updateApplication service', async () => {
        await updateApplications(req, res, next);
        expect(mockUpdateApplications).toHaveBeenCalledWith(req, res, next);
    });
});
