import express from 'express';
import mysql from 'mysql2/promise';


const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));
//setting up database connection pool
const pool = mysql.createPool({
host: "qbct6vwi8q648mrn.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
user: "jeubnm1ele0b5f5g",
password: "jh1fhfpl7oaz9uux",
database: "msgoo9ohn1qrcckb",
connectionLimit: 10,
waitForConnections: true
});
//routes
app.get('/', (req, res) => {
res.send('Hello Express app!')
});
app.get("/dbTest", async(req, res) => {
try {
const [rows] = await pool.query("SELECT CURDATE()");
res.send(rows);
} catch (err) {
console.error("Database error:", err);
res.status(500).send("Database error");
}
});//dbTest
app.listen(3000, ()=>{
console.log("Express server running")
})