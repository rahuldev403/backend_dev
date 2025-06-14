import { asyncHandeler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../models/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

/**
 * @description Generates JWT access and refresh tokens for a given user.
 * @param {string} userId - The ID of the user for whom to generate tokens.
 * @returns {object} An object containing the accessToken and refreshToken.
 */
const generateAccessAndReferenceTokens = async (userId) => {
  try {
    // Step 1: Find the user in the database by their ID.
    // BUG FIX: The original code was missing `const user = ...`
    const user = await User.findById(userId);

    // Step 2: Generate new tokens using methods defined in the User model.
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Step 3: Save the new refresh token to the user's record in the database.
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Saving without validation to avoid password hashing again.

    return { accessToken, refreshToken };
  } catch (error) {
    // If anything goes wrong, throw a server error.
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// --- CONTROLLER FOR USER REGISTRATION ---
const registerUser = asyncHandeler(async (req, res) => {
  // Step 1: Get user details from the request body.
  const { fullName, email, username, password } = req.body;

  // Step 2: Validate that none of the essential fields are empty.
  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Check if a user with the same username or email already exists.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Step 4: Get local file paths for avatar and cover image from the request (sent via multer).
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Step 5: Upload the avatar and (if it exists) the cover image to Cloudinary.
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  if (!avatar) {
    throw new ApiError(500, "Error uploading avatar, please try again");
  }

  // Step 6: Create the new user object and save it to the database.
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password, // The password will be hashed by the pre-save hook in the User model.
    username: username.toLowerCase(),
  });

  // Step 7: Retrieve the created user from the database without the password and refresh token fields.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Step 8: Send a successful response back to the client.
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// --- CONTROLLER FOR USER LOGIN ---
const loginUser = asyncHandeler(async (req, res) => {
  // Step 1: Get either username or email, plus the password from the request body.
  const { email, username, password } = req.body;

  // Step 2: Validate that either a username or an email is provided.
  // BUG FIX: The original logic was flawed. This checks if both are missing.
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // Step 3: Find the user in the database by their username or email.
  // BUG FIX: The original code was missing `await` and `const user = ...`
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 4: Check if the provided password is correct using the method defined in the User model.
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Step 5: Generate new access and refresh tokens for the now-validated user.
  const { accessToken, refreshToken } = await generateAccessAndReferenceTokens(
    user._id
  );

  // Step 6: Get the user's data again, excluding sensitive fields.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 7: Set options for the cookies.
  const options = {
    httpOnly: true, // The cookie cannot be accessed by client-side scripts.
    secure: true, // The cookie will only be sent over HTTPS.
  };

  // Step 8: Send the tokens as secure cookies and the user data in the JSON response.
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// --- CONTROLLER FOR USER LOGOUT ---
const logOutUser = asyncHandeler(async (req, res) => {
  // Step 1: Find the user by their ID (provided by the `auth` middleware) and remove their refresh token.
  await User.findByIdAndUpdate(
    req.user._id, // The logged-in user's ID, attached to the request by the auth middleware.
    {
      $set: {
        refreshToken: undefined, // Invalidate the refresh token.
      },
    },
    {
      new: true, // Return the updated document.
    }
  );

  // Step 2: Define options for clearing cookies.
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Step 3: Clear the accessToken and refreshToken cookies from the user's browser.
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandeler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorised request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh-token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndReferenceTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          accessToken,
          { refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

// Export all controller functions, including refreshAccessToken
export { registerUser, loginUser, logOutUser, refreshAccessToken };
