import fs from "fs"
import { ApiError } from "./apiError.js"
import { v2 as cloudinary } from "cloudinary"

/**
 * Configure Cloudinary with credentials from environment variables.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary.
 *
 * @async
 * @function uploadToCloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload response
 */
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)

    return response
  }
  catch (error) {
    if (localFilePath && fs.existsSync(localFilePath))  fs.unlinkSync(localFilePath)
    throw new ApiError(500, error.message || "Failed to upload file on Cloudinary")
  }
}

/**
 * Delete a file from Cloudinary by public ID.
 *
 * @async
 * @function deleteFromCloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {resourceType} resourceType - The resource type of the file to delete
 * @returns {Promise<object>} Cloudinary deletion response
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null
    
    const response = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    return response
  }
  catch (error) {
    throw new ApiError(500, error.message || "Failed to delete file from Cloudinary")
  }
}
