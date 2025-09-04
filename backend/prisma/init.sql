-- Database initialization script for Drug Information Platform
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create a database user for the application (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'drug_info_user') THEN
        CREATE ROLE drug_info_user WITH LOGIN PASSWORD 'drug_info_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE drug_info_db TO drug_info_user;
GRANT USAGE ON SCHEMA public TO drug_info_user;
GRANT CREATE ON SCHEMA public TO drug_info_user;

-- Create initial indexes for better performance (these will be recreated by Prisma)
-- But having them here ensures they exist from the start

-- Function to create full-text search index
CREATE OR REPLACE FUNCTION create_search_indexes() RETURNS void AS $$
BEGIN
    -- This will be executed after Prisma creates the tables
    PERFORM pg_sleep(5); -- Wait for tables to be created
    
    -- Create indexes if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Drug') THEN
        -- Full-text search indexes
        CREATE INDEX IF NOT EXISTS idx_drug_name_search ON "Drug" USING gin(to_tsvector('english', name));
        CREATE INDEX IF NOT EXISTS idx_drug_generic_search ON "Drug" USING gin(to_tsvector('english', coalesce("genericName", '')));
        CREATE INDEX IF NOT EXISTS idx_drug_description_search ON "Drug" USING gin(to_tsvector('english', coalesce("aiEnhancedDescription", '')));
        
        -- Trigram indexes for fuzzy search
        CREATE INDEX IF NOT EXISTS idx_drug_name_trgm ON "Drug" USING gin(name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_drug_generic_trgm ON "Drug" USING gin("genericName" gin_trgm_ops);
        
        -- Standard indexes
        CREATE INDEX IF NOT EXISTS idx_drug_published ON "Drug"(published) WHERE published = true;
        CREATE INDEX IF NOT EXISTS idx_drug_slug ON "Drug"(slug);
        CREATE INDEX IF NOT EXISTS idx_drug_manufacturer ON "Drug"(manufacturer);
        CREATE INDEX IF NOT EXISTS idx_drug_route ON "Drug"(route);
        CREATE INDEX IF NOT EXISTS idx_drug_updated_at ON "Drug"("updatedAt" DESC);
        CREATE INDEX IF NOT EXISTS idx_drug_created_at ON "Drug"("createdAt" DESC);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'DrugFAQ') THEN
        CREATE INDEX IF NOT EXISTS idx_drug_faq_drug_id ON "DrugFAQ"("drugId");
        CREATE INDEX IF NOT EXISTS idx_drug_faq_search ON "DrugFAQ" USING gin(to_tsvector('english', question || ' ' || answer));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Notification function for when tables are ready
CREATE OR REPLACE FUNCTION notify_tables_ready() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('tables_ready', 'Drug tables have been created');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a simple health check function
CREATE OR REPLACE FUNCTION db_health_check() RETURNS text AS $$
BEGIN
    RETURN 'Database is healthy at ' || now();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get database stats
CREATE OR REPLACE FUNCTION get_db_stats() RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'connection_count', (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()),
        'table_count', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'),
        'timestamp', now()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Log the initialization
INSERT INTO pg_stat_statements_info (calls, rows, query) 
VALUES (1, 1, 'Drug Information Platform database initialized at ' || now())
ON CONFLICT DO NOTHING;

-- Create a simple log table for application events
CREATE TABLE IF NOT EXISTS app_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);

-- Insert initialization log
INSERT INTO app_logs (level, message, metadata) 
VALUES ('INFO', 'Database initialization completed', json_build_object('timestamp', now(), 'version', '1.0.0'));

-- Display success message
SELECT 'Drug Information Platform database initialized successfully!' as status;