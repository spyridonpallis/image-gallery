const express = require('express');
const cors = require('cors');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const app = express();

app.use(cors({
    origin: '*', // For testing. Replace with your specific origins in production.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// AWS S3 configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for S3 upload
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});

// Test route
app.get('/api/upload', (req, res) => {
    res.json({ message: "Upload endpoint is working. Please use POST to upload files." });
});

// File upload route
app.post('/api/upload', upload.single('image'), (req, res) => {
    console.log('Received upload request');
    if (req.file) {
        console.log('File uploaded successfully:', req.file.location);
        res.json({ imageUrl: req.file.location });
    } else {
        console.log('No file received');
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('An error occurred:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});