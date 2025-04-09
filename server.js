require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
 host: process.env.DB_HOST,
 user: process.env.DB_USER,
 password: process.env.DB_PASSWORD,
 database: process.env.DB_NAME,
});

db.connect((err) => {
 if (err) throw err;
 console.log("MySQL Connected");
});
// Create Users Table
/*
db.query(
    `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
    )`,
    (err) => {
    if (err) throw err;
    console.log("Users table created");
    }
   );
   // Create Todos Table
db.query(
    `CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
    if (err) throw err;
    console.log("Todos table created");
    }
   );
*/
   // kayıt olma api'si (endpoint) (post isteği bekliyor)
   app.post("/signup", async (req, res) => {
      // request içersinden verilerimizi aldık name,email,password
    const { name, email, password } = req.body;
     // kontrol ediyoruz veriler eksikmi veya tamammı diye (validation)
    if (!name || !email || !password) {
       return res.status(400).json({ message: "Please enter all fields" });
    }
    // password hash'ledik
    const hashedPassword = await bcrypt.hash(password, 10);
    // database kayıt işlemimiz yapıyorz
    db.query(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    (err, result) => {
      if (err) {
         // hata olursa geri dönüş yapar
         console.error(err);
         res.status(500).json({ message: "An error occurred" });
      } else {
         // herşey tamamsa aşağıdaki mesaj döner
         res.status(201).json({ message: "User created" });
      }
    });
   });
   // giriş api'miz (post isteği bekliyor)
    app.post("/login", (req, res) => {
       // request içersinden verilerimizi aldık email,password
        const { email, password } = req.body;

        // kontrol ediyoruz veriler eksikmi veya tamammı diye (validation)
        if (!email || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
        }
        // email ait olan kullanıcı mecutmu
        db.query(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, results) => {
        if (err) {
         // query çalışırken herhangi bihatada buraya düşer
            console.error(err);
           res.status(500).json({ message: "An error occurred" });
        } else if (results.length === 0) {
         // result 0 dönerse demekki bizim veri tabanında böyle bi kullanıcı yok
           res.status(401).json({ message: "Invalid credentials" });
        } else {
            // array döenecek oununda 0 index olanı alacayık
            const user = results[0];
            // şireyi hash'leyerek kıyaslıyor
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
            // eğer hash uyuşursa   
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
            // 
            db.query(
               'UPDATE users SET tokken = ? WHERE id = ?',
               [token, user.id],
               (err, result) => {
                  if (err) {
                     console.error(err);
                     res.status(500).json({ message: "An error occurred" });
                  } else {
                     console.log("Token updated successfully");
                  }
               }
            )
            res.status(200).json({ token });
            } else {
            // şifre uyuşmazsa
            res.status(401).json({ message: "Invalid credentials" });
            }
            }
        }
        );
       }
    );

   const PORT = 5000;
   app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
   });
   