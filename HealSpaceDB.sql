-- =============================================
-- HealSpace Database Schema
-- =============================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Categories (Art, Music, Tech, etc.)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Patients and Staff)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('patient', 'admin') DEFAULT 'patient',
    room_number VARCHAR(20),
    phone VARCHAR(20),
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

-- Time Slots (When programs are offered)
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
INSERT INTO categories (name, description, icon) VALUES
('Art Therapy', 'Creative expression through painting, drawing, and crafts', 'palette'),
('Music Therapy', 'Healing through live music and sound experiences', 'music'),
('Technology', 'Explore virtual reality, gaming, and digital relaxation', 'laptop'),
('Animal Therapy', 'Comfort and joy through trained therapy animals', 'paw-print'),
('Spiritual Care', 'Reflection, meditation, and spiritual support for all beliefs', 'sun');

-- Sample Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, role, room_number) VALUES
('patient@example.com', '$2b$10$examplehashhere', 'John', 'Smith', 'patient', '302A'),
('patient2@example.com', '$2b$10$examplehashhere', 'Maria', 'Garcia', 'patient', '415B'),
('admin@healspace.com', '$2b$10$examplehashhere', 'Sarah', 'Johnson', 'admin', NULL);

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
(3, 'VR Guided Meditation', 'Short calming VR session focused on breathing and relaxation. Great for stress relief.', 20, 'Tech Room 110', 1),
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

-- Sample Time Slots (for next 7 days)
INSERT INTO time_slots (program_id, date, start_time, end_time, spots_available) VALUES
-- Watercolor Painting Class (program_id = 2)
(2, CURDATE() + INTERVAL 1 DAY, '10:00:00', '10:45:00', 10),
(2, CURDATE() + INTERVAL 3 DAY, '10:00:00', '10:45:00', 10),
(2, CURDATE() + INTERVAL 5 DAY, '14:00:00', '14:45:00', 10),

-- Oil Painting Class (program_id = 3)
(3, CURDATE() + INTERVAL 2 DAY, '14:00:00', '15:00:00', 8),
(3, CURDATE() + INTERVAL 4 DAY, '14:00:00', '15:00:00', 8),

-- Bedside Guitar (program_id = 5)
(5, CURDATE() + INTERVAL 1 DAY, '09:00:00', '09:25:00', 1),
(5, CURDATE() + INTERVAL 1 DAY, '09:30:00', '09:55:00', 1),
(5, CURDATE() + INTERVAL 1 DAY, '10:00:00', '10:25:00', 1),
(5, CURDATE() + INTERVAL 2 DAY, '09:00:00', '09:25:00', 1),
(5, CURDATE() + INTERVAL 2 DAY, '09:30:00', '09:55:00', 1),

-- Live Music in the Garden (program_id = 7)
(7, CURDATE() + INTERVAL 3 DAY, '15:00:00', '16:00:00', 50),
(7, CURDATE() + INTERVAL 6 DAY, '15:00:00', '16:00:00', 50),

-- Sound Bath (program_id = 8)
(8, CURDATE() + INTERVAL 2 DAY, '11:00:00', '11:40:00', 12),
(8, CURDATE() + INTERVAL 4 DAY, '11:00:00', '11:40:00', 12),

-- VR Experience (program_id = 9)
(9, CURDATE() + INTERVAL 1 DAY, '13:00:00', '13:45:00', 1),
(9, CURDATE() + INTERVAL 1 DAY, '14:00:00', '14:45:00', 1),
(9, CURDATE() + INTERVAL 2 DAY, '13:00:00', '13:45:00', 1),
(9, CURDATE() + INTERVAL 2 DAY, '14:00:00', '14:45:00', 1),

-- Dog Therapy (program_id = 14)
(14, CURDATE() + INTERVAL 1 DAY, '10:00:00', '10:25:00', 3),
(14, CURDATE() + INTERVAL 1 DAY, '10:30:00', '10:55:00', 3),
(14, CURDATE() + INTERVAL 3 DAY, '10:00:00', '10:25:00', 3),
(14, CURDATE() + INTERVAL 3 DAY, '10:30:00', '10:55:00', 3),

-- Guided Meditation - Secular (program_id = 18)
(18, CURDATE() + INTERVAL 1 DAY, '08:00:00', '08:25:00', 10),
(18, CURDATE() + INTERVAL 2 DAY, '08:00:00', '08:25:00', 10),
(18, CURDATE() + INTERVAL 3 DAY, '08:00:00', '08:25:00', 10);

-- Sample Bookings
INSERT INTO bookings (user_id, time_slot_id, status, notes) VALUES
(1, 1, 'booked', 'First time trying painting'),
(1, 6, 'booked', 'Would love some Beatles songs'),
(2, 11, 'booked', 'Bringing my daughter'),
(2, 17, 'booked', NULL);