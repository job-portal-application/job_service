import express from 'express';
import { isAuth } from '../middleware/auth.js';
import { createJobs, updateJobs, getAllActiveJobs, getSingleJobs, getAllApplicationsForJobs, updateApplications } from '../controllers/jobController.js';

const router = express.Router();

router.post('/create-job', isAuth, createJobs);
router.put('/update-job/:jobId', isAuth, updateJobs);
router.get('/active-jobs', getAllActiveJobs);
router.get('/job/:jobId', getSingleJobs);
router.get('/job/applications/:jobId', isAuth, getAllApplicationsForJobs);
router.put('/application/update/:id', isAuth, updateApplications);

export default router;