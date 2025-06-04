import "dotenv/config";
import connectDb from "./db/index.js";
import { DB_NAME } from "./constants.js";

console.log(process.env.MONGODB_URI, DB_NAME);
connectDb();
