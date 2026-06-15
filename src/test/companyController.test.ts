import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const createCompanyMock = jest.fn<any>();
const deleteCompanyMock = jest.fn<any>();
const getAllCompanyMock = jest.fn<any>();
const getCompanyDetailMock = jest.fn<any>();

jest.unstable_mockModule('../services/companyService.js', () => ({
    createCompanies: createCompanyMock,
    deleteCompanies: deleteCompanyMock,
    getAllCompanies: getAllCompanyMock,
    getCompanyDetails: getCompanyDetailMock,
}));

const { createCompanies, deleteCompanies, getAllCompanies, getCompanyDetails } =
    await import('../controllers/companyController.js');

const req = {} as any;
const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
const next = jest.fn();

describe('companyController', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('createCompanies calls service with req, res, next', async () => {
        await createCompanies(req, res, next);
        expect(createCompanyMock).toHaveBeenCalledWith(req, res, next);
    });

    it('deleteCompanies calls service with req, res, next', async () => {
        await deleteCompanies(req, res, next);
        expect(deleteCompanyMock).toHaveBeenCalledWith(req, res, next);
    });

    it('getAllCompanies calls service with req, res, next', async () => {
        await getAllCompanies(req, res, next);
        expect(getAllCompanyMock).toHaveBeenCalledWith(req, res, next);
    });

    it('getCompanyDetails calls service with req, res, next', async () => {
        await getCompanyDetails(req, res, next);
        expect(getCompanyDetailMock).toHaveBeenCalledWith(req, res, next);
    });
});
