import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth";

const router = Router();

// POST /api/auth/login - Iniciar sesión
router.post("/login", login);

// GET /api/auth/me - Obtener usuario actual
router.get("/me", verifyToken, me);

export default router;
