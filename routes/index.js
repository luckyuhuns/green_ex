var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User     = require("../models/user");
var Campground     = require("../models/campground");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var multer = require('multer');
var cloudinary = require("cloudinary");

require('../handlers/cloudinary');
const upload = require('../handlers/multer')

//LANDING PAGE ROUTE
router.get("/", function(req, res){
    res.render("landing");
});



//======================
// AUTHENTICATION ROUTES
//======================

// Register route(show sign up form)
router.get("/register", function(req, res){
    res.render("register");
});

//handle sign up logic
// router.post("/register", function(req, res){
//     var newUser = new User(
//         {
//             username: req.body.username,
//             firstName: req.body.firstName,
//             lastName: req.body.lastName,
//             email: req.body.email,
//             avatar: req.body.avatar
//         });
     
//     if(req.body.adminCode === "sector119"){
//         newUser.isAdmin= true;
//     }
//     User.register(newUser, req.body.password, function(err, user){
//         if(err){
//             req.flash("error", err.message);
//             return res.render("register");
//         }
//         passport.authenticate("local")(req, res, function(){
//             req.flash("success", "Welcome to Yelpcamp "+user.username);
//             res.redirect("/campgrounds");
//         })
//     })
// })

router.post("/register", upload.single('image'), async function(req, res) {
   var result = await cloudinary.v2.uploader.upload(req.file.path);
    var newUser = new User(
        {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            avatar: result.secure_url,
            avatarId: result.public_id
        });
     
    if(req.body.adminCode === "sector119"){
        newUser.isAdmin= true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            if(user.isAdmin){
                req.flash("success", "Welcome to Green Explorer "+user.username+", you're an administrator");
                res.redirect("/campgrounds");
            }else{
            req.flash("success", "Welcome to Green Explorer "+user.username);
            res.redirect("/campgrounds");
            }
        })
    })
})



//show login form
router.get("/login", function(req, res){
    res.render("login")
})
//handle login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res) {
})
//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged You Out");
    res.redirect("/campgrounds");
});


// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if(err){
            req.flash("error", err.message);
            return res.render("/forgot");
        }
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'greenexplorerteam@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'greenexplorerteam@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){
            req.flash("error", err.message);
            return res.render("/forgot");
        }
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){
            req.flash("error", err.message);
            return res.render("back");
        }
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
        if(err){
            req.flash("error", err.message);
            return res.render("back");
        }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
                if(err){
            req.flash("error", err.message);
            return res.render("back");
        }
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'greenexplorerteam@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'greenexplorerteam@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if(err){
            req.flash("error", err.message);
            return res.render("back");
        }
    res.redirect('/campgrounds');
  });
});



//USER PRIFILE

router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser){
      if(err){
          req.flash("error", "something went wrong");
          res.redirect("/");
      }
      Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
          if(err){
          req.flash("error", "something went wrong");
          res.redirect("/");
      }
          res.render("users/show", {user: foundUser, campgrounds:campgrounds});
      })
  })  
})

module.exports = router;