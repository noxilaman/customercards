--CREATE DATABASE IF NOT EXISTS customercards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--USE customercards;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visit_date DATE NOT NULL,
  is_visitor TINYINT(1) DEFAULT 0,

  -- Contact info from business card
  company_name VARCHAR(255),
  contact_name VARCHAR(255),
  position VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,

  -- Country (multiple allowed, stored as JSON array)
  countries JSON,
  country_other VARCHAR(100),

  -- Business Type (multiple allowed, stored as JSON array)
  business_types JSON,
  business_type_other VARCHAR(100),

  -- Form fields
  remark TEXT,
  note TEXT,
  arrange_by VARCHAR(100),

  -- Photos
  card_photo VARCHAR(255),
  customer_photo VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
