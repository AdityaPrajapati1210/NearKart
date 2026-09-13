const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg") {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG images are allowed"));
        }
    }
});

module.exports = upload;