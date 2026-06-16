// backend/routes/hodRoutes.js
// HOD approval and department requisition routing configuration

const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');

router.get('/pending-hod', hodController.getPendingHOD);
router.post('/hod/approve', hodController.approveRequest);
router.post('/hod/reject', hodController.rejectRequest);

module.exports = router;
