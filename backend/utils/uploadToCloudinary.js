const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const uploadToCloudinary = (buffer, originalname = "image.jpg") => {
    return new Promise((resolve) => {
        const isCloudinaryConfigured =
            Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET);

        const saveLocally = () => {
            try {
                const uploadsDir = path.join(__dirname, "../public/uploads");
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                const ext = path.extname(originalname) || ".jpg";
                const filename = `prod_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
                const filepath = path.join(uploadsDir, filename);
                fs.writeFileSync(filepath, buffer);
                resolve({
                    secure_url: `/uploads/${filename}`,
                    public_id: `local_${filename}`
                });
            } catch (err) {
                console.warn("Local storage fallback error, using data URI:", err.message);
                const base64 = buffer.toString("base64");
                resolve({
                    secure_url: `data:image/jpeg;base64,${base64}`,
                    public_id: `data_${Date.now()}`
                });
            }
        };

        if (isCloudinaryConfigured) {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "nearkart/products"
                },
                (error, result) => {
                    if (error) {
                        console.warn("Cloudinary upload failed, saving to local uploads folder:", error.message);
                        saveLocally();
                    } else {
                        resolve(result);
                    }
                }
            );

            stream.end(buffer);
            return;
        }

        // If Cloudinary is not configured in .env, save locally to public/uploads
        saveLocally();
    });
};

module.exports = uploadToCloudinary;