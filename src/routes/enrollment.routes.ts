import { Router } from "express";
import {
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getStudentHistory,
} from "../controllers/enrollment.controller";
import { verifyToken, requireRole } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/enrollments - Obtener todas las inscripciones
router.get(
  "/",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR"),
  getEnrollments,
);

// POST /api/enrollments - Crear inscripción
router.post("/", requireRole("DIRECTIVO", "SECRETARIO"), createEnrollment);

// DELETE /api/enrollments/:id - Eliminar inscripción
router.delete("/:id", requireRole("DIRECTIVO", "SECRETARIO"), deleteEnrollment);

// GET /api/enrollments/history/:id - Obtener historial académico de un alumno
router.get(
  "/history/:id",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR"),
  getStudentHistory,
);

export default router;
