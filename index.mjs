import "dotenv/config";
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from "express-session";


const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));


//setting up database connection pool
const pool = mysql.createPool({
host: process.env.DB_HOST || "localhost",
user: process.env.DB_USER || "root",
password: process.env.DB_PASSWORD || "",
database: process.env.DB_NAME || "healspace",
connectionLimit: 10,
waitForConnections: true
});

//session setting
app.set('trust proxy', 1);
app.use(session({
    secret: "change-this-to-something-secure",
    resave: false,              
    saveUninitialized: false,   
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// ============================================
// MIDDLEWARE - Make user available to ALL pages
// ============================================
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Authentication check function
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.returnTo = req.originalUrl; // Remember where they wanted to go
        res.redirect("/login");
    }
}

// ============================================
// PUBLIC ROUTES (No login required)
// ============================================

// Home - Categories Page
app.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query("SELECT * FROM categories");
        res.render('index', { categories });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Programs Page - All Programs
app.get('/programs', async (req, res) => {
    try {
        const [programs] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM programs p 
            JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = TRUE 
            ORDER BY p.title
        `);
        res.render('programs', { programs, categoryName: 'All Programs' });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Programs by Category
app.get('/programs/category/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Get category info
        const [categories] = await pool.query("SELECT * FROM categories WHERE id = ?", [categoryId]);
        
        if (categories.length === 0) {
            return res.status(404).send("Category not found");
        }
        
        const category = categories[0];
        
        // Get programs in this category
        const [programs] = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM programs p 
            JOIN categories c ON p.category_id = c.id 
            WHERE p.category_id = ? AND p.is_active = TRUE 
            ORDER BY p.title
        `, [categoryId]);
        
        res.render('programs', { programs, categoryName: category.name });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});


// Bookings info (redirects to my-bookings if logged in)
app.get('/bookings', (req, res) => {
    if (req.session.user) {
        res.redirect('/my-bookings');
    } else {
        res.render('bookings'); // Show "please login" message
    }
});

// ============================================
// AUTH ROUTES
// ============================================


// Bookings Page (placeholder for now)
// app.get('/bookings', (req, res) => {
//     res.render('bookings');
// });

// Login Page
// app.get('/login', (req, res) => {
//     res.render('login');
// });

// Login Page
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/my-bookings'); // Already logged in
    }
    const error = req.query.error || null;
    res.render('login', { error });
});

// Login Submit
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.redirect("/login?error=Invalid email or password");
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            // Store user info in session (NOT password!)
            req.session.user = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            };
            
            // Redirect to where they wanted to go, or my-bookings
            const returnTo = req.session.returnTo || '/my-bookings';
            delete req.session.returnTo;
            res.redirect(returnTo);
        } else {
            res.redirect("/login?error=Invalid email or password");
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


//login route
// app.post('/login', async (req, res) => {
//     // 1. Get data from request
//     const email = req.body.email;
//     const password = req.body.password;

//     try {
//         // 2. Look for the user in the database
//         const sql = `SELECT * FROM users WHERE email = ?`;
//         const [rows] = await pool.query(sql, [email]);

//         // 3. Check if user exists
//         if (rows.length === 0) {
//             // No user found with that email
//             return res.redirect("/login?error=usernotfound");
//         }

//         // 4. User exists, now get the hash from the database
//         const passwordHash = rows[0].password_hash;

//         // 5. Compare the provided password with the stored hash
//         // This will now only run if passwordHash is NOT empty
//         const match = await bcrypt.compare(password, passwordHash);

//         if (match) {
//             // Success!
//             req.session.authenticated = true;
//             res.render('welcome');
//         } else {
//             // Password didn't match
//             res.redirect("/login?error=invalidpassword");
//         }

//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Internal Server Error");
//     }
// });

// Register Page
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/my-bookings');
    }
    const error = req.query.error || null;
    res.render('register', { error });
});

// Register Submit
// app.post('/register', async (req, res) => {
//     const { first_name, last_name, email, birthday, room_number, password, password_confirm } = req.body;

//     try {
//         if (password !== password_confirm) {
//             return res.redirect("/register?error=Passwords don't match");
//         }

//         const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
//         if (existing.length > 0) {
//             return res.redirect("/register?error=Email already registered");
//         }

//         const password_hash = await bcrypt.hash(password, 10);

//         await pool.query(`
//             INSERT INTO users (email, password_hash, first_name, last_name, birthday, room_number)
//             VALUES (?, ?, ?, ?, ?, ?)
//         `, [email, password_hash, first_name, last_name, birthday || null, room_number || null]);

//         res.redirect('/login?success=Account created! Please login.');

//     } catch (err) {
//         console.error("Registration error:", err);
//         res.redirect("/register?error=Registration failed");
//     }
// });


// Register Submit - redirect to success page
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, birthday, room_number, password, password_confirm } = req.body;

    try {
        if (password !== password_confirm) {
            return res.redirect("/register?error=Passwords don't match");
        }

        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.redirect("/register?error=Email already registered");
        }

        const password_hash = await bcrypt.hash(password, 10);

        const birthdayValue = birthday && birthday.trim() !== '' ? birthday : null;
        const roomValue = room_number && room_number.trim() !== '' ? room_number : null;

        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, birthday, room_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [email, password_hash, first_name, last_name, birthdayValue, roomValue]);

        // Redirect to success page instead of login
        res.redirect('/register-success');

    } catch (err) {
        console.error("Registration error:", err.message);
        res.redirect(`/register?error=${encodeURIComponent(err.message)}`);
    }
});

// Registration Success Page
app.get('/register-success', (req, res) => {
    res.render('register-success');
});


// My Profile - GET
app.get('/my-profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
        
        // Get success/error from query params
        const success = req.query.success || null;
        const error = req.query.error || null;
        
        res.render('my-profile', { profile: users[0], success, error });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).send("Database error");
    }
});

// My Profile - POST (Update)
app.post('/my-profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { first_name, last_name, birthday, room_number, phone } = req.body;
        
        const birthdayValue = birthday && birthday.trim() !== '' ? birthday : null;
        const roomValue = room_number && room_number.trim() !== '' ? room_number : null;
        const phoneValue = phone && phone.trim() !== '' ? phone : null;
        
        await pool.query(`
            UPDATE users 
            SET first_name = ?, last_name = ?, birthday = ?, room_number = ?, phone = ?
            WHERE id = ?
        `, [first_name, last_name, birthdayValue, roomValue, phoneValue, userId]);
        
        // Update session
        req.session.user.first_name = first_name;
        req.session.user.last_name = last_name;
        
        // Redirect with success message
        res.redirect('/my-profile?success=Profile updated successfully');
        
    } catch (err) {
        console.error("Update error:", err);
        res.redirect('/my-profile?error=Failed to update profile');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});


// //myProfile route
// app.get('/myProfile', isAuthenticated ,(req, res) => {
//     if(req.session.authenticated){
//         res.render("profile")
//     }else{
//         res.redirect("/");
//     }
    
// })

// //Authentication function for login
// function isAuthenticated(req,res,next) {
//     if (!req.session.authenticated) {
//         return res.redirect("/");
//     } else {
//         next();
//     }
// }

// //logging out
// app.get('/logout', isAuthenticated,(req, res) => {
//     req.session.destroy();
//     res.redirect("/");
// });


// ============================================
// TIME SLOT GENERATION (from program_schedules)
// ============================================

/**
 * Generate time_slots for a program for the next 3 weeks
 * based on its program_schedules entries.
 * Skips dates that already have slots to avoid duplicates.
 */
async function generateTimeSlotsForProgram(programId) {
    // Get the program's schedules
    const [schedules] = await pool.query(
        `SELECT ps.*, p.capacity as program_capacity
         FROM program_schedules ps
         JOIN programs p ON ps.program_id = p.id
         WHERE ps.program_id = ? AND ps.is_active = TRUE`,
        [programId]
    );

    if (schedules.length === 0) return;

    // Generate for next 21 days (3 weeks) starting from tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset <= 21; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        const dayOfWeek = date.getDay(); // 0=Sun ... 6=Sat
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        // Find schedules that match this day of week
        const matchingSchedules = schedules.filter(s => s.day_of_week === dayOfWeek);

        for (const schedule of matchingSchedules) {
            // Check if slots already exist for this program + date
            const [existing] = await pool.query(
                `SELECT COUNT(*) as cnt FROM time_slots WHERE program_id = ? AND date = ?`,
                [programId, dateStr]
            );
            if (existing[0].cnt > 0) continue;

            // Generate individual time slots from start_time to end_time
            const capacity = schedule.max_per_slot > 0
                ? schedule.max_per_slot
                : schedule.program_capacity;

            const startParts = schedule.start_time.split(':');
            const endParts = schedule.end_time.split(':');
            let startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            const slotDuration = schedule.slot_duration_mins;

            while (startMins + slotDuration <= endMins) {
                const slotStart = `${String(Math.floor(startMins / 60)).padStart(2, '0')}:${String(startMins % 60).padStart(2, '0')}:00`;
                const slotEndMin = startMins + slotDuration;
                const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}:00`;

                await pool.query(
                    `INSERT INTO time_slots (program_id, date, start_time, end_time, spots_available)
                     VALUES (?, ?, ?, ?, ?)`,
                    [programId, dateStr, slotStart, slotEnd, capacity]
                );

                startMins += slotDuration;
            }
        }
    }
}

/**
 * Generate time slots for ALL active programs
 */
async function generateAllTimeSlots() {
    try {
        const [programs] = await pool.query(
            `SELECT DISTINCT program_id FROM program_schedules WHERE is_active = TRUE`
        );
        for (const p of programs) {
            await generateTimeSlotsForProgram(p.program_id);
        }
        console.log(`Time slots generated for ${programs.length} programs`);
    } catch (err) {
        console.error("Error generating time slots:", err.message);
    }
}

// Generate time slots on server startup
generateAllTimeSlots();

// ============================================
// PROTECTED ROUTES (Login required)
// ============================================

// My Bookings
app.get('/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [bookings] = await pool.query(`
            SELECT b.*, p.title as program_title, p.location, p.duration_mins,
                   p.image_url as program_image,
                   ts.date, ts.start_time, ts.end_time
            FROM bookings b
            JOIN time_slots ts ON b.time_slot_id = ts.id
            JOIN programs p ON ts.program_id = p.id
            WHERE b.user_id = ?
            ORDER BY ts.date ASC, ts.start_time ASC
        `, [userId]);

        const success = req.query.success || null;
        const error = req.query.error || null;

        res.render('my-bookings', { bookings, success, error });
    } catch (err) {
        console.error("Bookings error:", err.message);

        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.render('my-bookings', { bookings: [], success: null, error: null });
        }

        res.status(500).send("Database error");
    }
});

// Cancel Booking
app.post('/cancel-booking/:id', isAuthenticated, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.session.user.id;

        // Verify the booking belongs to this user and is still booked
        const [bookings] = await pool.query(
            `SELECT b.*, ts.spots_available, ts.id as slot_id
             FROM bookings b
             JOIN time_slots ts ON b.time_slot_id = ts.id
             WHERE b.id = ? AND b.user_id = ? AND b.status = 'booked'`,
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.redirect('/my-bookings?error=Booking not found or already cancelled');
        }

        // Cancel the booking and restore the spot
        await pool.query(
            `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?`,
            [bookingId]
        );
        await pool.query(
            `UPDATE time_slots SET spots_available = spots_available + 1 WHERE id = ?`,
            [bookings[0].slot_id]
        );

        res.redirect('/my-bookings?success=Booking cancelled successfully');
    } catch (err) {
        console.error("Cancel error:", err.message);
        res.redirect('/my-bookings?error=Failed to cancel booking');
    }
});

// ============================================
// BOOKING FLOW
// ============================================

// Book a Program - Show calendar page
app.get('/book/:programId', isAuthenticated, async (req, res) => {
    try {
        const programId = req.params.programId;

        // Get program info
        const [programs] = await pool.query(
            `SELECT p.*, c.name as category_name
             FROM programs p
             JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.is_active = TRUE`,
            [programId]
        );

        if (programs.length === 0) {
            return res.status(404).send("Program not found");
        }

        const program = programs[0];

        // Ensure time slots are generated
        await generateTimeSlotsForProgram(programId);

        // Get all available dates for next 3 weeks (dates that have at least one open slot)
        const [availableDates] = await pool.query(
            `SELECT DISTINCT date
             FROM time_slots
             WHERE program_id = ?
               AND date >= CURDATE()
               AND date <= DATE_ADD(CURDATE(), INTERVAL 21 DAY)
               AND spots_available > 0
               AND is_cancelled = FALSE
             ORDER BY date`,
            [programId]
        );

        // Get schedule info for display (which days of week this program runs)
        const [schedules] = await pool.query(
            `SELECT day_of_week, start_time, end_time
             FROM program_schedules
             WHERE program_id = ? AND is_active = TRUE
             ORDER BY day_of_week`,
            [programId]
        );

        const success = req.query.success || null;
        const error = req.query.error || null;

        // Format available dates as array of date strings for the calendar
        const availableDateStrings = availableDates.map(d => {
            const dt = new Date(d.date);
            return dt.toISOString().split('T')[0];
        });

        res.render('book', {
            program,
            availableDates: availableDateStrings,
            schedules,
            success,
            error
        });
    } catch (err) {
        console.error("Book page error:", err.message);
        res.status(500).send("Database error");
    }
});

// API: Get time slots for a specific program + date (AJAX)
app.get('/api/time-slots/:programId', async (req, res) => {
    try {
        const programId = req.params.programId;
        const date = req.query.date;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const [slots] = await pool.query(
            `SELECT ts.id, ts.start_time, ts.end_time, ts.spots_available
             FROM time_slots ts
             WHERE ts.program_id = ?
               AND ts.date = ?
               AND ts.is_cancelled = FALSE
             ORDER BY ts.start_time`,
            [programId, date]
        );

        // For each slot, also get how many are booked
        const slotsWithInfo = slots.map(slot => ({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            spots_available: slot.spots_available,
            is_available: slot.spots_available > 0
        }));

        res.json({ slots: slotsWithInfo });
    } catch (err) {
        console.error("API time-slots error:", err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a Booking (POST)
app.post('/book', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { time_slot_id, program_id } = req.body;

        if (!time_slot_id || !program_id) {
            return res.redirect(`/book/${program_id || ''}?error=Please select a time slot`);
        }

        // Check the slot exists and has availability
        const [slots] = await pool.query(
            `SELECT ts.*, p.title as program_title
             FROM time_slots ts
             JOIN programs p ON ts.program_id = p.id
             WHERE ts.id = ? AND ts.program_id = ? AND ts.is_cancelled = FALSE`,
            [time_slot_id, program_id]
        );

        if (slots.length === 0) {
            return res.redirect(`/book/${program_id}?error=Time slot not found`);
        }

        const slot = slots[0];

        if (slot.spots_available <= 0) {
            return res.redirect(`/book/${program_id}?error=Sorry, this time slot is full`);
        }

        // Check if user already has a booking for this same slot
        const [existingBooking] = await pool.query(
            `SELECT id FROM bookings
             WHERE user_id = ? AND time_slot_id = ? AND status = 'booked'`,
            [userId, time_slot_id]
        );

        if (existingBooking.length > 0) {
            return res.redirect(`/book/${program_id}?error=You already have a booking for this time slot`);
        }

        // Create the booking and decrement spots
        await pool.query(
            `INSERT INTO bookings (user_id, time_slot_id, status) VALUES (?, ?, 'booked')`,
            [userId, time_slot_id]
        );
        await pool.query(
            `UPDATE time_slots SET spots_available = spots_available - 1 WHERE id = ?`,
            [time_slot_id]
        );

        res.redirect('/my-bookings?success=Booking confirmed!');
    } catch (err) {
        console.error("Booking error:", err.message);
        res.redirect(`/book/${req.body.program_id || ''}?error=Booking failed, please try again`);
    }
});


// Database Test
app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Start server
app.listen(3000, () => {
    console.log("HealSpace server running at http://localhost:3000");
});