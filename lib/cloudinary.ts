import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param folder - Cloudinary folder (e.g., 'profiles', 'events', 'media')
 * @param publicId - Optional custom public ID
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `family-tree/${folder}`,
        public_id: publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as { secure_url: string; public_id: string });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
