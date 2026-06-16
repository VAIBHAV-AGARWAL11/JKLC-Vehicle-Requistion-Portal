// backend/routes/transportRoutes.js
// Transport Desk routing configuration

const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');

router.get('/transport/pending', transportController.getPendingTransport);
router.post('/transport/assign', transportController.assignVehicle);
router.post('/transport/update-status', transportController.updateStatus);
router.get('/vehicles', transportController.getVehicles);
router.post('/vehicles', transportController.registerVehicle);
router.post('/vehicles/update-status', transportController.updateVehicleStatus);
router.post('/vehicles/delete', transportController.deleteVehicle);

module.exports = router;
