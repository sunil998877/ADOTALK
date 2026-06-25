import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar")
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function updatePushToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { pushToken } = req.body as { pushToken?: string };

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (typeof pushToken !== "string" || !pushToken.trim()) {
      res.status(400).json({ message: "Valid push token is required" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: pushToken.trim() },
      { new: true }
    ).select("name email avatar pushToken");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ success: true, pushToken: user.pushToken });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
