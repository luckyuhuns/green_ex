var multer = require("multer");

module.exports = multer({
  storage: multer.diskStorage({
      filename: function(req, file, callback) {
         callback(null, Date.now() + file.originalname);
       }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/jpe|jpeg|png|gif$i/)) {
      cb(new Error('File is not supported'), false)
      return
    }

    cb(null, true)
  }
})