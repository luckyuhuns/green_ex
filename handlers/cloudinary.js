

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'luckyuhuns119', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});