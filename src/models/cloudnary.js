// Import the official Cloudinary SDK for Node.js. We use `v2` and alias it as `cloudinary`.
import { v2 as cloudinary } from "cloudinary";
// Import the built-in Node.js File System module. We need this to interact with files on our server's disk.
import fs from "fs";

// --- CONFIGURATION ---
// This configures the Cloudinary SDK with your account credentials.
// It's crucial that these values are kept secret and loaded from environment variables (`.env` file).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


/**
 * @description Uploads a file from a local path to Cloudinary and deletes the local file.
 * @param {string} localFilePath The full path of the file on the local server to be uploaded.
 * @returns {object | null} The response object from Cloudinary on success, or null on failure.
 */
const uploadOnCloudinary = async (localFilePath) => {
  // Use a try-catch block to gracefully handle any errors that might occur during the upload.
  try {
    // Step 1: Check if a valid local file path was provided. If not, return null.
    if (!localFilePath) return null;

    // Step 2: Upload the file to Cloudinary.
    // `cloudinary.uploader.upload` is the core function that does the work.
    // `resource_type: "auto"` tells Cloudinary to automatically detect the file type (image, video, etc.).
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Step 3: If the upload is successful, a response object is returned.
    // We log the public URL of the uploaded file for debugging purposes.
    console.log("File uploaded to Cloudinary successfully:", response.url);
    
    // Step 4: After a successful upload, delete the temporary file from the local server.
    // `fs.unlinkSync` synchronously removes the file. This is important to save disk space.
    fs.unlinkSync(localFilePath);
    
    // Step 5: Return the response object from Cloudinary, which contains the URL and other file metadata.
    return response;

  } catch (error) {
    // If any part of the `try` block fails (e.g., network error, invalid path), this `catch` block will execute.
    
    // Attempt to delete the locally saved temporary file even if the upload failed.
    // This ensures that we don't leave junk files on our server.
    fs.unlinkSync(localFilePath); 
    
    // Log the error to the console for debugging.
    console.error("Error during Cloudinary upload:", error);
    
    // Return null to indicate that the upload process failed.
    return null;
  }
};

// Export the function so it can be used in other parts of our application (like the user controller).
export { uploadOnCloudinary };