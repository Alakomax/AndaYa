-- Migration File v1: AndaYa Database Schema (PostgreSQL + PostGIS)
-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Enum Types
CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE trip_status AS ENUM ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending');

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Driver Profiles Table
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_year INT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    current_location GEOMETRY(Point, 4326),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for high-speed driver location lookup
CREATE INDEX idx_driver_location ON driver_profiles USING GIST (current_location);

-- 4. Trips Table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    status trip_status NOT NULL DEFAULT 'requested',
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    origin_location GEOMETRY(Point, 4326) NOT NULL,
    destination_location GEOMETRY(Point, 4326) NOT NULL,
    fare_amount DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(6, 2),
    duration_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on trip origin location
CREATE INDEX idx_trip_origin ON trips USING GIST (origin_location);

-- 5. Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type subscription_plan NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'pending',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ratings Table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id),
    evaluated_id UUID NOT NULL REFERENCES users(id),
    rating_stars INT CHECK (rating_stars >= 1 AND rating_stars <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
