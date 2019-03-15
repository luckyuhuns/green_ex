var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var request = require("request");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require("cloudinary");

require('../handlers/cloudinary')
const upload = require('../handlers/multer')



 //GOOGLE API CONFIGURATION
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);

//INDEX ROUTE
    router.get("/", function(req, res) {
        var noMatch = null;
        if(req.query.search){
            var regex = new RegExp(escapeRegex(req.query.search), "gi");
            //Get all campgrounds from database
            Campground.find({name: regex}, function(err, allCampgrounds) {
                if(err){
                    console.log(err);
                }else{
                    if(allCampgrounds.length < 1){
                        noMatch = "No site match your search, please try again";
                    }
                    res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch})
                }
            })
        }else {
            //Get all campground from database
            Campground.find({}, function(err, allCampgrounds) {
                if(err){
                    console.log(err)
                }else {
                    res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch})
                }
            });
        }
    });


//CREATE - add new campground to DB
    router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res) {
        //upload image to cloudinary
        var result = await cloudinary.v2.uploader.upload(req.file.path);
        console.log(result);
            geocoder.geocode(req.body.location, function (err, data){
                if(err || !data.length){
                  req.flash('error', 'Invalid address');
                  return res.redirect('back');
                }
              // add cloudinary url for the image to the campground object under image property
              req.body.campground.image = result.secure_url;
              req.body.campground.imageId = result.public_id;
              //add author to campground
              req.body.campground.author = {
                  id: req.user._id,
                  username: req.user.username
              }
                //add lat, lng and location to campground          
                req.body.campground.lat = data[0].latitude;
                req.body.campground.lng = data[0].longitude;
                req.body.campground.location = data[0].formattedAddress;
                // Create a new campground and save to DB
                Campground.create(req.body.campground, function(err, newlyCreated){
                    if (err) {
                      req.flash('error', err.message);
                      return res.redirect('back');
                    }
                    res.redirect('/campgrounds/');
                });
        });
    });

//NEW ROUTE - SHOW FORM TO CREATE NEW CAMPGROUND
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new.ejs")
})



// SHOW Route - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                 req.flash("error", "Campground not found");
                 res.redirect("/campgrounds");
            }
                res.render("campgrounds/edit", {campground: foundCampground});
        });
});


//UPDATE CAMPGROUND ROUTE
router.put("/:id", upload.single("image"), function(req, res){
    //geocode location
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
                 return res.redirect('back');
        }
            //find ID of unedited campground
            Campground.findById(req.params.id, async function(err, campground) {
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                }else{
                    if(req.file){
                        try{
                                //check if there is an existing image, then destroy if there is
                                await cloudinary.v2.uploader.destroy(campground.imageId);
                                //upload new image to replace old one
                                var result = await cloudinary.v2.uploader.upload(req.file.path);
                                campground.image = result.secure_url;
                                campground.imageId = result.public_id;
                        } catch(err){
                            req.flash("error", err.message);
                            console.log(err);
                            return res.redirect("back");
                        }
                    }
                   //add lat, lng and location to campground
                    campground.lat = data[0].latitude;
                    campground.lng = data[0].longitude;
                    campground.location = data[0].formattedAddress;
                    
                    //set edited values for other  variables
                    campground.name = req.body.campground.name;
                    campground.price = req.body.campground.price;
                    campground.description = req.body.campground.description;
                    campground.save();
                    req.flash("success", "You've Successfully Updated your Site");
                    res.redirect("/campgrounds/" + campground._id);
                }
            })
                          
               
    });
    
 
})

// DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
       Campground.findById(req.params.id, async function(err, campground){
           if(err){
              req.flash("error", err.message);
              console.log(err);
              return res.redirect("back");
           } try{
                //check if there is an existing image, then destroy if there is
                await cloudinary.v2.uploader.destroy(campground.imageId);
                campground.remove();
                req.flash("success", "Sight deleted successfully")
                res.redirect("/campgrounds");
            } catch(err){
                    if(err){
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                            
                }
       });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;