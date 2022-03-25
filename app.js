require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");
var md5 = require("md5");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("connect-flash")

let error = null
const d = new Date();
const month = d.getMonth() + 1;
const day = d.getDate()
const year = d.getFullYear()
const app = express();

app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

passport.use(
    "local-login",
    new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password",
            passReqToCallback: true
        },
        function(req, username, password, done) {
            db.query(`SELECT * FROM users WHERE email = '${username}'`, function(err, rows){
                if(err) return done(err);
                if(!rows.length) {
                    return done(
                        null,
                        false,
                        req.flash("loginMessage", "No user found.")
                    );
                }
                password = md5(password)
                if(!(rows[0].password == password)) {
                    return done(
                        null,
                        false,
                        req.flash("loginMessage", "Oops! Wrong password.")
                    );
                }
                return done(null, rows[0])
            })
        }
    )
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    db.query(`SELECT * FROM users where id = ${id}`, function(
        err,
        rows
    ) {
        done(err, rows[0]);
    });
});

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

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
app.get("/createtable", function(req, res){
    let sql = "CREATE TABLE posts (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(120), subtitle VARCHAR(100), content VARCHAR(5000), date VARCHAR(9), userID int, FOREIGN KEY (userID) REFERENCES users(id))";
    db.query(sql, err => {
        if(err) {
            console.log(err.message)
        }
        res.send("posts Table Created")
    })
});

// Alter Table
// db.connect(function(err) {
//     const sql = "ALTER TABLE posts ADD COLUMN date VARCHAR(9)";
//     db.query(sql, function(err, result) {
//         if(err) throw err;
//         console.log("Table Altered")
//     })
// });

// Delete Users
// db.connect(function(err) {
//     const sql = "DELETE FROM users"
//     db.query(sql, function(err, result) {
//         if (err) throw err;
//         console.log("Users Deleted")
//     })
// });

app.get("/", function(req, res){
    res.render("index", {user: req.user});
});

app.get("/login", function(req, res){
    if (req.user) {
        res.redirect(`/${req.user['id']}`)
    } else {
        res.render("login", {error: error, user: null});
    }
    
});

app.post("/login", passport.authenticate('local-login', {failureRedirect: "/login", failureFlash: true}),
    function(req, res) {
        res.redirect(`/${req.user['id']}`)
});

app.get("/register", function(req, res){
    res.render("register", {error: error, user: req.user});
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
            res.render("register", {error: err.message, user: req.user});
        }
        res.render("success", {name: req.body.fName, signup: "Registration", user: req.user})
    })
});

app.get("/createpost", function(req, res) {
    if (req.user) {
        res.render("createpost", {user: req.user})
    } else {
        res.redirect("/login")
    }
    
});

app.post("/createpost", function(req, res){
    if(req.user) {
        const post = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            content: req.body.content,
            date: `${month}/${day}/${year}`,
            userId: req.user['id']
        }
        const sql = "INSERT INTO posts SET ?"
        let query = db.query(sql, post, (err) => {
            if (err) throw err;
            res.redirect(`/${req.user['id']}`);
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/:userID", function(req, res){
    if (req.user) {
        let posts_result = []
        const sql = `SELECT * FROM posts WHERE userID = '${req.user['id']}'`
         const user_posts = db.query(sql, (err, result) => {
            if (err) throw err;
            posts_result = result
            res.render("success", {name: req.user['fName'], signup: "Login", user: req.user, posts: posts_result});
         }); 
    }  
});

app.get("/deletepost/:userID", function(req, res){
    const postID = req.params.userID;
    const sql = `DELETE FROM posts where id = '${postID}'`;
    db.query(sql, function(err) {
        if (err) throw err;
        res.redirect(`/${req.user['id']}`)
    })
});

app.get("/post/:postTitle", function(req, res) {
    title = req.params.postTitle.replace('-', ' ');
    const sql = `SELECT * FROM posts WHERE title = '${title}'`;

    db.query(sql, (err, results) => {
        if (err) throw err;
        postInfo = results[0];
        const user = `SELECT fName, lName FROM users WHERE id = '${postInfo['userID']}'`;
        db.query(user, (err, result) => {
            if (err) throw err;
            const name = result[0]['fName'] + " " + result[0]['lName']
            res.render("post", {user: req.user, post: postInfo, author: name})
        })
    });
});

app.get("/logout", function(req, res){
    req.logOut();
    req.user = null;
    res.redirect("/");
});

app.listen(3000, function(req, res){
    console.log("Server started on port 3000.");
});