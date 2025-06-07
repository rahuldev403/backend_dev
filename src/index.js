import "dotenv/config";
import connectDb from "./db/index.js";
import { app } from "./app.js";

const port = process.env.PORT || 8000;
connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log("server is running at port:", port);
    });
    app.on("error", (error) => {
      console.log("mongodeb connection error:", error);
    });
  })
  .catch((error) => {
    console.log("mongodb connection error:", error);
  });
