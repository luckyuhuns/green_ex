var express     = require("express"), 
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy= require("passport-local"),
    methodOverride = require("method-override"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    seedDB      = require("./seeds"),
    passportLocalMongoose = require("passport-local-mongoose");

    
    //Requiring Routes
    var commentRoutes    =   require("./routes/comments"),
        campgroundRoutes =   require("./routes/campgrounds"),
        indexRoutes       =   require("./routes/index");

console.log(process.env.DATABASEURL);  
mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true });
//mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true });
//mongoose.connect("mongodb://luckyuhuns:meanduiloveu119@ds153869.mlab.com:53869/lucky_yelpcamp", { useNewUrlParser: true });


var app  = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs"); 
app.use(flash());

   
//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "hello world",
    save: false,
    saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
    

app.use(express.static(__dirname + "/public"));

app.use(methodOverride("_method"));

//seedDB();   //seed the database

//SCHEMA SETUP

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use(indexRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YELP APP SERVER RUNNING!!!")
});