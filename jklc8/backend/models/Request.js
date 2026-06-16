// backend/models/Request.js
// Data access mapping layer for the VEHREQ database structure

const db = require('../db');

class Request {
  /**
   * Helper to format request ID / requisition number for database lookups
   * @param {string|number} id 
   * @returns {string}
   */
  static getReqNo(id) {
    if (!id) return id;
    const strId = String(id);
    if (/^\d{7,}$/.test(strId)) {
      return strId;
    }
    if (!isNaN(id)) {
      const currentYear = new Date().getFullYear();
      return `${currentYear}${String(id).padStart(3, '0')}`;
    }
    return strId;
  }

  /**
   * Get the next sequence value and generate the REQNO
   * @returns {string}
   */
  static async getNextReqNo() {
    const [rows] = await db.execute("SELECT REQNO FROM vehreq ORDER BY REQNO DESC LIMIT 1");
    const latest = rows[0]?.REQNO;
    const currentYear = new Date().getFullYear();
    let nextSeq = 1;
    if (latest && latest.startsWith(currentYear.toString())) {
      const seqStr = latest.substring(4);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
    return `${currentYear}${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Create a new vehicle request in the database mapped to VEHREQ columns
   * @param {Object} data 
   * @returns {string} The REQNO of the new record
   */
  static async create(data) {
    const reqNo = await Request.getNextReqNo();
    const sql = `
      INSERT INTO vehreq (
        LOCATION, REQLOCATION, REQNO, REQDT, REQTYP,
        FROMDEST, TODEST, FROMDATE, TODATE, PICKPOINT, DROPOINT,
        APPFLG, RECFLG, DETAILS, NOPER, REQBY, MOBNO, FORTHEEMP,
        VRQ_CATG, VRQ_CATG_DESC, COST_CENTER, RETURNFLG
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const fromDate = data.pickup_datetime ? new Date(data.pickup_datetime) : null;
    const toDate = data.return_datetime ? new Date(data.return_datetime) : null;

    const params = [
      data.plant_location, // LOCATION
      data.plant_location, // REQLOCATION
      reqNo,               // REQNO
      new Date(),          // REQDT
      data.journey_type,   // REQTYP
      data.from_location,  // FROMDEST
      data.to_location,    // TODEST
      fromDate,            // FROMDATE
      toDate,              // TODATE
      data.pickup_point,   // PICKPOINT
      data.drop_point || null, // DROPOINT
      data.status === 'Draft' ? 'DRAFT' : 'PENDING', // APPFLG
      'PENDING',           // RECFLG
      data.purpose,        // DETAILS
      data.passengers,     // NOPER
      data.employee_id,    // REQBY
      data.mobile_number,  // MOBNO
      data.employee_id,    // FORTHEEMP (storing employee ID/username instead of name)
      data.vehicle_category, // VRQ_CATG
      data.category,       // VRQ_CATG_DESC
      data.cost_center || '100', // COST_CENTER
      data.return_journey_required ? 1 : 0 // RETURNFLG
    ];

    await db.execute(sql, params);
    return reqNo;
  }

  /**
   * Helper to map database rows from VEHREQ columns for compatibility
   * @param {Object} row 
   * @returns {Object}
   */
  static mapRow(row) {
    if (!row) return row;

    // Parse REQNO to get numeric request_id (compat)
    let reqId = row.REQNO;
    if (row.REQNO && row.REQNO.length >= 7) {
      const parsed = parseInt(row.REQNO.substring(4), 10);
      if (!isNaN(parsed)) {
        reqId = parsed;
      }
    }

    // Workflow Status Mapping:
    let status = 'REQUEST SUBMITTED';
    if (row.APPFLG === 'DRAFT') {
      status = 'Draft';
    } else if (row.APPFLG === 'REJECTED') {
      status = 'REJECTED';
    } else if (row.GATEFLG === 'COMPLETED') {
      status = 'TRIP COMPLETED';
    } else if (row.GATEFLG === 'ASSIGNED') {
      status = 'VEHICLE ASSIGNED';
    } else if (row.APPFLG === 'APPROVED') {
      status = 'HOD APPROVED';
    } else if (row.APPFLG === 'PENDING') {
      status = 'REQUEST SUBMITTED';
    }

    // Parse times
    const fromDate = row.FROMDATE ? new Date(row.FROMDATE) : null;
    const toDate = row.TODATE ? new Date(row.TODATE) : null;

    let pickupDate = null;
    let pickupHour = null;
    let pickupMinute = null;
    if (fromDate) {
      pickupDate = fromDate.toISOString().split('T')[0];
      pickupHour = fromDate.getHours();
      pickupMinute = fromDate.getMinutes();
    }

    let returnDate = null;
    let returnHour = null;
    let returnMinute = null;
    if (toDate) {
      returnDate = toDate.toISOString().split('T')[0];
      returnHour = toDate.getHours();
      returnMinute = toDate.getMinutes();
    }

    // Reconstruct logs dynamically
    const logs = [];
    if (row.REQDT) {
      const timeStr = new Date(row.REQDT).toISOString().replace('T', ' ').slice(0, 16);
      logs.push({ step: 'Requested', time: timeStr });
    }
    if (row.APPFLG === 'APPROVED') {
      const timeStr = fromDate ? fromDate.toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16);
      logs.push({ step: 'Approved by HOD', time: timeStr, remark: row.APPREM || '' });
    } else if (row.APPFLG === 'REJECTED') {
      const timeStr = fromDate ? fromDate.toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16);
      logs.push({ step: 'Rejected by HOD', time: timeStr, remark: row.APPREM || '' });
    }
    if (row.GATEFLG === 'ASSIGNED' || row.GATEFLG === 'COMPLETED') {
      const timeStr = fromDate ? fromDate.toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16);
      logs.push({ step: 'Vehicle Allocated', time: timeStr });
    }
    if (row.GATEFLG === 'COMPLETED') {
      const timeStr = toDate ? toDate.toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16);
      logs.push({ step: 'Trip Completed', time: timeStr });
    }

    return {
      request_id: reqId,
      id: row.REQNO,
      requisition_no: row.REQNO,
      employee_id: row.REQBY,
      employee_name: row.employee_name || row.FORTHEEMP,
      department: row.department || '',
      mobile_number: row.MOBNO,
      plant_location: row.LOCATION,
      journey_type: row.REQTYP,
      pickup_point: row.PICKPOINT,
      drop_point: row.DROPOINT || '',
      from_location: row.FROMDEST,
      to_location: row.TODEST,
      purpose: row.DETAILS,
      passengers: row.NOPER,
      pickup_datetime: fromDate,
      return_datetime: toDate,
      return_journey_required: row.RETURNFLG === 1,
      travelling_with_guest: 0,
      guest_name: '',
      guest_mobile: '',
      remarks: row.APPREM || '',
      vehicle_category: row.VRQ_CATG,
      category: row.VRQ_CATG_DESC,
      status: status,
      created_at: row.REQDT,
      driver_name: row.DRINAME || '',
      vehicle_number: row.VEHNO || '',
      logs: logs,
      special_approval: row.SPAPPFLG === 'Y' || row.SPAPP === 'Y' ? 'Y' : 'N',
      ded_emp_code: row.DEDEMPCD || '',
      deduction_amount: row.DEDAMT !== null && row.DEDAMT !== undefined ? Number(row.DEDAMT) : null,
      sms_sent: row.SMSFLG === 'Y' || row.SENDSMSFLG === 'Y' ? 'Yes' : 'No',

      pickup_date: pickupDate,
      pickup_hour: pickupHour,
      pickup_minute: pickupMinute,
      return_date: returnDate,
      return_hour: returnHour,
      return_minute: returnMinute,
      distance: 0,
      cost: 0
    };
  }

  /**
   * Get all vehicle requests sorted by latest first
   * @returns {Array}
   */
  static async findAll() {
    const [rows] = await db.execute(`
      SELECT r.*, e.employee_name, e.department 
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      ORDER BY r.REQNO DESC
    `);
    return rows.map(Request.mapRow);
  }

  /**
   * Get a request by its ID
   * @param {string|number} id 
   * @returns {Object|null}
   */
  static async findById(id) {
    const reqNo = Request.getReqNo(id);
    const [rows] = await db.execute(`
      SELECT r.*, e.employee_name, e.department 
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      WHERE r.REQNO = ?
    `, [reqNo]);
    return rows[0] ? Request.mapRow(rows[0]) : null;
  }

  /**
   * Get requests for a specific employee
   * @param {string} empId 
   * @returns {Array}
   */
  static async findByEmployeeId(empId) {
    const [rows] = await db.execute(`
      SELECT r.*, e.employee_name, e.department 
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      WHERE r.REQBY = ? 
      ORDER BY r.REQNO DESC
    `, [empId]);
    return rows.map(Request.mapRow);
  }

  /**
   * Get requests for a specific department
   * @param {string} dept 
   * @returns {Array}
   */
  static async findByDepartment(dept) {
    const [rows] = await db.execute(`
      SELECT r.*, e.employee_name, e.department 
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      WHERE e.department = ? 
      ORDER BY r.REQNO DESC
    `, [dept]);
    return rows.map(Request.mapRow);
  }

  /**
   * Get the next sequence value
   * @returns {number}
   */
  static async getNextId() {
    const [rows] = await db.execute("SELECT REQNO FROM vehreq ORDER BY REQNO DESC LIMIT 1");
    const latest = rows[0]?.REQNO;
    const currentYear = new Date().getFullYear();
    let nextSeq = 1;
    if (latest && latest.startsWith(currentYear.toString())) {
      const seqStr = latest.substring(4);
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
    return nextSeq;
  }

  /**
   * Update the status of a request (such as complete status or cancel status)
   * @param {string|number} id 
   * @param {string} status 
   * @param {Array} logs 
   * @returns {boolean}
   */
  static async updateStatus(id, status, logs) {
    const reqNo = Request.getReqNo(id);
    let gateFlg = null;
    let appFlg = null;

    if (status === 'TRIP COMPLETED') {
      gateFlg = 'COMPLETED';
    } else if (status === 'VEHICLE ASSIGNED') {
      gateFlg = 'ASSIGNED';
    } else if (status === 'REJECTED') {
      appFlg = 'REJECTED';
    }

    let sql = 'UPDATE vehreq SET ';
    const params = [];
    if (gateFlg) {
      sql += 'GATEFLG = ?';
      params.push(gateFlg);
    }
    if (appFlg) {
      if (params.length > 0) sql += ', ';
      sql += 'APPFLG = ?';
      params.push(appFlg);
    }

    if (params.length === 0) return true;

    sql += ' WHERE REQNO = ?';
    params.push(reqNo);

    const [result] = await db.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Update HOD Approval details
   * @param {string|number} id 
   * @param {string} status 
   * @param {string} HODEmployeeId 
   * @param {Array} logs 
   * @returns {boolean}
   */
  static async updateHODApproval(id, status, HODEmployeeId, logs) {
    const reqNo = Request.getReqNo(id);
    const appFlg = (status === 'APPROVED BY HOD' || status === 'HOD APPROVED' || status === 'APPROVED') ? 'APPROVED' : 'REJECTED';

    let appRem = '';
    if (logs && logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      if (latestLog && latestLog.remark) {
        appRem = latestLog.remark;
      }
    }

    const [result] = await db.execute(
      'UPDATE vehreq SET APPFLG = ?, APPBY = ?, APPREM = ? WHERE REQNO = ?',
      [appFlg, HODEmployeeId, appRem, reqNo]
    );
    return result.affectedRows > 0;
  }

  /**
   * Update allocation details for vehicle and driver
   * @param {string|number} id 
   * @param {string} status 
   * @param {string} vehicleNo 
   * @param {string} driverName 
   * @param {string} assignedBy 
   * @param {Array} logs 
   * @returns {boolean}
   */
  static async updateAllocation(id, status, vehicleNo, driverName, assignedBy, logs, special_approval, deduction_amount, sms_sent, ded_emp_code) {
    const reqNo = Request.getReqNo(id);
    const driMobNo = '9829012345'; // default driver contact

    const spAppFlg = special_approval === 'Y' || special_approval === 'Yes' || special_approval === true ? 'Y' : 'N';
    const spApp = spAppFlg;
    const dedAmt = deduction_amount ? parseFloat(deduction_amount) : null;
    const smsFlg = sms_sent === 'Yes' || sms_sent === 'Y' ? 'Y' : 'N';
    const dedEmp = ded_emp_code || null;

    const [result] = await db.execute(
      'UPDATE vehreq SET VEHNO = ?, DRINAME = ?, DRIMOBNO = ?, GATEFLG = ?, SPAPP = ?, SPAPPFLG = ?, DEDAMT = ?, SMSFLG = ?, SENDSMSFLG = ?, CONSMSFLG = ?, DEDEMPCD = ? WHERE REQNO = ?',
      [vehicleNo, driverName, driMobNo, 'ASSIGNED', spApp, spAppFlg, dedAmt, smsFlg, smsFlg, smsFlg, dedEmp, reqNo]
    );
    return result.affectedRows > 0;
  }

  /**
   * Find a draft request for a specific employee
   * @param {string} empId 
   * @returns {Object|null}
   */
  static async findDraftByEmployeeId(empId) {
    const [rows] = await db.execute(`
      SELECT r.*, e.employee_name, e.department 
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      WHERE r.REQBY = ? AND r.APPFLG = 'DRAFT'
      LIMIT 1
    `, [empId]);
    return rows[0] ? Request.mapRow(rows[0]) : null;
  }

  /**
   * Update an existing draft request in the database
   * @param {string} reqNo 
   * @param {Object} data 
   * @returns {boolean}
   */
  static async update(reqNo, data) {
    const sql = `
      UPDATE vehreq SET
        LOCATION = ?, REQLOCATION = ?, REQDT = ?, REQTYP = ?,
        FROMDEST = ?, TODEST = ?, FROMDATE = ?, TODATE = ?,
        PICKPOINT = ?, DROPOINT = ?, APPFLG = ?, DETAILS = ?,
        NOPER = ?, MOBNO = ?, FORTHEEMP = ?, VRQ_CATG = ?,
        VRQ_CATG_DESC = ?, COST_CENTER = ?, RETURNFLG = ?
      WHERE REQNO = ?
    `;

    const fromDate = data.pickup_datetime ? new Date(data.pickup_datetime) : null;
    const toDate = data.return_datetime ? new Date(data.return_datetime) : null;

    const params = [
      data.plant_location, // LOCATION
      data.plant_location, // REQLOCATION
      new Date(),          // REQDT
      data.journey_type,   // REQTYP
      data.from_location,  // FROMDEST
      data.to_location,    // TODEST
      fromDate,            // FROMDATE
      toDate,              // TODATE
      data.pickup_point,   // PICKPOINT
      data.drop_point || null, // DROPOINT
      data.status === 'Draft' ? 'DRAFT' : 'PENDING', // APPFLG
      data.purpose,        // DETAILS
      data.passengers,     // NOPER
      data.mobile_number,  // MOBNO
      data.employee_id,    // FORTHEEMP
      data.vehicle_category, // VRQ_CATG
      data.category,       // VRQ_CATG_DESC
      data.cost_center || '100', // COST_CENTER
      data.return_journey_required ? 1 : 0, // RETURNFLG
      reqNo
    ];

    const [result] = await db.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Find vehicle requests matching filters
   * @param {Object} filters 
   * @returns {Array}
   */
  static async findByFilters(filters) {
    let sql = `
      SELECT r.*, e.employee_name, e.department, a.assigned_by, a.assigned_at
      FROM vehreq r 
      LEFT JOIN employees e ON r.REQBY = e.employee_id 
      LEFT JOIN vehicle_allocations a ON r.REQNO = a.REQNO
      WHERE 1=1
    `;
    const params = [];

    if (filters.from_date) {
      sql += ' AND r.REQDT >= ?';
      params.push(filters.from_date + ' 00:00:00');
    }
    if (filters.to_date) {
      sql += ' AND r.REQDT <= ?';
      params.push(filters.to_date + ' 23:59:59');
    }
    if (filters.plant_location) {
      sql += ' AND r.LOCATION = ?';
      params.push(filters.plant_location);
    }
    if (filters.department) {
      sql += ' AND e.department LIKE ?';
      params.push(`%${filters.department}%`);
    }
    if (filters.journey_type) {
      sql += ' AND r.REQTYP = ?';
      params.push(filters.journey_type);
    }
    if (filters.vehicle_category) {
      sql += ' AND r.VRQ_CATG_DESC = ?';
      params.push(filters.vehicle_category);
    }
    if (filters.employee_id) {
      sql += ' AND r.REQBY = ?';
      params.push(filters.employee_id);
    }
    if (filters.status) {
      if (filters.status === 'Draft') {
        sql += " AND r.APPFLG = 'DRAFT'";
      } else if (filters.status === 'REJECTED') {
        sql += " AND r.APPFLG = 'REJECTED'";
      } else if (filters.status === 'TRIP COMPLETED') {
        sql += " AND r.GATEFLG = 'COMPLETED'";
      } else if (filters.status === 'VEHICLE ASSIGNED') {
        sql += " AND r.GATEFLG = 'ASSIGNED'";
      } else if (filters.status === 'HOD APPROVED') {
        sql += " AND r.APPFLG = 'APPROVED' AND (r.GATEFLG IS NULL OR (r.GATEFLG != 'ASSIGNED' AND r.GATEFLG != 'COMPLETED'))";
      } else if (filters.status === 'REQUEST SUBMITTED') {
        sql += " AND r.APPFLG = 'PENDING'";
      }
    }

    sql += ' ORDER BY r.REQNO DESC';

    const [rows] = await db.execute(sql, params);
    
    return rows.map(row => {
      const mapped = Request.mapRow(row);
      if (row.assigned_by) mapped.assigned_by = row.assigned_by;
      if (row.assigned_at) mapped.assigned_at = row.assigned_at;
      return mapped;
    });
  }
}

module.exports = Request;
