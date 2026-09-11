import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import Interview from "../models/Interview.js";
import { fail, ok } from "../lib/apiResponse.js";

export async function createSession(req, res) {
  try {
    const { problem, problemSlug = "", difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return fail(res, "Problem and difficulty are required", 422, "VALIDATION_ERROR");
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({ problem, problemSlug, difficulty, host: userId, callId });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    // register a human Interview record so sessions show up in interview history
    try {
      await Interview.create({
        candidate: userId,
        interviewer: null,
        type: "human",
        role: "",
        difficulty,
        duration: 30,
        status: "in_progress",
        startedAt: new Date(),
        sessionId: session._id,
      });
    } catch (error) {
      console.warn("⚠️ Could not register human interview:", error.message);
    }

    return ok(res, { session }, 201);
  } catch (error) {
    console.error("Error in createSession controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}

export async function getActiveSessions(_req, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    return ok(res, { sessions });
  } catch (error) {
    console.error("Error in getActiveSessions controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return ok(res, { sessions });
  } catch (error) {
    console.error("Error in getMyRecentSessions controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return fail(res, "Session not found", 404, "NOT_FOUND");

    return ok(res, { session });
  } catch (error) {
    console.error("Error in getSessionById controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) return fail(res, "Session not found", 404, "NOT_FOUND");

    if (session.status !== "active") {
      return fail(res, "Cannot join a completed session", 409, "SESSION_CLOSED");
    }

    if (session.host.toString() === userId.toString()) {
      return fail(res, "Host cannot join their own session as participant", 409, "ALREADY_HOST");
    }

    // check if session is already full - has a participant
    if (session.participant) return fail(res, "Session is full", 409, "SESSION_FULL");

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    return ok(res, { session });
  } catch (error) {
    console.error("Error in joinSession controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return fail(res, "Session not found", 404, "NOT_FOUND");

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return fail(res, "Only the host can end the session", 403, "FORBIDDEN");
    }

    // check if session is already completed
    if (session.status === "completed") {
      return fail(res, "Session is already completed", 409, "SESSION_CLOSED");
    }

    // Mark the session completed FIRST — the DB state change must never be
    // blocked by an external-service hiccup (bad Stream key, deleted call,
    // network error). Stream cleanup below is best-effort.
    session.status = "completed";
    await session.save();

    // best-effort: tear down the stream video call + chat channel
    try {
      const call = streamClient.video.call("default", session.callId);
      await call.delete({ hard: true });
    } catch (error) {
      console.warn("⚠️ Could not delete stream video call during end-session:", error.message);
    }
    try {
      const channel = chatClient.channel("messaging", session.callId);
      await channel.delete();
    } catch (error) {
      console.warn("⚠️ Could not delete stream chat channel during end-session:", error.message);
    }

    // mark the linked human interview as completed
    try {
      await Interview.updateMany(
        { sessionId: session._id, status: "in_progress" },
        { $set: { status: "completed", completedAt: new Date() } }
      );
    } catch (error) {
      console.warn("⚠️ Could not complete human interview record:", error.message);
    }

    return ok(res, { session, message: "Session ended successfully" });
  } catch (error) {
    console.error("Error in endSession controller:", error.message);
    return fail(res, "Internal Server Error", 500);
  }
}
