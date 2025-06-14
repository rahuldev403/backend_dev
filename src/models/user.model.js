import mongoose, { Schema } from "mongoose";
// `jsonwebtoken` is used to generate signed tokens for authentication.
import jwt from "jsonwebtoken";
// `bcrypt` is used for securely hashing passwords.
import bcrypt from "bcrypt";

// --- SCHEMA DEFINITION ---
// This is the structure of the User document.
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true, // Removes whitespace from both ends.
      index: true, // Creates a database index on this field for faster searches.
    },
    email: {
      type: String,
      required: true,
      unique: true, // FIX: Ensures no two users can share the same email.
      trim: true,
    },
    // FIX: Added the fullName field which was missing.
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // URL from Cloudinary.
      required: true,
    },
    coverImage: {
      type: String, // URL from Cloudinary.
    },
    watchHistory: [
      {
        // This field is an array of ObjectIds, creating a relationship.
        type: Schema.Types.ObjectId,
        // Each ID in this array refers to a document in the "Video" collection.
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  // The `timestamps` option automatically adds `createdAt` and `updatedAt` fields.
  { timestamps: true }
);

// --- MIDDLEWARE / HOOKS ---
// The `.pre()` hook runs middleware before a specified event. Here, it runs before "save".
userSchema.pre("save", async function (next) {
  // This check ensures that we only hash the password if it has been modified.
  // This prevents the password from being re-hashed every time the user updates their profile (e.g., changing their avatar).
  if (!this.isModified("password")) {
    return next();
  }

  // Hashes the plain-text password with a salt round of 10.
  this.password = await bcrypt.hash(this.password, 10);
  next(); // Passes control to the next middleware or the save operation.
});

// --- CUSTOM METHODS ---
// The `.methods` object allows us to add our own functions ("instance methods") to the schema.
// These methods will be available on every document created from this model.

// Method to check if the password provided by the user is correct.
userSchema.methods.isPasswordCorrect = async function (password) {
  // `bcrypt.compare` securely compares the plain-text password with the stored hashed password.
  // It returns `true` if they match, and `false` otherwise.
  return await bcrypt.compare(password, this.password);
};

// Method to generate a short-lived Access Token.
userSchema.methods.generateAccessToken = function () {
  // `jwt.sign` creates a token.
  return jwt.sign(
    {
      // This is the "payload" or the data we want to store in the token.
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    // The secret key is used to sign the token, ensuring its integrity.
    process.env.ACCESS_TOKEN_SECRET,
    {
      // Sets an expiration date for the token.
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate a long-lived Refresh Token.
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      // The refresh token typically has less information in its payload.
      // Its only job is to securely identify the user to issue a new access token.
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// --- MODEL EXPORT ---
// The schema is compiled into a model, which is a class that we can use
// to create, read, update, and delete documents in the "users" collection.
export const User = mongoose.model("User", userSchema);