-- Drop existing tables if needed 
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS marketplace_dishes CASCADE;
-- DROP TABLE IF EXISTS meals CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- USERS TABLE (Complete with ALL fields)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  
  -- Role system
  role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'homecook', 'admin')),
  
  -- Basic profile (from onboarding)
  age INTEGER,
  gender VARCHAR(50),
  weight DECIMAL(5, 2),  -- in kg
  height DECIMAL(5, 2),  -- in cm
  
  -- Activity & Goals
  activity_level VARCHAR(100),
  health_goals TEXT[],
  
  -- Dietary preferences
  dietary_preferences TEXT[],
  allergies TEXT[],
  preferred_cuisines TEXT[],
  
  -- Budget settings
  daily_budget DECIMAL(10, 2),
  weekly_budget DECIMAL(10, 2),
  shopping_style VARCHAR(100),
  
  -- Home cooking preferences
  preferred_serving_size INTEGER,
  nutrition_focus TEXT[],
  
  -- AI & Notifications
  ai_personalization_strength INTEGER DEFAULT 75,
  enable_ai_suggestions BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sms_notifications BOOLEAN DEFAULT false,
  
  -- Privacy
  allow_data_sharing BOOLEAN DEFAULT false,
  
  -- Home cook fields (for marketplace)
  homecook_status VARCHAR(50) CHECK (homecook_status IN ('pending', 'approved', 'rejected', NULL)),
  homecook_application_date TIMESTAMP,
  homecook_approved_date TIMESTAMP,
  homecook_approved_by INTEGER REFERENCES users(id),
  business_name VARCHAR(255),
  business_description TEXT,
  pickup_area VARCHAR(100),
  pickup_landmark VARCHAR(255),
  pickup_address TEXT,
  pickup_phone VARCHAR(20),
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_homecook_status ON users(homecook_status);

-- ==========================================
-- MEALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Meal details
  meal_date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Nutrition info
  calories DECIMAL(8, 2) DEFAULT 0,
  protein DECIMAL(8, 2) DEFAULT 0,
  carbs DECIMAL(8, 2) DEFAULT 0,
  fats DECIMAL(8, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(meal_date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);

-- ==========================================
-- MARKETPLACE DISHES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS marketplace_dishes (
  id SERIAL PRIMARY KEY,
  homecook_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dish details
  dish_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  servings INTEGER DEFAULT 1 CHECK (servings > 0),
  
  -- Categorization
  cuisine_type VARCHAR(100),
  dietary_tags TEXT[],
  
  -- Logistics
  preparation_time INTEGER, -- in minutes
  available BOOLEAN DEFAULT true,
  
  -- Nutrition (