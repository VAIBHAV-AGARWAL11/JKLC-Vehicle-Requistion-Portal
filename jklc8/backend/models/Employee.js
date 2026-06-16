// backend/models/Employee.js
// Data access methods for the employees table

const db = require('../db');

class Employee {
  /**
   * Find an employee by employee_id
   * @param {string} employeeId 
   * @returns {Object|null}
   */
  static async findById(employeeId) {
    const [rows] = await db.execute('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
    return rows[0] || null;
  }

  /**
   * Find an employee by employee_id and password
   * @param {string} employeeId 
   * @param {string} password 
   * @returns {Object|null}
   */
  static async findByCredentials(employeeId, password) {
    const [rows] = await db.execute(
      'SELECT * FROM employees WHERE employee_id = ? AND password = ?',
      [employeeId, password]
    );
    return rows[0] || null;
  }
}

module.exports = Employee;
