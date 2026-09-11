import { chatClient } from "../lib/stream.js";
import { fail, ok } from "../lib/apiResponse.js";

export async function getStreamToken(req, res) {
  try {
    // use clerkId for Stream (not mongodb _id) => it should match the id we
    // have in the stream dashboard
    const token = chatClient.createToken(req.user.clerkId);

    return ok(res, {
      token,
      userId: req.user.clerkId,
      userName: req.user.name,
      // the User model stores the avatar as `profileImage`
      userImage: req.user.profileImage || "",
    });
  } catch (error) {
    console.error("Error in getStreamToken controller:", error.message);
    return fail(res, "Unable to issue a video call token", 500, "STREAM_TOKEN_FAILED");
  }
}
