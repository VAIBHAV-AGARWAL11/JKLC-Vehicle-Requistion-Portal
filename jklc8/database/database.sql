-- =========================================================
-- DATABASE: jklc_vehicle_portal
-- =========================================================

CREATE DATABASE IF NOT EXISTS jklc_vehicle_portal;
USE jklc_vehicle_portal;

-- Drop existing tables to ensure clean recreation (order is important due to Foreign Keys)
DROP TABLE IF EXISTS vehicle_allocations;
DROP TABLE IF EXISTS vehicle_requests;
DROP TABLE IF EXISTS vehreq;
DROP TABLE IF EXISTS vehicle_request_dummy;
DROP TABLE IF EXISTS employees;

-- Optional cleanup of old unused tables if present
DROP TABLE IF EXISTS vehicle_type;
DROP TABLE IF EXISTS vehicle_type_category;

-- =========================================================
-- TABLE 1: employees
-- =========================================================
CREATE TABLE IF NOT EXISTS employees (
  employee_id VARCHAR(50) PRIMARY KEY,
  employee_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL
);

-- =========================================================
-- TABLE 2: vehreq
-- =========================================================
CREATE TABLE IF NOT EXISTS vehreq (
  LOCATION VARCHAR(100) DEFAULT NULL,
  REQLOCATION VARCHAR(100) DEFAULT NULL,
  REQNO VARCHAR(50) NOT NULL,
  REQDT date DEFAULT NULL,
  REQTYP varchar(50) DEFAULT NULL,
  LOCOFLG varchar(10) DEFAULT NULL,
  FROMDEST VARCHAR(100) DEFAULT NULL,
  TODEST VARCHAR(100) DEFAULT NULL,
  FROMDATE datetime DEFAULT NULL,
  TODATE datetime DEFAULT NULL,
  DETAILS varchar(100) DEFAULT NULL,
  NOPER int DEFAULT NULL,
  REQBY VARCHAR(50) DEFAULT NULL,
  DEDEMPCD varchar(6) DEFAULT NULL,
  RECOBY varchar(6) DEFAULT NULL,
  RECFLG varchar(10) DEFAULT NULL,
  RECREM varchar(80) DEFAULT NULL,
  APPBY varchar(6) DEFAULT NULL,
  APPFLG varchar(10) DEFAULT NULL,
  APPREM varchar(80) DEFAULT NULL,
  HIRED_FLAG char(1) DEFAULT NULL,
  SPAPP varchar(6) DEFAULT NULL,
  SPAPPFLG varchar(10) DEFAULT NULL,
  SPPREM varchar(80) DEFAULT NULL,
  GATEFLG varchar(10) DEFAULT NULL,
  GATEVEHFLG varchar(5) DEFAULT NULL,
  VEHNO varchar(20) DEFAULT NULL,
  GATEREM varchar(30) DEFAULT NULL,
  GATEDT date DEFAULT NULL,
  UNSCH char(1) DEFAULT NULL,
  LOPHNO varchar(10) DEFAULT NULL,
  MOBNO varchar(13) DEFAULT NULL,
  COMPNM varchar(50) DEFAULT NULL,
  GSTNM varchar(45) DEFAULT NULL,
  GSTCONTMOBNO varchar(13) DEFAULT NULL,
  PICKPOINT VARCHAR(100) DEFAULT NULL,
  DROPOINT VARCHAR(100) DEFAULT NULL,
  DRIMOBNO varchar(13) DEFAULT NULL,
  DRINAME varchar(50) DEFAULT NULL,
  HIRETYP varchar(10) DEFAULT NULL,
  SMSFLG char(1) DEFAULT NULL,
  FORTHEEMP varchar(100) DEFAULT NULL,
  CONSMSFLG char(1) DEFAULT NULL,
  SENDSMSFLG char(1) DEFAULT NULL,
  APP1 char(1) DEFAULT NULL,
  APP2 char(1) DEFAULT NULL,
  RETURNFLG char(1) DEFAULT NULL,
  NOPER1 int DEFAULT NULL,
  DEDAMT decimal(12,0) DEFAULT NULL,
  NOTI_TO varchar(20) DEFAULT NULL,
  NOTI_FLG char(1) DEFAULT NULL,
  COST_CENTER varchar(20) DEFAULT NULL,
  FARE_AMOUNT decimal(10,2) DEFAULT NULL,
  VRQ_CATG VARCHAR(50) DEFAULT NULL,
  VRQ_CATG_DESC VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (REQNO),
  UNIQUE KEY VEH_03102024 (REQNO, REQLOCATION),
  -- Foreign key constraint
  FOREIGN KEY (REQBY) REFERENCES employees(employee_id) ON DELETE CASCADE,
  -- Indexes for speed queries
  INDEX idx_REQBY (REQBY),
  INDEX idx_APPFLG (APPFLG)
);

-- =========================================================
-- TABLE 3: vehicle_allocations
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicle_allocations (
  allocation_id INT AUTO_INCREMENT PRIMARY KEY,
  REQNO VARCHAR(50) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  assigned_by VARCHAR(50) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (REQNO) REFERENCES vehreq(REQNO) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES employees(employee_id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_REQNO (REQNO)
);

-- =========================================================
-- TABLE 4: vehicle_type_category
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicle_type_category (
  sno VARCHAR(4) PRIMARY KEY,
  descr VARCHAR(255) NOT NULL
);

-- =========================================================
-- TABLE 5: vehicle_type
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicle_type (
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  plant VARCHAR(100) NOT NULL,
  app VARCHAR(50) NULL,
  orderby INT NOT NULL
);

-- =========================================================
-- SEED DATA: DUMMY USERS
-- =========================================================

-- EMPLOYEE USERS
INSERT INTO employees (employee_id, employee_name, department, designation, role, password, mobile)
VALUES 
('EMP101', 'Anoop Kumar', 'Operations', 'Executive', 'Employee', 'emp123', '9829012345')
ON DUPLICATE KEY UPDATE 
  employee_name = VALUES(employee_name),
  department = VALUES(department),
  designation = VALUES(designation),
  role = VALUES(role),
  password = VALUES(password),
  mobile = VALUES(mobile);

INSERT INTO employees (employee_id, employee_name, department, designation, role, password, mobile)
VALUES 
('EMP102', 'Vaibhav Agarwal', 'IT', 'SDE', 'Employee', 'emp456', '8000689178')
ON DUPLICATE KEY UPDATE 
  employee_name = VALUES(employee_name),
  department = VALUES(department),
  designation = VALUES(designation),
  role = VALUES(role),
  password = VALUES(password),
  mobile = VALUES(mobile);

-- HOD USERS
INSERT INTO employees (employee_id, employee_name, department, designation, role, password, mobile)
VALUES 
('HOD201', 'Rajesh Sharma', 'Operations', 'Head of Operations', 'HOD', 'hod123', '9876543210')
ON DUPLICATE KEY UPDATE 
  employee_name = VALUES(employee_name),
  department = VALUES(department),
  designation = VALUES(designation),
  role = VALUES(role),
  password = VALUES(password),
  mobile = VALUES(mobile);

INSERT INTO employees (employee_id, employee_name, department, designation, role, password, mobile)
VALUES 
('HOD202', 'Manoj Bothra', 'IT', 'IT Head', 'HOD', 'hod456', '9828699699')
ON DUPLICATE KEY UPDATE 
  employee_name = VALUES(employee_name),
  department = VALUES(department),
  designation = VALUES(designation),
  role = VALUES(role),
  password = VALUES(password),
  mobile = VALUES(mobile);

-- TRANSPORT DESK USER
INSERT INTO employees (employee_id, employee_name, department, designation, role, password, mobile)
VALUES 
('TD301', 'Ramesh Singh', 'Time Office', 'Transport Desk Lead', 'TransportDesk', 'transport123', '8877665544')
ON DUPLICATE KEY UPDATE 
  employee_name = VALUES(employee_name),
  department = VALUES(department),
  designation = VALUES(designation),
  role = VALUES(role),
  password = VALUES(password),
  mobile = VALUES(mobile);

-- =========================================================
-- SEED DATA: VEHICLE TYPE CATEGORY
-- =========================================================
INSERT INTO vehicle_type_category (sno, descr) VALUES
('100', 'Govt Officials'),
('101', 'HO Employees, Marketing/RMC, Other Units Employees'),
('102', 'Ladies Club'),
('103', 'Auditor, Consultants, Service Engineer, Others'),
('104', 'Employees Health Check-up as per company scheme'),
('105', 'Employees for pers.  purpose and dedu. from salary'),
('106', 'Official Tour Employees'),
('107', 'CSR Activity by CSR Employees '),
('108', 'Banas by Employees and Others'),
('109', 'Others')
ON DUPLICATE KEY UPDATE descr = VALUES(descr);

-- =========================================================
-- SEED DATA: VEHICLE TYPES
-- =========================================================
INSERT INTO vehicle_type (name, code, plant, app, orderby) VALUES
('OFFICIAL', 'O', 'SIROHI PLANT', '', 1),
('PERSONAL', 'P', 'SIROHI PLANT', '', 2),
('GOVERNMENT OFFICIAL', 'G', 'UDAIPUR PLANT', '', 3),
('OFFICIAL', 'O', 'UDAIPUR PLANT', '', 1),
('PERSONAL', 'P', 'UDAIPUR PLANT', '', 2),
('OFFICIAL', 'O', 'DURG PLANT', '', 1),
('PERSONAL', 'P', 'DURG PLANT', '', 2),
('MINES VEHICLE PERSONAL', 'M', 'UDAIPUR PLANT', '103598', 5),
('MINES VEHICLE OFFICIAL', 'N', 'UDAIPUR PLANT', '103598', 4),
('AMBULENCE PERSONAL', 'A', 'UDAIPUR PLANT', '199109', 7),
('AMBULENCE OFFICIAL', 'B', 'UDAIPUR PLANT', '199109', 6),
('OFFICIAL', 'O', 'CUTTACK', '', 1),
('PERSONAL', 'P', 'CUTTACK', '', 2),
('OFFICIAL', 'O', 'UDAIPUR-OUTSIDE', '', 1),
('PERSONAL', 'P', 'UDAIPUR-OUTSIDE', '', 2),
('GOVERNMENT OFFICIAL', 'G', 'UDAIPUR-OUTSIDE', '', 3),
('MINES VEHICLE OFFICIAL', 'N', 'UDAIPUR-OUTSIDE', '103598', 4),
('MINES VEHICLE PERSONAL', 'M', 'UDAIPUR-OUTSIDE', '103598', 5),
('AMBULENCE OFFICIAL', 'B', 'UDAIPUR-OUTSIDE', '199109', 6),
('AMBULENCE PERSONAL', 'A', 'UDAIPUR-OUTSIDE', '199109', 7),
('OFFICIAL', 'O', 'SIROHI PLANT-OUTSIDE', '', 1),
('PERSONAL', 'P', 'SIROHI PLANT-OUTSIDE', '', 2);

-- =========================================================
-- TABLE 6: veh_details
-- =========================================================
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

-- Seed Initial Fleet
INSERT INTO veh_details (driver_name, vehicle_no, driver_mob_no, vehicle_category, model_name, status) VALUES
('Amit Sharma', 'RJ-24-CA-1234', '9876543210', 'Hatchback', 'Maruti Suzuki Swift', 'Available'),
('Rajesh Kumar', 'RJ-24-CB-5678', '9988776655', 'Sedan', 'Honda City', 'Available'),
('Vijay Yadav', 'DL-3C-AY-8899', '9123456789', 'Premium Sedan', 'Toyota Camry Hybrid', 'Available'),
('Ramesh Singh', 'RJ-24-CC-9911', '8877665544', 'SUV', 'Mahindra XUV700', 'Available'),
('None (Assigned)', 'DL-1C-AA-0007', '9900990099', 'Executive Vehicle', 'Audi A6 Limo', 'Available'),
('Sanjay Patel', 'RJ-24-CD-2468', '7766554433', 'Sedan', 'Hyundai Verna', 'Available')
ON DUPLICATE KEY UPDATE
  driver_name = VALUES(driver_name),
  driver_mob_no = VALUES(driver_mob_no),
  vehicle_category = VALUES(vehicle_category),
  model_name = VALUES(model_name),
  status = VALUES(status);

