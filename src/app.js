import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();
app.use(cors({ origin: process.env.CROSS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// limits:The limit option in express.json() and express.urlencoded() sets the maximum size of incoming request bodies that Express will parse.

// express.json({ limit: "16kb" })
// Limits JSON payloads to 16 kilobytes. If a client sends a larger JSON body, Express will reject the request with a 413 error ("Payload Too Large").

// express.urlencoded({ extended: true, limit: "16kb" })
// Limits URL-encoded form data to 16 kilobytes.

// Purpose:
// This helps protect your server from large or malicious payloads that could cause performance issues or denial-of-service attacks.
// You can adjust the limit as needed for your application's requirements.
