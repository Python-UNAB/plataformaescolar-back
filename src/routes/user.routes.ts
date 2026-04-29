import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDocentes,
  getAlumnos,
} from "../controllers/user.controller";
import { verifyToken, requireRole } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/users/docentes - Obtener lista de docentes (para selects)
// Accesible por SECRETARIO y DIRECTIVO
router.get("/docentes", requireRole("DIRECTIVO", "SECRETARIO"), getDocentes);

// GET /api/users/alumnos - Obtener lista de alumnos (para selects e inscripciones)
// Accesible por SECRETARIO, DIRECTIVO y PRECEPTOR
router.get(
  "/alumnos",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR"),
  getAlumnos,
);

// CRUD de usuarios - Solo DIRECTIVO
router.get("/", requireRole("DIRECTIVO"), getUsers);
router.get("/:id", requireRole("DIRECTIVO"), getUserById);
router.post("/", requireRole("DIRECTIVO"), createUser);
router.put("/:id", requireRole("DIRECTIVO"), updateUser);
router.delete("/:id", requireRole("DIRECTIVO"), deleteUser);

export default router;
