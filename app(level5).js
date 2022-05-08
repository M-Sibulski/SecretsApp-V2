require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
app.set('view engine', 'ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.use(bodyParser.urlencoded({extended: true}));
const port = process.env.PORT || 3000;
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));

async function main() {
  //const db = await mongoose.connect('mongodb+srv://admin-mauricio:+process.env.MONGO_KEY+@cluster0.bdhma.mongodb.net/blogPostsDB');
  const db = await mongoose.connect('mongodb://localhost:27017/userDB')
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true},
    password: {
        type: String}
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req,res) => {
    res.render("home");
});

app.route('/login')
.get((req,res) => {
    res.render('login');
})
.post(passport.authenticate("local",{
    successRedirect: "/secrets",
    failureRedirect: "/login"
}), (req, res) => {
    
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.route('/register')
.get((req,res) => {
    res.render('register');
})
.post((req,res) => {
    User.register(new User ({username: req.body.username}), req.body.password, (err,user) => {
        if(!err) {
            //const authenticate = User.authenticate('local');
            passport.authenticate('local')(req, res, (err) => {
                if(!err) {
                    res.redirect('/secrets')
                } else {
                    console.log("Autenticate error:");
                    console.log(err);
                    res.redirect('/register')
                }
            })
        } else {
            console.log("Register error:");
            console.log(err);
            res.redirect('/register')
        }
    })
})

app.route('/secrets')
.get((req,res) => {
    if(req.isAuthenticated()) {
        res.render("secrets")
    } else {
        console.log("not autenticated");
        res.redirect('/login')
    }
});

app.listen(port, function() {
    console.log("Server started on port 3000");
  });