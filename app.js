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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
  const db = await mongoose.connect('mongodb+srv://admin-mauricio:'+process.env.MONGO_KEY+'@cluster0.bdhma.mongodb.net/userDB');
  //const db = await mongoose.connect('mongodb://localhost:27017/userDB')
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://agile-plateau-45628.herokuapp.com/auth/google/secrets",
    scope: [ 'profile' ],
    state: true
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        console.log(user);
        return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://agile-plateau-45628.herokuapp.com/auth/facebook/secrets",
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            console.log(user);
            return cb(err, user);
        });
    }
));

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

app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  (req, res) => {
    res.redirect('/secrets');
  });

app.get('/auth/facebook', passport.authenticate('facebook',(req,res) => {
    console.log("Facebook Login");
}));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
    (req, res) => {
        res.redirect('/secrets');
    });

app.route('/secrets')
.get((req,res) => {
    User.find({"secret":{$ne:null}},(err, usersFound) => {
        if(!err) {
            if(usersFound) {
                res.render("secrets", {usersWithSecrets: usersFound})
            } else {
                console.log(err);
                res.redirect('/')
            }
        } else {
            console.log(err);
            res.redirect('/secrets')
        }
    })
});

app.route('/submit')
.get((req,res) => {
    if(req.isAuthenticated()) {
        res.render("submit")
    } else {
        console.log("not autenticated");
        res.redirect('/login')
    }
})
.post((req,res) => {
    const submittedSecret = req.body.secret;
    console.log(req.user);
    User.findById(req.user, (err, userFound) => {
        if(!err) {
            if(userFound) {
                userFound.secret=submittedSecret;
                userFound.save((err) => {
                    if(!err) {
                        setTimeout(() => {res.redirect('/secrets')},80)
                    } else {
                        console.log(err);
                        res.redirect('/secrets')
                    }
                })
            } else {
                console.log('User not found');
                res.redirect('/login')
            }
        } else {
            console.log(err);
            res.redirect('/secrets')
        }
    })
})



app.listen(port, function() {
    console.log("Server started on port 3000");
  });