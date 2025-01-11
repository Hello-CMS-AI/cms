// controllers/imageController.js

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const sanitize = require('sanitize-filename');
const Image = require('../models/image'); 

// Define allowed MIME types
const allowedMimeTypes = [
  'image/jpeg','image/png','image/gif','image/webp',
  'video/mp4','video/x-msvideo','video/quicktime','video/x-ms-wmv','video/x-flv','video/x-matroska',
  'audio/mpeg','audio/wav','audio/aac','audio/ogg','audio/flac',
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

// Helper to determine media type
const getMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'text/plain'
  ) {
    return 'document';
  }
  return null; 
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: Images, Videos, Audio, Documents.'));
    }
  },
});

// Helper: generate thumbnail filename
function generateThumbnailFilename(originalFileName, width, height) {
  const ext = path.extname(originalFileName);
  const base = path.basename(originalFileName, ext);
  return `${base}-${width}x${height}${ext}`;
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Unsupported file type.' });
    }

    // Build subfolders (YYYY/MM/DD/hhmmss)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const shortTimestamp = `${hour}${minute}${second}`;

    const finalFolder = path.join(__dirname, '../uploads', year.toString(), month, day);
    fs.mkdirSync(finalFolder, { recursive: true });

    // If original file was "1690123456789-my image.png", extract "my image.png"
    const splittedFilename = req.file.filename.split('-');
    let originalFileName;
    if (splittedFilename.length > 1) {
      originalFileName = splittedFilename.slice(1).join('-');
    } else {
      originalFileName = splittedFilename[0];
    }

    const rawExtension = originalFileName.split('.').pop() || '';
    let mainNamePart = originalFileName
      .replace(`.${rawExtension}`, '')
      .trim()          // Keep if you want to remove leading/trailing spaces from the physical file name
      .replace(/\s+/g, '-')  // Convert internal spaces to hyphens for the physical name
      .replace(/[^a-zA-Z0-9-_]/g, '');

    const mediaType = getMediaType(req.file.mimetype);
    if (!mediaType) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Unsupported media type.' });
    }

    // If it's an image => we'll convert to webp
    let finalExt = rawExtension.toLowerCase();
    if (mediaType === 'image') {
      finalExt = 'webp';
    }

    const finalFileName = `${shortTimestamp}-${mainNamePart}.${finalExt}`;
    const newFilePath = path.join(finalFolder, finalFileName);

    // Move or convert file
    const oldFilePath = path.join(__dirname, '../uploads', req.file.filename);

    if (mediaType === 'image') {
      try {
        await sharp(oldFilePath)
          .toFormat('webp')
          .webp({ quality: 60 })
          .toFile(newFilePath);

        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Error converting image:', err);
        fs.renameSync(oldFilePath, newFilePath);
      }
    } else {
      // Non-image => rename
      fs.renameSync(oldFilePath, newFilePath);
    }

    // e.g. "/uploads/2024/07/22/093641-my-image.webp"
    const relativePath = path.join('/', 'uploads', year.toString(), month, day, finalFileName).replace(/\\/g, '/');

    // Attempt dimension gathering if image/video
    let dimensions = 'Unknown';
    if (req.file.mimetype.startsWith('image/') || req.file.mimetype.startsWith('video/')) {
      try {
        const meta = await sharp(newFilePath).metadata();
        dimensions = `${meta.width}x${meta.height}`;
      } catch (err) {
        console.warn('Could not retrieve dimensions:', err.message);
      }
    }

    // Generate thumbnails if image
    const thumbnailSizes = [
      { width: 500, height: 300 },
      { width: 800, height: 450 },
    ];
    const thumbnails = [];

    if (mediaType === 'image') {
      for (const size of thumbnailSizes) {
        const thumbFileName = generateThumbnailFilename(finalFileName, size.width, size.height);
        const thumbFilePath = path.join(finalFolder, thumbFileName);

        try {
          await sharp(newFilePath)
            .resize(size.width, size.height, { fit: 'cover' })
            .toFormat('webp')
            .webp({ quality: 60 })
            .toFile(thumbFilePath);

          thumbnails.push({
            size: `${size.width}x${size.height}`,
            url: path.join('/', 'uploads', year.toString(), month, day, thumbFileName).replace(/\\/g, '/'),
          });
        } catch (thumbErr) {
          console.error(`Thumbnail generation failed for ${size.width}x${size.height}:`, thumbErr);
        }
      }
    }

    // If image => get compressed size
    let finalFileSize = req.file.size;
    if (mediaType === 'image') {
      try {
        const stats = fs.statSync(newFilePath);
        finalFileSize = stats.size; 
      } catch (fsErr) {
        console.error('Error reading file size:', fsErr);
      }
    }

    // Save to DB
    const imageDoc = new Image({
      name: mainNamePart,
      url: relativePath,
      size: finalFileSize,
      format: mediaType === 'image' ? 'webp' : rawExtension.toLowerCase(),
      dimensions,
      type: mediaType,
    });
    const savedImage = await imageDoc.save();

    res.status(200).json({
      message: 'File uploaded successfully!',
      imagePath: relativePath,
      imageDetails: {
        id: savedImage._id.toString(),
        name: savedImage.name,
        size: savedImage.size,
        dimensions: savedImage.dimensions,
        format: savedImage.format,
        type: savedImage.type,
        url: savedImage.url,
        createdAt: savedImage.createdAt,
        altText: savedImage.altText,
        caption: savedImage.caption,
        description: savedImage.description,
        // If you have "title" in your schema, you can optionally return it:
        // title: savedImage.title,
      },
      thumbnails,
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({ message: 'Failed to upload file.' });
  }
}

// Fetch Image Library
async function getImages(req, res) {
  try {
    // Make sure we include "title" if your schema has it
    const images = await Image.find({})
      .sort({ createdAt: -1 })
      .select('name url size dimensions format type createdAt altText caption description title')
      .lean()
      .exec();

    const imagesWithId = images.map(img => ({
      id: img._id.toString(),
      ...img,
    }));

    res.status(200).json({ images: imagesWithId });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Failed to fetch images.' });
  }
}

// Delete Image
async function deleteImage(req, res) {
  const imageName = req.params.imageName || req.params[0]; 
  if (!imageName) {
    return res.status(400).json({ message: 'No image name provided.' });
  }

  const imagePath = path.join(__dirname, '../uploads', imageName);

  try {
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found.' });
    }

    fs.unlinkSync(imagePath);

    const dbUrl = `/${path.join('uploads', imageName).replace(/\\/g, '/')}`;
    const deletedImage = await Image.findOneAndDelete({ url: dbUrl });

    if (!deletedImage) {
      return res.status(404).json({ message: 'Image metadata not found in the database.' });
    }

    // If it was an image, also remove thumbnails
    if (deletedImage.type === 'image') {
      const thumbnailSizes = [
        { width: 500, height: 300 },
        { width: 800, height: 450 },
      ];
      const directory = path.dirname(imageName);
      const mainFileName = path.basename(imageName);

      for (const size of thumbnailSizes) {
        const thumbFileName = generateThumbnailFilename(mainFileName, size.width, size.height);
        const thumbFilePath = path.join(__dirname, '../uploads', directory, thumbFileName);

        if (fs.existsSync(thumbFilePath)) {
          fs.unlinkSync(thumbFilePath);
        }
      }
    }

    return res.status(200).json({
      message: 'Image and its metadata deleted successfully (thumbnails removed if any).'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ message: 'Failed to delete image.' });
  }
}

// Update Image Details (Auto-Save)
async function updateImageDetails(req, res) {
  const imageId = req.params.imageId;
  const { title, altText, caption, description } = req.body;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found.' });
    }

    // Remove the .trim() calls to preserve user-typed spaces
    if (title !== undefined) {
      image.title = title; 
    }
    if (altText !== undefined) {
      image.altText = altText;
    }
    if (caption !== undefined) {
      image.caption = caption;
    }
    if (description !== undefined) {
      image.description = description;
    }

    await image.save();

    res.status(200).json({
      message: 'Image details updated successfully.',
      imageDetails: {
        id: image._id.toString(),
        name: image.name,
        title: image.title,
        altText: image.altText,
        caption: image.caption,
        description: image.description,
        url: image.url,
        size: image.size,
        dimensions: image.dimensions,
        format: image.format,
        type: image.type,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating image details:', error);
    res.status(500).json({ message: 'Failed to update image details.' });
  }
}

module.exports = {
  upload,
  uploadImage,
  getImages,
  deleteImage,
  updateImageDetails,
  allowedMimeTypes,
  getMediaType,
};
