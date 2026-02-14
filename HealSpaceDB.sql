-- =============================================
-- HealSpace Database Schema
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS healspace;
USE healspace;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS categories;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Categories (Art, Music, Tech, etc.)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Programs (Individual activities)
CREATE TABLE programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_mins INT NOT NULL,
    location VARCHAR(200),
    capacity INT NOT NULL DEFAULT 10,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Users (Patients and Staff)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthday DATE,
    role ENUM('patient', 'admin') DEFAULT 'patient',
    room_number VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Program Schedules (Recurring availability patterns)
-- e.g., "Watercolor Painting is available Mon/Wed, 10:00-15:00"
CREATE TABLE program_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_mins INT NOT NULL DEFAULT 60 COMMENT 'How long each bookable slot is',
    max_per_slot INT NOT NULL DEFAULT 0 COMMENT 'Override capacity per slot, 0 = use program capacity',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Time Slots (Auto-generated from schedules, one row per bookable slot)
CREATE TABLE time_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    spots_available INT NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Bookings (Patient reservations)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    status ENUM('booked', 'cancelled', 'completed') DEFAULT 'booked',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
);




-- =============================================
-- SAMPLE DATA
-- =============================================

-- Categories
INSERT INTO categories (name, description, image_url) VALUES
('Art Therapy', 'Creative expression through painting, drawing, and crafts', '/img/categories/art_therapy.png'),
('Music Therapy', 'Healing through live music and sound experiences', '/img/categories/music_therapy.png'),
('Technology', 'Explore virtual reality, gaming, and digital relaxation', '/img/categories/technology.png'),
('Animal Therapy', 'Comfort and joy through trained therapy animals', '/img/categories/animal_therapy.png'),
('Spiritual Care', 'Reflection, meditation, and spiritual support for all beliefs', '/img/categories/spiritual_care.png');

-- Programs

-- Art Therapy (category_id = 1)
INSERT INTO programs (category_id, title, description, duration_mins, location, capacity) VALUES
(1, 'Coloring & Art Books', 'Pick up coloring books and supplies to enjoy in your room at your own pace. A relaxing activity you can do anytime.', 0, 'Activity Room 101 - Pickup', 999),
(1, 'Watercolor Painting Class', 'Learn basic watercolor techniques in a relaxed, beginner-friendly class. All supplies provided.', 45, 'Art Room 203', 10),
(1, 'Oil Painting Class', 'Explore oil painting with guidance from our art therapist. Great for beginners and experienced painters.', 60, 'Art Room 203', 8),
(1, 'Craft Workshop', 'Rotating craft activities including origami, card making, and simple projects. New craft each week!', 45, 'Art Room 203', 10);

-- Music Therapy (category_id = 2)
INSERT INTO programs (category_id, title, description, duration_mins, location, capacity) VALUES
(2, 'Bedside Guitar', 'A musician visits your room for a personal guitar session. Requests welcome - from classical to folk to pop.', 25, 'Your Room', 1),
(2, 'Bedside Harp', 'Gentle harp music at your bedside for relaxation and comfort. Perfect for rest and recovery.', 25, 'Your Room', 1),
(2, 'Live Music in the Garden', 'Enjoy live performances in our healing garden. Open to patients, family, and staff. Refreshments provided.', 60, 'Healing Garden', 50),
(2, 'Sound Bath', 'Immersive sound experience with singing bowls, chimes, and gentle tones. Deeply relaxing for body and mind.', 40, 'Meditation Room 105', 12);

-- Technology (category_id = 3)
INSERT INTO programs (category_id, title, description, duration_mins, location, capacity) VALUES
(3, 'Virtual Reality Experience', 'Escape to peaceful places through immersive VR - visit beaches, forests, mountains, and world landmarks.', 45, 'Tech Room 110', 1),
(3, 'VR Guided Meditation', 'Short calming VR session focused on breathing and relaxation. Great for stress relief.', 20, 'Your Room', 1),
(3, 'PlayStation Rental - 2 Hours', 'Rent a PlayStation console with games to play in your room. Variety of games available.', 120, 'Your Room', 1),
(3, 'PlayStation Rental - Full Day', 'Full day PlayStation rental for extended gaming enjoyment.', 480, 'Your Room', 1),
(3, 'Tablet Exploration', 'Borrow a tablet pre-loaded with games, books, movies, and relaxation apps.', 240, 'Your Room', 1);

-- Animal Therapy (category_id = 4)
INSERT INTO programs (category_id, title, description, duration_mins, location, capacity) VALUES
(4, 'Dog Therapy Visit', 'Spend time with a trained therapy dog for comfort and companionship. Our dogs love gentle pets and quiet company.', 25, 'Your Room or Garden', 3),
(4, 'Pet Therapy - Small Animals', 'Meet gentle rabbits or cats with our therapy animal team. Calm and soothing for all ages.', 20, 'Therapy Room 102', 2);

-- Spiritual Care (category_id = 5)
INSERT INTO programs (category_id, title, description, duration_mins, location, capacity) VALUES
(5, 'Bible Reading & Reflection', 'Scripture reading and discussion with our chaplain. Individual or small group sessions available.', 30, 'Chapel or Your Room', 6),
(5, 'Buddhist Meditation & Scriptures', 'Guided meditation and teaching from Buddhist traditions. Open to all experience levels.', 30, 'Meditation Room 105', 6),
(5, 'Interfaith Chaplain Visit', 'One-on-one spiritual support for any faith or belief. Our chaplain is here to listen and support you.', 30, 'Your Room', 1),
(5, 'Guided Meditation - Secular', 'Mindfulness meditation session with no religious content. Focus on breathing, relaxation, and present moment.', 25, 'Meditation Room 105', 10);


-- Art Therapy Programs
UPDATE programs SET image_url = '/img/programs/Coloring_Art_Books.png' WHERE title = 'Coloring & Art Books';
UPDATE programs SET image_url = '/img/programs/Watercolor_Painting_Class.png' WHERE title = 'Watercolor Painting Class';
UPDATE programs SET image_url = '/img/programs/Oil_Painting_Class.png' WHERE title = 'Oil Painting Class';
UPDATE programs SET image_url = '/img/programs/Craft_Workshop.png' WHERE title = 'Craft Workshop';

-- Music Therapy Programs
UPDATE programs SET image_url = '/img/programs/Bedside_Guitar.png' WHERE title = 'Bedside Guitar';
UPDATE programs SET image_url = '/img/programs/Bedside_Harp.png' WHERE title = 'Bedside Harp';
UPDATE programs SET image_url = '/img/programs/Live_Music_in_the_Garden.png' WHERE title = 'Live Music in the Garden';
UPDATE programs SET image_url = '/img/programs/Sound_Bath.png' WHERE title = 'Sound Bath';

-- Technology Programs
UPDATE programs SET image_url = '/img/programs/Virtual_Reality_Experience.png' WHERE title = 'Virtual Reality Experience';
UPDATE programs SET image_url = '/img/programs/VR_Guided_Meditation.png' WHERE title = 'VR Guided Meditation';
UPDATE programs SET image_url = '/img/programs/PlayStation_Rental_2_Hours.png' WHERE title = 'PlayStation Rental - 2 Hours';
UPDATE programs SET image_url = '/img/programs/PlayStation_Rental_Full_Day.png' WHERE title = 'PlayStation Rental - Full Day';
UPDATE programs SET image_url = '/img/programs/Tablet_Exploration.png' WHERE title = 'Tablet Exploration';

-- Animal Therapy Programs
UPDATE programs SET image_url = '/img/programs/Dog_Therapy_Visit.png' WHERE title = 'Dog Therapy Visit';
UPDATE programs SET image_url = '/img/programs/Pet_Therapy_Small_Animals.png' WHERE title = 'Pet Therapy - Small Animals';

-- Spiritual Care Programs
UPDATE programs SET image_url = '/img/programs/Bible_Reading_Reflection.png' WHERE title = 'Bible Reading & Reflection';
UPDATE programs SET image_url = '/img/programs/Buddhist_Meditation_Scriptures.png' WHERE title = 'Buddhist Meditation & Scriptures';
UPDATE programs SET image_url = '/img/programs/Interfaith_Chaplain_Visit.png' WHERE title = 'Interfaith Chaplain Visit';
UPDATE programs SET image_url = '/img/programs/Guided_Meditation_Secular.png' WHERE title = 'Guided Meditation - Secular';


-- Insert a patient
INSERT INTO users (email, password_hash, first_name, last_name, birthday, room_number, phone) 
VALUES (
    'john.smith@email.com',
    '$2b$10$hashedpasswordhere',
    'John',
    'Smith',
    '1985-06-20',
    '302A',
    '555-123-4567'
);

-- All passwords are: password123
INSERT INTO users (email, password_hash, first_name, last_name, birthday, room_number, phone, role) VALUES
('john.smith@email.com', '$2b$10$YOUR_HASH_HERE', 'John', 'Smith', '1985-06-20', '302A', '555-123-4567', 'patient'),
('maria.garcia@email.com', '$2b$10$YOUR_HASH_HERE', 'Maria', 'Garcia', '1990-03-15', '415B', '555-234-5678', 'patient'),
('david.lee@email.com', '$2b$10$YOUR_HASH_HERE', 'David', 'Lee', '1978-11-08', '210C', '555-345-6789', 'patient'),
('sarah.johnson@email.com', '$2b$10$YOUR_HASH_HERE', 'Sarah', 'Johnson', '1995-07-22', '508A', '555-456-7890', 'patient'),
('michael.brown@email.com', '$2b$10$YOUR_HASH_HERE', 'Michael', 'Brown', '1982-01-30', '103B', '555-567-8901', 'patient'),
('emily.davis@email.com', '$2b$10$YOUR_HASH_HERE', 'Emily', 'Davis', '1988-09-12', '607C', '555-678-9012', 'patient'),
('james.wilson@email.com', '$2b$10$YOUR_HASH_HERE', 'James', 'Wilson', '1972-04-05', '401A', '555-789-0123', 'patient'),
('lisa.martinez@email.com', '$2b$10$YOUR_HASH_HERE', 'Lisa', 'Martinez', '1998-12-18', '205B', '555-890-1234', 'patient'),
('robert.taylor@email.com', '$2b$10$YOUR_HASH_HERE', 'Robert', 'Taylor', '1965-08-25', '312C', '555-901-2345', 'patient'),
('jennifer.anderson@email.com', '$2b$10$YOUR_HASH_HERE', 'Jennifer', 'Anderson', '1992-02-14', '509A', '555-012-3456', 'patient'),
('admin@healspace.com', '$2b$10$YOUR_HASH_HERE', 'Admin', 'User', NULL, NULL, '555-000-0000', 'admin');

-- Insert an admin (no room number or birthday needed)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES (
    'admin@healspace.com',
    '$2b$10$hashedpasswordhere',
    'Sarah',
    'Johnson',
    'admin'
);


-- =============================================
-- PROGRAM SCHEDULES (Recurring availability)
-- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
-- =============================================

-- Art Therapy: Coloring & Art Books (id=1) — Mon-Fri, pickup style, long window
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins, max_per_slot) VALUES
(1, 1, '09:00', '16:00', 60, 20),
(1, 2, '09:00', '16:00', 60, 20),
(1, 3, '09:00', '16:00', 60, 20),
(1, 4, '09:00', '16:00', 60, 20),
(1, 5, '09:00', '16:00', 60, 20);

-- Watercolor Painting Class (id=2) — Mon & Wed, 10am-3pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(2, 1, '10:00', '15:00', 45),
(2, 3, '10:00', '15:00', 45);

-- Oil Painting Class (id=3) — Tue & Thu, 10am-4pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(3, 2, '10:00', '16:00', 60),
(3, 4, '10:00', '16:00', 60);

-- Craft Workshop (id=4) — Wed & Fri, 1pm-4pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(4, 3, '13:00', '16:00', 45),
(4, 5, '13:00', '16:00', 45);

-- Bedside Guitar (id=5) — Mon, Wed, Fri 9am-5pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(5, 1, '09:00', '17:00', 25),
(5, 3, '09:00', '17:00', 25),
(5, 5, '09:00', '17:00', 25);

-- Bedside Harp (id=6) — Tue & Thu 10am-4pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(6, 2, '10:00', '16:00', 25),
(6, 4, '10:00', '16:00', 25);

-- Live Music in the Garden (id=7) — Sat only, 2pm-4pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(7, 6, '14:00', '16:00', 60);

-- Sound Bath (id=8) — Mon & Thu, 11am-3pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(8, 1, '11:00', '15:00', 40),
(8, 4, '11:00', '15:00', 40);

-- Virtual Reality Experience (id=9) — Mon-Fri, 10am-5pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(9, 1, '10:00', '17:00', 45),
(9, 2, '10:00', '17:00', 45),
(9, 3, '10:00', '17:00', 45),
(9, 4, '10:00', '17:00', 45),
(9, 5, '10:00', '17:00', 45);

-- VR Guided Meditation (id=10) — Wed & Fri, 9am-3pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(10, 3, '09:00', '15:00', 20),
(10, 5, '09:00', '15:00', 20);

-- PlayStation Rental 2hr (id=11) — Mon-Sat, 10am-6pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(11, 1, '10:00', '18:00', 120),
(11, 2, '10:00', '18:00', 120),
(11, 3, '10:00', '18:00', 120),
(11, 4, '10:00', '18:00', 120),
(11, 5, '10:00', '18:00', 120),
(11, 6, '10:00', '18:00', 120);

-- PlayStation Rental Full Day (id=12) — Mon-Sat, 9am-5pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(12, 1, '09:00', '17:00', 480),
(12, 2, '09:00', '17:00', 480),
(12, 3, '09:00', '17:00', 480),
(12, 4, '09:00', '17:00', 480),
(12, 5, '09:00', '17:00', 480),
(12, 6, '09:00', '17:00', 480);

-- Tablet Exploration (id=13) — Mon-Fri, 9am-5pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(13, 1, '09:00', '17:00', 240),
(13, 2, '09:00', '17:00', 240),
(13, 3, '09:00', '17:00', 240),
(13, 4, '09:00', '17:00', 240),
(13, 5, '09:00', '17:00', 240);

-- Dog Therapy Visit (id=14) — Tue, Thu, Sat 10am-3pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(14, 2, '10:00', '15:00', 25),
(14, 4, '10:00', '15:00', 25),
(14, 6, '10:00', '15:00', 25);

-- Pet Therapy Small Animals (id=15) — Mon & Wed, 11am-2pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(15, 1, '11:00', '14:00', 20),
(15, 3, '11:00', '14:00', 20);

-- Bible Reading & Reflection (id=16) — Sun & Wed, 10am-12pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(16, 0, '10:00', '12:00', 30),
(16, 3, '10:00', '12:00', 30);

-- Buddhist Meditation & Scriptures (id=17) — Tue & Fri, 9am-11am
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(17, 2, '09:00', '11:00', 30),
(17, 5, '09:00', '11:00', 30);

-- Interfaith Chaplain Visit (id=18) — Mon-Fri, 10am-4pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(18, 1, '10:00', '16:00', 30),
(18, 2, '10:00', '16:00', 30),
(18, 3, '10:00', '16:00', 30),
(18, 4, '10:00', '16:00', 30),
(18, 5, '10:00', '16:00', 30);

-- Guided Meditation - Secular (id=19) — Mon, Wed, Fri 10am-2pm
INSERT INTO program_schedules (program_id, day_of_week, start_time, end_time, slot_duration_mins) VALUES
(19, 1, '10:00', '14:00', 25),
(19, 3, '10:00', '14:00', 25),
(19, 5, '10:00', '14:00', 25);