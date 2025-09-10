-- Initialize PostgreSQL database for Excalidraw
-- This script creates the necessary tables for storing scene data and permalinks

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create scenes table for storing Excalidraw scene data
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id VARCHAR(255) NOT NULL UNIQUE,
    room_key VARCHAR(255) NOT NULL,
    encrypted_data TEXT NOT NULL,
    iv TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on room_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scenes_room_id ON scenes(room_id);

-- Create index on updated_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON scenes(updated_at);

-- Create permalinks table for student room links
CREATE TABLE IF NOT EXISTS permalinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permalink VARCHAR(255) NOT NULL UNIQUE,
    room_id VARCHAR(255) NOT NULL,
    room_key VARCHAR(255) NOT NULL,
    student_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create index on permalink for faster lookups
CREATE INDEX IF NOT EXISTS idx_permalinks_permalink ON permalinks(permalink);

-- Create index on room_id to link with scenes
CREATE INDEX IF NOT EXISTS idx_permalinks_room_id ON permalinks(room_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update last_accessed on permalinks
CREATE TRIGGER update_permalinks_last_accessed
    BEFORE UPDATE ON permalinks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your Railway setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;