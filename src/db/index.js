import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    //console.log("monogdb conected at:", connectionInstance);
    console.log(
      `\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("mongodb connection error : ", error);
    process.exit(1);
  }
};

export default connectDb;

//import express from "express";

// const app = express()(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODV_URI}${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("error:", error);
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`db connected at http://localhost:${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// })();
