import express from 'express';
import { isAuth } from '../middleware/auth.js';
import { createCompanies, deleteCompanies, getAllCompanies, getCompanyDetails } from '../controllers/companyController.js';
import uploadFile from '../middleware/multer.js';

const router = express.Router();

router.post('/create-company', isAuth, uploadFile, createCompanies);
router.get('/get-all-companies', isAuth, getAllCompanies);
router.delete('/delete-company/:companyId', isAuth, deleteCompanies);
router.get('/get-company-details/:id', isAuth, getCompanyDetails);
export default router;