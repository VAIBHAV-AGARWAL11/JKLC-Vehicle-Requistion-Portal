// backend/models/VehicleDetail.js
// Data access layer for the veh_details table

const db = require('../db');

class VehicleDetail {
  /**
   * Fetch all registered vehicles from the database
   * @returns {Promise<Array>}
   */
  static async findAll() {
    const [rows] = await db.execute('SELECT * FROM veh_details ORDER BY id DESC');
    return rows;
  }

  /**
   * Insert a new vehicle into the database
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const sql = `
      INSERT INTO veh_details (
        driver_name, vehicle_no, driver_mob_no, vehicle_category, model_name, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.driver_name,
      data.vehicle_no,
      data.driver_mob_no,
      data.vehicle_category,
      data.model_name,
      data.status || 'Available'
    ];
    const [result] = await db.execute(sql, params);
    return { id: result.insertId, ...data, status: data.status || 'Available' };
  }

  /**
   * Update the operational status of a vehicle by its vehicle number
   * @param {string} vehicleNo
   * @param {string} status
   * @returns {Promise<boolean>}
   */
  static async updateStatusByVehicleNo(vehicleNo, status) {
    const [result] = await db.execute(
      'UPDATE veh_details SET status = ? WHERE vehicle_no = ?',
      [status, vehicleNo]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete a vehicle from the database by its vehicle number
   * @param {string} vehicleNo
   * @returns {Promise<boolean>}
   */
  static async deleteByVehicleNo(vehicleNo) {
    const [result] = await db.execute(
      'DELETE FROM veh_details WHERE vehicle_no = ?',
      [vehicleNo]
    );
    return result.affectedRows > 0;
  }
}

module.exports = VehicleDetail;
