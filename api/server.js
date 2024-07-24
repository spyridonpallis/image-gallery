const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

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

// Test route to check authentication
app.get('/api/test', isAuthenticated, (req, res) => {
  res.status(200).json({ success: true });
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
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

// List images route
app.get('/api/images', async (req, res) => {
  try {
    const listObjectsCommand = {
      Bucket: process.env.S3_BUCKET_NAME
    };

    const data = await s3Client.send(new ListObjectsV2Command(listObjectsCommand));
    const imagePromises = data.Contents.map(async item => {
      try {
        await s3Client.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: item.Key }));
        return { url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`, key: item.Key };
      } catch (error) {
        console.error('Error fetching head object:', error);
        return null;
      }
    });

    const images = (await Promise.all(imagePromises)).filter(image => image !== null);

    res.status(200).json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Error listing images' });
  }
});

// Delete image route
app.delete('/api/images', isAuthenticated, async (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }

  const deleteParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Error deleting image' });
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
