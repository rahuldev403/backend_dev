// We need ApiError for sending standardized error responses.
import { ApiError } from "../utils/ApiError.js";
// We need asyncHandeler to wrap our async function in a try-catch block and handle errors.
import { asyncHandeler } from "../utils/asyncHandeler.js";
// We need the jwt library to verify the access token.
import jwt from "jsonwebtoken";
// We need the User model to find the user in the database based on the token's payload.
import { User } from "../models/user.model.js";

// This is the definition of our middleware.
export const verifyJWT = asyncHandeler(async (req, _res, next) => {
  try {
    // Step 1: Get the access token from the user's request.
    // It could be in the cookies OR in the "Authorization" header (common for mobile clients).
    // BUG FIX: Corrected typo "cokkies" to "cookies".
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Step 2: If no token is found in either location, the user is unauthorized.
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Step 3: Verify the token using the secret key.
    // `jwt.verify` will decode the token. If the token is invalid or expired, it will throw an error,
    // which will be caught by our `catch` block below.
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Step 4: After decoding, we get the user's ID from the token's payload (`_id`).
    // We then find the user in the database using that ID. We exclude the password and refresh token for security.
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // Step 5: If we can't find a user with that ID, it means the token is invalid.
    if (!user) {
      // This could happen if the user was deleted after the token was issued.
      throw new ApiError(401, "Invalid Access Token");
    }

    // Step 6: If everything is successful, we attach the user object to the `req` object.
    // This makes the user's data available in any subsequent middleware or the final controller.
    req.user = user;

    // Step 7: Call `next()` to pass control to the next middleware or controller in the chain.
    next();
  } catch (error) {
    // If any error occurs during the process (e.g., token expired, invalid signature),
    // we throw a standardized "Unauthorized" error.
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
