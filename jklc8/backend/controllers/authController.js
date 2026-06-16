// backend/controllers/authController.js
// Handles login and validation of user credentials against database records

const Employee = require('../models/Employee');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and password are required.'
      });
    }

    // Find employee by credentials
    const employee = await Employee.findByCredentials(username.trim(), password.trim());

    if (employee) {
      // Exclude password from session data
      const userSession = {
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        department: employee.department,
        designation: employee.designation,
        role: employee.role,
        mobile: employee.mobile
      };

      return res.status(200).json({
        success: true,
        employee: userSession
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or Password.'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};
