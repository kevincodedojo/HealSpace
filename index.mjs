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
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
}))

// ============================================
// ROUTES
// ============================================

// Home - Categories Page
app.get('/', async(req, res) => {
    try {
        const [categories] = await pool.query("SELECT * FROM categories ");
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

// Bookings Page (placeholder for now)
app.get('/bookings', (req, res) => {
    res.render('bookings');
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

//login route
app.post('/login', async (req, res) => {
    // 1. Get data from request
    const email = req.body.email;
    const password = req.body.password;

    try {
        // 2. Look for the user in the database
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await pool.query(sql, [email]);

        // 3. Check if user exists
        if (rows.length === 0) {
            // No user found with that email
            return res.redirect("/login?error=usernotfound");
        }

        // 4. User exists, now get the hash from the database
        const passwordHash = rows[0].password_hash;

        // 5. Compare the provided password with the stored hash
        // This will now only run if passwordHash is NOT empty
        const match = await bcrypt.compare(password, passwordHash);

        if (match) {
            // Success!
            req.session.authenticated = true;
            res.render('welcome');
        } else {
            // Password didn't match
            res.redirect("/login?error=invalidpassword");
        }

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

//myProfile route
app.get('/myProfile', isAuthenticated ,(req, res) => {
    if(req.session.authenticated){
        res.render("profile")
    }else{
        res.redirect("/");
    }
    
})

//Authentication function for login
function isAuthenticated(req,res,next) {
    if (!req.session.authenticated) {
        return res.redirect("/");
    } else {
        next();
    }
}

//logging out
app.get('/logout', isAuthenticated,(req, res) => {
    req.session.destroy();
    res.redirect("/");
});



// Database Test
app.get("/dbTest", async(req, res) => {
try {
const [rows] = await pool.query("SELECT CURDATE()");
res.send(rows);
} catch (err) {
console.error("Database error:", err);
res.status(500).send("Database error");
}
});

// Start server
app.listen(3000, ()=>{
console.log("Express server running")
})