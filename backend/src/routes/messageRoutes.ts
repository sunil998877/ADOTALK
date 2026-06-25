import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getMessages, uploadImage } from "../controllers/messageController";

const router = Router();

router.get("/chat/:chatId", protectRoute, getMessages);
router.post("/upload-image", protectRoute, uploadImage);

export default router;
