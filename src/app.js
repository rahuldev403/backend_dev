// Import the core Express library to create and manage the server.
import express from "express";
// Import cookie-parser to handle parsing of incoming cookies.
import cookieParser from "cookie-parser";
// Import cors (Cross-Origin Resource Sharing) to control which domains can access this API.
import cors from "cors";

// Create an instance of the Express application.
export const app = express();

// --- MIDDLEWARE CONFIGURATION ---
// `app.use()` is how you apply middleware to your application.
// Middleware are functions that process the incoming request before it reaches the final route handler.

// Configure CORS to allow requests from the origin specified in your environment variables.
// `credentials: true` allows the frontend to send cookies with its requests.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // Note: CROSS_ORIGIN in your code, usually named CORS_ORIGIN
    credentials: true,
  })
);

// Configure the app to accept JSON data.
// This middleware parses incoming JSON request bodies.
// The `limit` option prevents denial-of-service attacks by restricting payload size.
app.use(express.json({ limit: "16kb" }));

// Configure the app to accept data from URL-encoded forms.
// `extended: true` allows for parsing of complex, nested objects.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Configure the app to serve static files (like images, CSS, etc.) from the "public" folder.
app.use(express.static("public"));

// Configure the cookie-parser middleware to parse cookies from the `Cookie` header
// and make them available in `req.cookies`. This is essential for authentication.
app.use(cookieParser());


// --- ROUTES CONFIGURATION ---

// Step 1: Import the router for user-related routes.
// The router file contains all the specific endpoints like /login, /register, etc.
import userRouter from "./routes/user.routes.js";

// Step 2: Mount the router onto the application.
// This tells the app: "For any request that starts with '/api/v1/users',
// hand it over to the `userRouter` to handle."
// For example, a request to `/api/v1/users/register` will be handled by the `/register`
// route defined inside `user.routes.js`.
app.use("/api/v1/users", userRouter);

// The same pattern would be used for other resources:
// app.use("/api/v1/videos", videoRouter);
// app.use("/api/v1/tweets", tweetRouter);