import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    console.log("File uploaded to Cloudinary successfully:", response.url);
    fs.unlinkSync(localfilepath); 
    return response;
  } catch (error) {
    // This removes the locally saved temporary file if the upload operation failed
    fs.unlinkSync(localfilepath); 
    console.error("Error during Cloudinary upload:", error);
    return null;
  }
};

export { uploadOnCloudinary };
