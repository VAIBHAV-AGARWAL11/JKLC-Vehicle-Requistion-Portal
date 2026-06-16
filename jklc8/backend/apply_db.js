const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const sqlFilePath = path.join(__dirname, '../database/database.sql');
  console.log('Reading SQL file from:', sqlFilePath);
  
  let sqlContent;
  try {
    sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  } catch (error) {
    console.error('Failed to read database.sql file:', error);
    process.exit(1);
  }

  // Basic SQL parser: split by semicolon, filter out comments and empty statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      if (!stmt) return false;
      // Remove lines starting with --
      const lines = stmt.split('\n').map(line => line.trim());
      const filteredLines = lines.filter(line => !line.startsWith('--'));
      const cleanStmt = filteredLines.join(' ').trim();
      return cleanStmt.length > 0;
    })
    .map(stmt => {
      // Re-assemble statement without comment lines
      return stmt
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
    });

  console.log(`Found ${statements.length} SQL statements to execute.`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Arnold@123',
      multipleStatements: true
    });
    console.log('Connected to MySQL server.');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Logging a small preview of the statement
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 80);
      console.log(`Executing [${i + 1}/${statements.length}]: ${preview}...`);
      await connection.query(stmt); // Using connection.query instead of execute
    }

    console.log('\nAll SQL statements executed successfully!');
    
    // Print the recreated tables to verify
    console.log('\n--- Recreated Tables ---');
    const [tables] = await connection.query('SHOW TABLES FROM jklc_vehicle_portal;');
    console.log(tables.map(t => Object.values(t)[0]));

    await connection.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error applying SQL script to database:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

main();
