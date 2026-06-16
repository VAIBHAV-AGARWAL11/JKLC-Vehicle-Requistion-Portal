const Request = require('./models/Request');
const Employee = require('./models/Employee');
const db = require('./db');

async function test() {
  try {
    const employee = await Employee.findById('EMP101');
    console.log('Found employee:', employee);

    const data = {
      employee_id: 'EMP101',
      plantLocation: 'Sirohi Plant',
      journeyType: 'Official Visit',
      category: 'Govt Officials',
      purpose: 'Meeting',
      pickupLoc: 'Office',
      dropLoc: 'Guest House',
      fromLoc: 'ABU ROAD',
      toLoc: 'UDAIPUR',
      passengers: 1,
      pickup_date: '2026-06-09',
      pickup_hour: 15,
      pickup_minute: 0,
      returnJourneyRequired: true,
      return_date: '2026-06-09',
      return_hour: 20,
      return_minute: 0,
      travellingWithGuest: false,
      mobile: '9829012345',
      suggestedCategory: 'Sedan',
      distance: 25,
      cost: 300,
      status: 'REQUEST SUBMITTED'
    };

    const pickupDateStr = data.pickup_date;
    const pickupHourInt = data.pickup_hour;
    const pickupMinInt = data.pickup_minute;
    const pickup_datetime = `${pickupDateStr} ${String(pickupHourInt).padStart(2, '0')}:${String(pickupMinInt).padStart(2, '0')}:00`;

    const returnJourney = data.returnJourneyRequired;
    const returnDateStr = data.return_date;
    const returnHourInt = data.return_hour;
    const returnMinInt = data.return_minute;
    const return_datetime = `${returnDateStr} ${String(returnHourInt).padStart(2, '0')}:${String(returnMinInt).padStart(2, '0')}:00`;

    const requestData = {
      employee_id: data.employee_id || null,
      employee_name: employee.employee_name || null,
      department: employee.department || null,
      plant_location: data.plantLocation || null,
      journey_type: data.journeyType || null,
      pickup_point: data.pickupLoc || null,
      drop_point: data.dropLoc || null,
      from_location: data.fromLoc || null,
      to_location: data.toLoc || null,
      purpose: data.purpose || null,
      pickup_datetime: pickup_datetime || null,
      return_datetime: return_datetime || null,
      passengers: data.passengers || 1,
      vehicle_category: data.suggestedCategory || null,
      mobile_number: data.mobile || null,
      remarks: data.remarks || null,
      status: data.status || 'REQUEST SUBMITTED',
      return_journey_required: returnJourney ? 1 : 0,
      travelling_with_guest: 0,
      guest_name: '',
      guest_mobile: '',
      distance: data.distance || 0,
      cost: data.cost || 0.00,
      logs: [{ step: 'Requested', time: new Date().toISOString().replace('T', ' ').slice(0, 16) }],
      created_at: new Date(),
      
      category: data.category || null,
      pickup_date: data.pickup_date || null,
      pickup_hour: data.pickup_hour,
      pickup_minute: data.pickup_minute,
      return_date: data.return_date || null,
      return_hour: data.return_hour,
      return_minute: data.return_minute
    };

    console.log('Inserting request data...');
    const insertId = await Request.create(requestData);
    console.log('Inserted successfully! ID:', insertId);
    
    // Clean up inserted request
    console.log('Cleaning up...');
    await db.execute('DELETE FROM vehreq WHERE REQNO = ?', [insertId]);
    console.log('Cleaned up successfully.');
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
  } finally {
    process.exit(0);
  }
}

test();
