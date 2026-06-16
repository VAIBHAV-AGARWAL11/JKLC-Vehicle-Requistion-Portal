const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Arnold@123',
      database: process.env.DB_NAME || 'jklc_vehicle_portal'
    });
    console.log('Connected to database jklc_vehicle_portal.');
    
    // Check if vehicle_type exists
    try {
      const [typeFields] = await connection.execute('DESCRIBE vehicle_type;');
      console.log('\n--- vehicle_type Schema ---');
      console.log(JSON.stringify(typeFields, null, 2));
      
      const [typeRows] = await connection.execute('SELECT * FROM vehicle_type;');
      console.log('--- vehicle_type Rows ---');
      console.log(JSON.stringify(typeRows, null, 2));
    } catch (e) {
      console.log('vehicle_type table description error:', e.message);
    }
    
    // Check if vehicle_type_category exists
    try {
      const [catFields] = await connection.execute('DESCRIBE vehicle_type_category;');
      console.log('\n--- vehicle_type_category Schema ---');
      console.log(JSON.stringify(catFields, null, 2));
      
      const [catRows] = await connection.execute('SELECT * FROM vehicle_type_category;');
      console.log('--- vehicle_type_category Rows ---');
      console.log(JSON.stringify(catRows, null, 2));
    } catch (e) {
      console.log('vehicle_type_category table description error:', e.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
