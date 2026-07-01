import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary if credentials exist
let isCloudinaryConfigured = false;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
} else {
  console.log('📷 Cloudinary credentials not configured. Uploaded images will be saved locally in public/uploads.');
}

interface IUploadResult {
  url: string;
  publicId?: string;
}

export const uploadImage = async (
  fileBuffer: Buffer,
  originalName: string,
  folder = 'fittrack'
): Promise<IUploadResult> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed with no result'));
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // Fallback: Write file locally
    try {
      const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const extension = path.extname(originalName) || '.jpg';
      const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${extension}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, fileBuffer);

      // Return a URL that matches our local static host route
      const relativeUrl = `/uploads/${uniqueFilename}`;
      return {
        url: relativeUrl,
        publicId: uniqueFilename, // store filename as local reference ID
      };
    } catch (error) {
      console.error('❌ Local file write error:', error);
      throw error;
    }
  }
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`❌ Failed to delete image from Cloudinary (${publicId}):`, error);
    }
  } else {
    // Delete local file
    try {
      const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`❌ Failed to delete local image (${publicId}):`, error);
    }
  }
};
