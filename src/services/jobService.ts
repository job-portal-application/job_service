import type { AuthenticatedRequest } from "../middleware/auth.js";
import { applicationStatusUpdateTemplate } from "../template/template.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { publishToTopic } from "../utils/producer.js";
import { tryCatch } from "../utils/tryCatch.js";


export const createJobs = tryCatch(async(req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    if(!user) {
        throw new ErrorHandler(401, 'User not authenticated');
    }
    if(user.role !== 'recruiter') {
        throw new ErrorHandler(403, 'Forbidden: Only recruiters can create jobs');
    }
    const { title, description, salary, location, role, job_type, work_location, company_id, openings } = req.body;
    if(!title || !description || !salary || !location || !role || !openings) {
        throw new ErrorHandler(400, 'Missing required fields');
    }
    const [company] = await sql `
        SELECT company_id FROM companies WHERE company_id = ${company_id} AND recruiter_id = ${user.user_id}
    `;
    if(!company) {
        throw new ErrorHandler(404, 'Company not found or you are not the owner');
    }
    const [newJob] = await sql `
        INSERT INTO jobs (title, description, salary, location, role, job_type, work_location, company_id, posted_by_recruiter_id, openings)
        VALUES (${title}, ${description}, ${salary}, ${location}, ${role}, ${job_type}, ${work_location}, ${company_id}, ${user.user_id}, ${openings})
        RETURNING *
    `;
    res.json({
        message: 'Job posted successfully',
        newJob
    });
});


export const updateJobs = tryCatch(async(req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    if(!user) {
        throw new ErrorHandler(401, 'User not authenticated');
    }
    if(user.role !== 'recruiter') {
        throw new ErrorHandler(403, 'Forbidden: Only recruiters can create jobs');
    }
    const { title, description, salary, location, role, job_type, work_location, company_id, openings, is_active } = req.body;
    const [existingJob] = await sql `
        SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${req.params.jobId}
    `;
    if(!existingJob) {
        throw new ErrorHandler(404, 'Job not found');
    }
    if(existingJob.posted_by_recruiter_id !== user.user_id) {
        throw new ErrorHandler(403, 'Forbidden: You are not allowed to update jobs');
    }
    const [updatedJob] = await sql `
        UPDATE jobs SET title = ${title}, description = ${description}, salary = ${salary}, location = ${location}, role = ${role}, job_type = ${job_type}, 
        work_location = ${work_location}, openings = ${openings}, is_active = ${is_active}
        WHERE job_id = ${req.params.jobId}
        RETURNING *
    `;
    res.json({
        message: 'Job updated successfully',
        updatedJob
    });
});


export const getAllActiveJobs = tryCatch(async(req: any, res: any, next: any) => {
    const { title, location } = req.query as {
        title?: string;
        location?: string;
    };
    let queryString = `
        SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at,
        c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        WHERE j.is_active = true
    `;
    const values = [];
    let paramIndex = 1;
    if(title) {
        queryString += ` AND j.title ILIKE $${paramIndex}`;
        values.push(`%${title}%`);
        paramIndex++;
    }
    if(location) {
        queryString += ` AND j.location ILIKE $${paramIndex}`;
        values.push(`%${location}%`);
        paramIndex++;
    }
    queryString += ` ORDER BY j.created_at DESC;`;
    const jobs = await sql.query(queryString, values) as any[];
    res.json({
        message: 'Active jobs retrieved successfully',
        jobs
    });
});


export const getSingleJobs = tryCatch(async(req: any, res: any, next: any) => {
    const { jobId } = req.params;
    const [job] = await sql `
        SELECT * FROM jobs WHERE job_id = ${jobId}
    `;
    res.json({job});
});


export const getAllApplicationsForJobs = tryCatch(async(req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    if(!user) {
        throw new ErrorHandler(401, 'User not authenticated');
    }
    if(user.role !== 'recruiter') {
        throw new ErrorHandler(403, 'Forbidden: Only recruiters can view applications');
    }
    const { jobId } = req.params;
    const [job] = await sql `
        SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${jobId}
    `;
    if(!job) {
        throw new ErrorHandler(404, 'Job not found');
    }
    if(job.posted_by_recruiter_id !== user.user_id) {
        throw new ErrorHandler(403, 'Forbidden: You are not allowed to view applications for this job');
    }
    const applications = await sql `
        SELECT * FROM applications WHERE job_id = ${jobId} ORDER BY subscribed DESC, applied_at ASC;
    `;
    res.json({
        message: 'Applications retrieved successfully',
        applications
    });
});


export const updateApplications = tryCatch(async(req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    if(!user) {
        throw new ErrorHandler(401, 'User not authenticated');
    }
    if(user.role !== 'recruiter') {
        throw new ErrorHandler(403, 'Forbidden: Only recruiters can update application status');
    }
    const { id } = req.params;
    const [application] = await sql `
        SELECT * FROM applications WHERE application_id = ${id};
    `;
    if(!application) {
        throw new ErrorHandler(404, 'Application not found');
    }
    const [job] = await sql `
        SELECT posted_by_recruiter_id, title FROM jobs WHERE job_id = ${application.job_id}
    `;
    if(!job) {
        throw new ErrorHandler(404, 'Associated job not found');
    }
    if(job.posted_by_recruiter_id !== user.user_id) {
        throw new ErrorHandler(403, 'Forbidden: You are not allowed to update applications for this job');
    }
    const [updatedApplication] = await sql `
        UPDATE applications SET status = ${req.body.status} WHERE application_id = ${id} RETURNING *;
    `;
    const message = {
        to: application.applicant_email,
        subject: "Update on your application for " + job.title,
        html: applicationStatusUpdateTemplate(job.title)
    }
    publishToTopic("send-mail", message).catch((error) => {
        console.log("Failed to publish message to topic:", error);
    });
    res.json({
        message: 'Application updated successfully',
        job,
        application: updatedApplication
    });
});