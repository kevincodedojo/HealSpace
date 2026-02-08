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
// PROTECTED ROUTES (Login required)
// ============================================

// My Bookings
app.get('/my-bookings', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // For now, just render the page (we'll add real bookings later)
        const [bookings] = await pool.query(`
            SELECT b.*, p.title as program_title, p.location, p.duration_mins,
                   ts.date, ts.start_time, ts.end_time
            FROM bookings b
            JOIN time_slots ts ON b.time_slot_id = ts.id
            JOIN programs p ON ts.program_id = p.id
            WHERE b.user_id = ?
            ORDER BY ts.date DESC
        `, [userId]);
        
        res.render('my-bookings', { bookings });
    } catch (err) {
        console.error("Bookings error:", err.message);
        
        // If tables don't exist, just show empty bookings
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.render('my-bookings', { bookings: [] });
        }
        
        res.status(500).send("Database error");
    }
});

// My Profile
app.get('/my-profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
        res.render('my-profile', { profile: users[0] });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});

// Temporary debug route - DELETE LATER
app.get('/test-insert', async (req, res) => {
    try {
        const password_hash = await bcrypt.hash('test123', 10);
        
        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?)
        `, ['test@test.com', password_hash, 'Test', 'User']);
        
        res.send('✅ User created successfully!');
    } catch (err) {
        res.send(`❌ Error: ${err.message}`);
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