import type { AuthenticatedRequest } from "../middleware/auth.js";
import getBuffer from "../utils/buffer.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { tryCatch } from "../utils/tryCatch.js";
import axios from 'axios';

export const createCompanies = tryCatch(async (req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    if(!user) {
        throw new ErrorHandler(401, 'User not authenticated');
    }
    if(user.role !== 'recruiter') {
        throw new ErrorHandler(403, 'Only recruiters can create companies');
    }
    const { name, description, website } = req.body;
    if(!name || !description || !website) {
        throw new ErrorHandler(400, 'All fields are required');
    }
    const isCompanyExists = await sql `
        SELECT company_id FROM companies WHERE name = ${name}
    `;
    if(isCompanyExists.length > 0) {
        throw new ErrorHandler(409, `Company with this name ${name} already exists`);
    }
    const file = req.file;
    if(!file) {
        throw new ErrorHandler(400, 'Company logo is required');
    }
    const fileBuffer = getBuffer(file);
    if(!fileBuffer || !fileBuffer.content) {
        throw new ErrorHandler(400, "Failed to generate buffer");
    }
    const { data } = await axios.post(`${process.env.UPLOAD_SERVICE_URL}/api/v1/misc/upload`, {
        buffer: fileBuffer.content,
    }, {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });
    const [newCompany] = await sql `
        INSERT INTO companies (name, description, website, logo, logo_public_id, recruiter_id) 
        VALUES (${name}, ${description}, ${website}, ${data.url}, ${data.public_id}, ${req.user?.user_id}) 
        RETURNING *
    `;
    res.json({
        message: 'Company created successfully',
        newCompany
    });
});


export const deleteCompanies = tryCatch(async (req: AuthenticatedRequest, res, next) => {
    const user = req.user;
    const { companyId } = req.params;
    const [company] = await sql `
        SELECT logo_public_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}
    `;
    if(!company) {
        throw new ErrorHandler(404, 'Company not found or you are not the owner');
    }
    await sql `DELETE FROM companies WHERE company_id = ${companyId}`;
    res.json({
        message: 'Company and its related jobs have been deleted successfully'
    });
});


export const getAllCompanies = tryCatch(async(req: AuthenticatedRequest, res: any, next: any) => {
    const user = req.user;
    const companies = await sql `
        SELECT * FROM companies WHERE recruiter_id = ${user?.user_id}
    `;
    res.json({
        message: 'Companies retrieved successfully',
        companies
    });
});


export const getCompanyDetails = tryCatch(async(req: AuthenticatedRequest, res: any, next: any) => {
    const { id } = req.params;
    if(!id) {
        throw new ErrorHandler(400, 'Company ID is required');
    }
    const [companyData] = await sql `
        SELECT c.*, COALESCE (
            (
                SELECT json_agg(j.*) FROM jobs j WHERE j.company_id = c.company_id
            ),
            '[]'::json
        ) AS jobs
        FROM companies c WHERE c.company_id = ${id} GROUP BY c.company_id
    `;
    if(!companyData) {
        throw new ErrorHandler(404, 'Company not found');
    }
    res.json({
        message: 'Company details retrieved successfully',
        companyData
    });
});