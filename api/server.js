const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const cookieParser = require('cookie-parser');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();

// Path to the JSON file storing image metadata
const IMAGES_FILE_PATH = path.join(__dirname, 'images.json');

// Load image data from JSON file
const loadImageData = async () => {
  try {
    const data = await fs.readFile(IMAGES_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // Return an empty array if the file doesn't exist
    }
    throw error;
  }
};

// Save image data to JSON file
const saveImageData = async (data) => {
  await fs.writeFile(IMAGES_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// Update CORS configuration
const allowedOrigins = [
  'https://image-gallery-git-main-spyridons-projects.vercel.app',
  'https://image-gallery-nu-opal.vercel.app'
];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

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
  console.log('Request Cookies:', req.cookies); // Debug statement to log all cookies
  console.log('Admin Token:', token); // Debug statement
  if (token === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    console.log('Unauthorized access'); // Debug statement
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

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
    console.log('Login successful, cookie set:', process.env.ADMIN_PASSWORD); // Debug statement
    return res.status(200).json({ success: true, message: 'Login successful' });
  } else {
    console.log('Incorrect password'); // Debug statement
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

    console.log('Upload Params:', uploadParams); // Debug statement to log upload parameters

    await s3Client.send(new PutObjectCommand(uploadParams));
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Get existing images data
    const images = await loadImageData();

    // Add new image details
    const newImage = {
      src: imageUrl,
      title: req.body.title,
      date: req.body.date,
      location: req.body.location,
      description: req.body.description,
      photographer: 'Piotr Kluk'
    };
    images.unshift(newImage);

    // Save updated images data
    await saveImageData(images);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

// List images route
app.get('/api/images', async (req, res) => {
  try {
    const images = await loadImageData();
    res.status(200).json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Error listing images' });
  }
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
