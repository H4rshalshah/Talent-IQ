import { requireAuth } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

// If the Clerk -> Inngest webhook isn't configured (common in local dev), a
// newly signed-in user has no record in MongoDB yet. This fallback provisions
// the user from the Clerk API on first request so the app works out of the box.
async function provisionUserFromClerk(clerkId) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) {
      console.warn("⚠️ Clerk user fetch failed:", response.status);
      return null;
    }

    const data = await response.json();
    const email = data.email_addresses?.[0]?.email_address || `${clerkId}@clerk.local`;
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Candidate";

    const user = await User.create({
      clerkId,
      email,
      name,
      profileImage: data.image_url || "",
    });

    // keep Stream in sync so video calls work immediately
    try {
      await upsertStreamUser({ id: clerkId, name, image: data.image_url || "" });
    } catch (error) {
      console.warn("⚠️ Stream user upsert failed during provisioning:", error.message);
    }

    return user;
  } catch (error) {
    console.warn("⚠️ Could not provision user from Clerk:", error.message);
    return null;
  }
}

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await User.findOne({ clerkId });

      // auto-provision when the sync webhook hasn't run yet
      if (!user) {
        user = await provisionUserFromClerk(clerkId);
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
