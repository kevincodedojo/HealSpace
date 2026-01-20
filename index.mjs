import "dotenv/config";
import express from 'express';
import mysql from 'mysql2/promise';


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