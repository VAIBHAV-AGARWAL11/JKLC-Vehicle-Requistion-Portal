const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Arnold@123',
      database: process.env.DB_NAME || 'jklc_vehicle_portal'
    });
    console.log('Connected to database jklc_vehicle_portal.');

    // Create Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS veh_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_name VARCHAR(100) NOT NULL,
        vehicle_no VARCHAR(50) NOT NULL UNIQUE,
        driver_mob_no VARCHAR(20) NOT NULL,
        vehicle_category VARCHAR(50) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('veh_details table checked/created.');

    // Check if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) AS cnt FROM veh_details');
    if (rows[0].cnt === 0) {
      console.log('Seeding initial vehicles...');
      await connection.execute(`
        INSERT INTO veh_details (driver_name, vehicle_no, driver_mob_no, vehicle_category, model_name, status) VALUES
        ('Amit Sharma', 'RJ-24-CA-1234', '9876543210', 'Hatchback', 'Maruti Suzuki Swift', 'Available'),
        ('Rajesh Kumar', 'RJ-24-CB-5678', '9988776655', 'Sedan', 'Honda City', 'Available'),
        ('Vijay Yadav', 'DL-3C-AY-8899', '9123456789', 'Premium Sedan', 'Toyota Camry Hybrid', 'Available'),
        ('Ramesh Singh', 'RJ-24-CC-9911', '8877665544', 'SUV', 'Mahindra XUV700', 'Available'),
        ('None (Assigned)', 'DL-1C-AA-0007', '9900990099', 'Executive Vehicle', 'Audi A6 Limo', 'Available'),
        ('Sanjay Patel', 'RJ-24-CD-2468', '7766554433', 'Sedan', 'Hyundai Verna', 'Available');
      `);
      console.log('Seeding completed.');
    } else {
      console.log('veh_details already has data, skipping seed.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error during database update:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

main();
