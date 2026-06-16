// backend/controllers/transportController.js
// Handles Transport Desk vehicle & driver allocations and status updates

const Request = require('../models/Request');
const Allocation = require('../models/Allocation');
const VehicleDetail = require('../models/VehicleDetail');
const db = require('../db');

// Format database row to frontend JSON structure
function formatRequest(row) {
  if (!row) return null;
  const currentYear = new Date().getFullYear();
  return {
    id: `${currentYear}${String(row.request_id).padStart(3, '0')}`,
    request_id: row.request_id,
    employee_id: row.employee_id,
    empId: row.employee_id,
    employee_name: row.employee_name,
    empName: row.employee_name,
    department: row.department,
    mobile: row.mobile_number,
    plantLocation: row.plant_location,
    journeyType: row.journey_type,
    purpose: row.purpose,
    pickupLoc: row.pickup_point,
    pickup_point: row.pickup_point,
    dropLoc: row.drop_point || '',
    drop_point: row.drop_point || '',
    fromLoc: row.from_location,
    from_location: row.from_location,
    toLoc: row.to_location,
    to_location: row.to_location,
    destination: `${row.from_location} to ${row.to_location}`,
    destLoc: `${row.from_location} to ${row.to_location}`,
    passengers: row.passengers,
    pickupTime: row.pickup_datetime,
    pickup_datetime: row.pickup_datetime,
    returnJourneyRequired: row.return_journey_required === 1,
    returnTime: row.return_datetime,
    return_datetime: row.return_datetime,
    travellingWithGuest: row.travelling_with_guest === 1,
    guestName: row.guest_name || '',
    guestMobile: row.guest_mobile || '',
    remarks: row.remarks || '',
    suggestedCategory: row.vehicle_category,
    vehicle_category: row.vehicle_category,
    distance: row.distance || 0,
    cost: Number(row.cost || 0),
    status: row.status,
    created_at: row.created_at,
    driverName: row.driver_name || '',
    vehicleNo: row.vehicle_number || '',
    logs: row.logs ? (typeof row.logs === 'string' ? JSON.parse(row.logs) : row.logs) : [],
    special_approval: row.special_approval,
    ded_emp_code: row.ded_emp_code,
    deduction_amount: row.deduction_amount,
    sms_sent: row.sms_sent,
    
    // New fields
    category: row.category,
    pickup_date: row.pickup_date,
    pickup_hour: row.pickup_hour,
    pickup_minute: row.pickup_minute,
    return_date: row.return_date,
    return_hour: row.return_hour,
    return_minute: row.return_minute
  };
}

exports.getPendingTransport = async (req, res) => {
  try {
    const rows = await Request.findAll();
    const transportRequests = rows.filter(r => r.status !== 'Draft').map(formatRequest);

    return res.status(200).json(transportRequests);
  } catch (error) {
    console.error('Error fetching pending transport requests:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.assignVehicle = async (req, res) => {
  try {
    const { request_id, vehicle_number, driver_name, assigned_by, special_approval, ded_emp_code, deduction_amount, sms_sent } = req.body;
    let requestId = request_id;
    if (typeof request_id === 'string') {
      if (request_id.startsWith('REQ-2026-')) {
        requestId = parseInt(request_id.replace('REQ-2026-', ''), 10);
      } else if (/^\d{8}$/.test(request_id)) {
        requestId = parseInt(request_id.substring(6), 10);
      } else if (/^\d{7}$/.test(request_id)) {
        requestId = parseInt(request_id.substring(4), 10);
      } else if (/^\d+$/.test(request_id)) {
        requestId = parseInt(request_id, 10);
      }
    }

    if (!requestId || !vehicle_number || !driver_name || !assigned_by) {
      return res.status(400).json({
        success: false,
        message: 'request_id, vehicle_number, driver_name, and assigned_by are required.'
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const logs = request.logs ? (typeof request.logs === 'string' ? JSON.parse(request.logs) : request.logs) : [];
    logs.push({
      step: 'Vehicle Allocated',
      time: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    // Update vehicle request table
    await Request.updateAllocation(requestId, 'VEHICLE ASSIGNED', vehicle_number, driver_name, assigned_by, logs, special_approval, deduction_amount, sms_sent, ded_emp_code);

    // Save allocation details in vehicle_allocations table
    const allocationData = {
      request_id: requestId,
      vehicle_number,
      driver_name,
      assigned_by,
      assigned_at: new Date()
    };
    await Allocation.create(allocationData);

    // Update vehicle status in database
    await VehicleDetail.updateStatusByVehicleNo(vehicle_number, 'On Trip');

    return res.status(200).json({
      success: true,
      message: 'Vehicle and driver assigned successfully.'
    });
  } catch (error) {
    console.error('Error assigning vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { request_id, status } = req.body;
    let requestId = request_id;
    if (typeof request_id === 'string') {
      if (request_id.startsWith('REQ-2026-')) {
        requestId = parseInt(request_id.replace('REQ-2026-', ''), 10);
      } else if (/^\d{8}$/.test(request_id)) {
        requestId = parseInt(request_id.substring(6), 10);
      } else if (/^\d{7}$/.test(request_id)) {
        requestId = parseInt(request_id.substring(4), 10);
      } else if (/^\d+$/.test(request_id)) {
        requestId = parseInt(request_id, 10);
      }
    }

    if (!requestId || !status) {
      return res.status(400).json({ success: false, message: 'request_id and status are required.' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const logs = request.logs ? (typeof request.logs === 'string' ? JSON.parse(request.logs) : request.logs) : [];
    
    let stepName = 'Updated';
    if (status === 'TRIP COMPLETED') stepName = 'Trip Completed';

    logs.push({
      step: stepName,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    await Request.updateStatus(requestId, status, logs);

    // If trip completed, mark vehicle as Available again
    if (status === 'TRIP COMPLETED' && request.vehicle_number) {
      await VehicleDetail.updateStatusByVehicleNo(request.vehicle_number, 'Available');
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}.`
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

let hasResetMockStatus = false;

exports.getVehicles = async (req, res) => {
  try {
    if (!hasResetMockStatus) {
      // One-time startup reset for test environment to ensure all mock vehicles start fresh as Available
      await db.execute("UPDATE veh_details SET status = 'Available' WHERE vehicle_no IN ('RJ-24-CD-2468', 'RJ-38-CA-8556', 'DL-1C-AA-0007')");
      hasResetMockStatus = true;
      console.log('Reset test vehicles status to Available in database.');
    }

    const list = await VehicleDetail.findAll();
    
    // Fetch all vehicle numbers currently assigned to active trips
    const [activeTrips] = await db.execute("SELECT DISTINCT VEHNO FROM vehreq WHERE GATEFLG = 'ASSIGNED'");
    const activeVehicleNos = new Set(activeTrips.map(t => t.VEHNO ? t.VEHNO.trim().toUpperCase() : ''));

    // Synchronize vehicle status with active trips in the database
    for (const vehicle of list) {
      const vNo = vehicle.vehicle_no.trim().toUpperCase();
      const isOnTrip = activeVehicleNos.has(vNo);

      if (isOnTrip && vehicle.status !== 'On Trip') {
        vehicle.status = 'On Trip';
        await VehicleDetail.updateStatusByVehicleNo(vehicle.vehicle_no, 'On Trip');
      } else if (!isOnTrip && vehicle.status === 'On Trip') {
        vehicle.status = 'Available';
        await VehicleDetail.updateStatusByVehicleNo(vehicle.vehicle_no, 'Available');
      }
    }

    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.registerVehicle = async (req, res) => {
  try {
    const { driver_name, vehicle_no, driver_mob_no, vehicle_category, model_name } = req.body;
    if (!driver_name || !vehicle_no || !driver_mob_no || !vehicle_category || !model_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields (driver_name, vehicle_no, driver_mob_no, vehicle_category, model_name) are required.'
      });
    }

    const newVehicle = await VehicleDetail.create({
      driver_name,
      vehicle_no,
      driver_mob_no,
      vehicle_category,
      model_name,
      status: 'Available'
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      vehicle: newVehicle
    });
  } catch (error) {
    console.error('Error registering vehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Vehicle number already registered.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.updateVehicleStatus = async (req, res) => {
  try {
    const { vehicle_no, status } = req.body;
    if (!vehicle_no || !status) {
      return res.status(400).json({ success: false, message: 'vehicle_no and status are required.' });
    }
    const success = await VehicleDetail.updateStatusByVehicleNo(vehicle_no, status);
    return res.status(200).json({ success: true, message: `Vehicle status updated to ${status}.` });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicle_no } = req.body;
    if (!vehicle_no) {
      return res.status(400).json({ success: false, message: 'vehicle_no is required.' });
    }

    // Check if the vehicle is currently on an active trip (GATEFLG = 'ASSIGNED')
    const [activeTrips] = await db.execute(
      "SELECT DISTINCT VEHNO FROM vehreq WHERE GATEFLG = 'ASSIGNED' AND VEHNO = ?",
      [vehicle_no]
    );
    if (activeTrips.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a vehicle that is currently assigned to an active trip.'
      });
    }

    const success = await VehicleDetail.deleteByVehicleNo(vehicle_no);
    if (success) {
      return res.status(200).json({ success: true, message: `Vehicle ${vehicle_no} deleted successfully.` });
    } else {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

