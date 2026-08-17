import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import codeReviewRoutes from "./routes/codeReviewRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import careerCoachRoutes from "./routes/careerCoachRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import { getDashboardData } from "./controllers/interviewController.js";
import { protectRoute } from "./middleware/protectRoute.js";

const app = express();

const __dirname = path.resolve();

// middleware
app.use(express.json());
// credentials:true meaning?? => server allows a browser to include cookies on request
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/code", codeReviewRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/career-roadmap", careerCoachRoutes);
app.use("/api/rag", ragRoutes);

app.get("/api/dashboard", protectRoute, getDashboardData);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
