const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(cookieParser());

// S3 client setup
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer setup for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (token === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login route
app.post('/api/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required' });
    }

    if (password === process.env.ADMIN_PASSWORD) {
        res.cookie('adminToken', process.env.ADMIN_PASSWORD, { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour
        });
        return res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        return res.status(401).json({ success: false, error: 'Incorrect password' });
    }
});

// Upload route
app.post('/api/upload', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname}`;

        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// For local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
