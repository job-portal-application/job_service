import { createJobs as createJob, 
    updateJobs as updateJob, 
    getAllActiveJobs as getAllActiveJob, 
    getSingleJobs as getSingleJob, 
    getAllApplicationsForJobs as getAllApplicationsForJob,
    updateApplications as updateApplication
 } from '../services/jobService.js';

export const createJobs = async(req: any, res: any, next: any) => {
    createJob(req, res, next);
}

export const updateJobs = async(req: any, res: any, next: any) => {
    updateJob(req, res, next);
}

export const getAllActiveJobs = async(req: any, res: any, next: any) => {
    getAllActiveJob(req, res, next);
}

export const getSingleJobs = async(req: any, res: any, next: any) => {
    getSingleJob(req, res, next);
}

export const getAllApplicationsForJobs = async(req: any, res: any, next: any) => {
    getAllApplicationsForJob(req, res, next);
}

export const updateApplications = async(req: any, res: any, next: any) => {
    updateApplication(req, res, next);
}