require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
var md5 = require("md5");

const app = express();

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Create Connection to Database
const db = mysql.createConnection({
    host: "database-1.cpvlonshkac1.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: "dpl_test_db"
});

db.connect(err=>{
    if(err){
        console.log(err.message);
        return;
    }
    console.log("Database connected.")
})

// Create Database
// app.get("/createdb", function(req,res){
//     let sql = "CREATE DATABASE dplUsers"
//     db.query(sql, err => {
//         if(err) {
//             throw err;
//         }
//         res.send("Database Created")
//     })
// });

// Create Table
// app.get("/createtable", function(req, res){
//     let sql = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, fName VARCHAR(100), lName VARCHAR(100), email VARCHAR(255))";
//     db.query(sql, err => {
//         if(err) {
//             console.log(err.message)
//         }
//         res.send("User Table Created")
//     })
// });

// Alter Table
// db.connect(function(err) {
//     const sql = "ALTER TABLE users ADD COLUMN interest VARCHAR(35)";
//     db.query(sql, function(err, result) {
//         if(err) throw err;
//         console.log("Table Altered")
//     })
// });

app.get("/", function(req, res){
    res.render("index");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);
    const sql = `SELECT * FROM users WHERE email = '${username}'` 

    db.query(sql, function (err, result) {
        if (err) throw err;
        const user = result[0]
        if (user && user['password'] === password) {
            res.render("success", {name: user['fName'], signup: "Login"})
        }
        else {
            console.log(`Incorrect Username or Password, ${password} and ${user['password']}`)
        }
    })
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    const post = {
        fName: req.body.fName, 
        lName: req.body.lName, 
        email: req.body.username,
        password: md5(req.body.password),
        interest: req.body.dropdown
    };
    const sql = "INSERT INTO users SET ?";
    let query = db.query(sql, post, (err) => {
        if(err) {
            throw err;
        }
        console.log(post)
        res.render("success", {name: req.body.fName, signup: "Registration"})
    })
});

app.get("/users", function(req, res) {
    db.query("SELECT * FROM users", (err, result, fields) => {
        if (err) throw err;
        console.log(result);
    });
});

app.get("/createpost", function(req, res) {
    res.render("createpost")
});

app.listen(3000, function(req, res){
    console.log("Server started on port 3000.");
});