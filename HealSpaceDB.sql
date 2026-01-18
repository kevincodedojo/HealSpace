-- =============================================
-- HealSpace Database Schema
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS healspace;
USE healspace;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS programs;

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




-- =============================================
-- SAMPLE DATA
-- =============================================

-- Categories
INSERT INTO categories (name, description) VALUES
('Art Therapy', 'Creative expression through painting, drawing, and crafts', 'palette'),
('Music Therapy', 'Healing through live music and sound experiences', 'music'),
('Technology', 'Explore virtual reality, gaming, and digital relaxation', 'laptop'),
('Animal Therapy', 'Comfort and joy through trained therapy animals', 'paw-print'),
('Spiritual Care', 'Reflection, meditation, and spiritual support for all beliefs', 'sun');


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
