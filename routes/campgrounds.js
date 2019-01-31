var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// INDEX ROUTE - retrieve campgrounds from database 
router.get("/", function(req, res){
  
        Campground.find(function(err, allCampgrounds){
        if(err) return console.error(err);
        
        res.render("campgrounds/index", {campgrounds:allCampgrounds});
    });
});

//CREATE ROUTE - ADD NEW CAMPGROUND TO DB
router.post("/", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newCampground = {name: name, price: price, image: image, description: description, author: author};
    
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            req.flash("success", "Successfully added a campground");
            res.redirect("/campgrounds");
        }
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
            res.redirect("back");
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        Campground.findById(req.params.id, function(err, foundCampground){
            
                res.render("campgrounds/edit", {campground: foundCampground});
        });
});
//UPDATE ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/ campground");
        }else {
            req.flash("success", "Successfully updated "+updatedCampground.name)
            res.redirect("/campgrounds/"+req.params.id)
        }
    })
})

// DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
       Campground.findByIdAndRemove(req.params.id, function(err){
           if(err){
               res.redirect("/campgrounds");
           }else {
               res.redirect("/campgrounds");
           }
       });
});




module.exports = router;