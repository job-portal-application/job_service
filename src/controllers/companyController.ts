import { createCompanies as createCompany, deleteCompanies as deleteCompany, getAllCompanies as getAllCompany, getCompanyDetails as getCompanyDetail } from '../services/companyService.js'

export const createCompanies = async (req: any, res: any, next: any) => {
    createCompany(req, res, next);
}

export const deleteCompanies = async (req: any, res: any, next: any) => {
    deleteCompany(req, res, next);
}

export const getAllCompanies = async (req: any, res: any, next: any) => {
    getAllCompany(req, res, next);
}

export const getCompanyDetails = async (req: any, res: any, next: any) => {
    getCompanyDetail(req, res, next);
}