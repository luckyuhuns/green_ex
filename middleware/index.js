var Campground = require("../models/campground");
var Comment = require("../models/comment");
// all middleware goes here
var middlewareObject = {};

middlewareObject.checkCampgroundOwnership = function(req, res, next){
     if(req.isAuthenticated()){
        //find the campground id
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found")
                res.redirect("back");
            }else {
                 //does user own campground(compare author id to user id)
                 if(foundCampground.author.id.equals(req.user._id) || foundCampground.isAdmin){
                      next();
                 }else {
                     req.flash("error", "You do not have permission to do that")
                     res.redirect("back");
                 }
            }
        });
    }else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("back");
    }
}

middlewareObject.checkCommentOwnership = function(req, res, next){
     if(req.isAuthenticated()){
        //find the comment id
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Oops, something went wrong, comment not found");
                res.redirect("back");
            }else {
                 //does user own comment(compare author id to user id)
                 if(foundComment.author.id.equals(req.user._id)){
                      next();
                 }else {
                     req.flash("error", "You do not have permissionto do that");
                     res.redirect("back");
                 }
            }
        });
    }else {
        req.flash("error", "You have to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObject.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = middlewareObject