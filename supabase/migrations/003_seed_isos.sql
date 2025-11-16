-- Migration: Seed initial interstellar objects
-- Description: Populate database with 3 confirmed ISOs for MVP testing
-- Date: 2025-01-10

-- Insert 3 confirmed interstellar objects
INSERT INTO iso_objects (nasa_id, name, designation, discovery_date, object_type) VALUES
('1I', '1I/''Oumuamua', 'A/2017 U1', '2017-10-19', 'interstellar'),
('2I', '2I/Borisov', 'C/2019 Q4', '2019-08-30', 'interstellar'),
('3I', '3I/ATLAS', 'A/2025 O1', '2025-07-01', 'interstellar');

-- Note: 3I/ATLAS discovered July 2025, perihelion October 29, 2025
