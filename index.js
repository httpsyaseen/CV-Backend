import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import cvRouter from "./routes/cvRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import adminRouter from "./routes/adminRouter.js";
import morgan from "morgan";
import cors from "cors";
import { globalError } from "./controller/errorController.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(cors());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Backend is Working fine...");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/cv", cvRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/admin", adminRouter);

app.use(globalError);

mongoose
  .connect(process.env.CLOUD_DB)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
