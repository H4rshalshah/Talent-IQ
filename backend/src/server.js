import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import Problem from "./models/Problem.js";
import { seedProblemBank } from "./services/problems/seed.service.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import codeReviewRoutes from "./routes/codeReviewRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import careerCoachRoutes from "./routes/careerCoachRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import codeforcesRoutes from "./routes/codeforcesRoutes.js";
import { syncCodeforcesProblems } from "./services/codeforces/sync.service.js";
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
app.use("/api/problems", problemRoutes);
app.use("/api/codeforces", codeforcesRoutes);

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
    // seed/refresh the curated problem bank (idempotent)
    await seedProblemBank();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));

    // If the Codeforces bank is empty at boot, populate it right away (async,
    // non-blocking) so first-time users never land on an empty bank. The lazy
    // sync in the list API covers every other case.
    try {
      const cfCount = await Problem.countDocuments({ source: "codeforces" });
      if (cfCount === 0) {
        syncCodeforcesProblems()
          .then((stats) => console.log("✅ Boot Codeforces sync:", JSON.stringify(stats)))
          .catch((error) => console.warn("⚠️ Boot Codeforces sync skipped:", error.message));
      }
    } catch (error) {
      console.warn("⚠️ Could not check problem bank at boot:", error.message);
    }

    // periodic Codeforces refresh — safe interval job; a failed fetch is logged
    // and skipped (Codeforces downtime never crashes the app). Only runs when
    // an admin email is configured so dev boot is never blocked by the network.
    if (ENV.ADMIN_EMAILS) {
      const CF_SYNC_INTERVAL_MS = 1000 * 60 * 60 * 6; // every 6 hours
      setTimeout(async () => {
        try {
          await syncCodeforcesProblems();
          console.log("✅ Periodic Codeforces sync completed");
        } catch (error) {
          console.warn("⚠️ Periodic Codeforces sync skipped:", error.message);
        }
      }, 1000 * 60 * 5); // first run 5 minutes after boot
      setInterval(async () => {
        try {
          await syncCodeforcesProblems();
          console.log("✅ Periodic Codeforces sync completed");
        } catch (error) {
          console.warn("⚠️ Periodic Codeforces sync skipped:", error.message);
        }
      }, CF_SYNC_INTERVAL_MS);
    }
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
