import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomBytes } from "crypto";

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { image } = req.body as { image?: string };

    if (!image?.startsWith("data:image/")) {
      res.status(400).json({ message: "Invalid image data" });
      return;
    }

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ message: "Invalid image format" });
      return;
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    if (!base64Data) {
      res.status(400).json({ message: "Invalid image format" });
      return;
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ message: "Image too large (max 5MB)" });
      return;
    }

    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    res.json({ imageUrl: `/uploads/${filename}` });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
