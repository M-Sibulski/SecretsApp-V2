require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
app.set('view engine', 'ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
const port = process.env.PORT || 3000;
app.use(express.static("public"));

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
        type: String,
        required: true}
});

const User = mongoose.model("User", userSchema);

app.get('/', (req,res) => {
    res.render("home");
});

app.route('/login')
.get((req,res) => {
    res.render('login');
})
.post((req,res) => {
    User.findOne({
        username:req.body.username}, 
        (err,userFound) => {
            if(!err) {
                if(userFound) {
                    bcrypt.compare(req.body.password, userFound.password, function(err, result) {
                        if(!err) {
                            if(result === true) {res.render("secrets")}
                            else {
                                console.log('Wrong password');
                                res.redirect('/login')
                            }
                        } else {
                            console.log(err);
                            res.redirect('/login')
                        }
                    });
                } else {
                    console.log('Wrong email');
                    res.redirect('/')
                }
            } else {
                console.log(err);
                res.redirect('/')
            }
    })
});

app.route('/register')
.get((req,res) => {
    res.render('register');
})
.post((req,res) => {
    User.findOne({username: req.body.username}, (err,userFound) => {
        if(!err) {
            if(userFound) {
                console.log('Email already registered');
                res.redirect('/')
            } else {
                bcrypt.hash(req.body.password, saltRounds, (err,hash) => {
                    if(!err) {
                        const newUser = new User ({
                            username: req.body.username,
                            password: hash
                        });
                        newUser.save((err) => {
                            if(!err) {
                                console.log(newUser);
                                res.render("secrets")
                            }
                            else {
                                console.log(err)
                                res.redirect('/')
                            }
                        });
                    } else {
                        console.log(err);
                        res.redirect('/')
                    }
                })
                
                
            }
        } else {console.log(err)}
    })
})

app.listen(port, function() {
    console.log("Server started on port 3000");
  });