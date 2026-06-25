import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { clerkClient, getAuth } from "@clerk/express";

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

function getClerkProfile(clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>) {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name = clerkUser.firstName
    ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
    : email?.split("@")[0] ?? "User";

  return {
    email,
    name,
    avatar: clerkUser.imageUrl ?? "",
  };
}

export async function authCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const profile = getClerkProfile(clerkUser);

    if (!profile.email) {
      res.status(400).json({ message: "No email address found for Clerk user" });
      return;
    }

    let user =
      (await User.findOne({ clerkId })) ??
      (await User.findOne({ email: profile.email }));

    if (user) {
      user.clerkId = clerkId;
      user.name = profile.name;
      user.email = profile.email;
      user.avatar = profile.avatar;
      await user.save();
    } else {
      try {
        user = await User.create({
          clerkId,
          ...profile,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error as { code?: number }).code === 11000
        ) {
          user = await User.findOne({ email: profile.email });
          if (!user) throw error;

          user.clerkId = clerkId;
          user.name = profile.name;
          user.avatar = profile.avatar;
          await user.save();
        } else {
          throw error;
        }
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
