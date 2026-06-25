import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers, updatePushToken } from "../controllers/userController";

const router = Router();

router.get("/", protectRoute, getUsers);
router.put("/push-token", protectRoute, updatePushToken);

export default router;
