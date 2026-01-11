-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'home_cook', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Sample data (optional, for testing)
-- Password is 'password123' hashed
INSERT INTO users (email, password_hash, full_name, role) VALUES
('test@nutriai.com', '$2b$10$YourHashedPasswordHere', 'Test User', 'consumer')
ON CONFLICT (email) DO NOTHING;