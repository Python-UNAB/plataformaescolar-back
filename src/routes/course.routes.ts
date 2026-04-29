import { Router } from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller";
import { verifyToken, requireRole } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/courses - Obtener todos los cursos
// Accesible por SECRETARIO, PRECEPTOR y DIRECTIVO
router.get(
  "/",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR"),
  getCourses,
);

// GET /api/courses/:id - Obtener un curso con detalles
// Accesible por SECRETARIO, PRECEPTOR y DIRECTIVO
router.get(
  "/:id",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR"),
  getCourseById,
);

// CRUD de cursos - Solo SECRETARIO (y DIRECTIVO)
router.post("/", requireRole("DIRECTIVO", "SECRETARIO"), createCourse);
router.put("/:id", requireRole("DIRECTIVO", "SECRETARIO"), updateCourse);
router.delete("/:id", requireRole("DIRECTIVO", "SECRETARIO"), deleteCourse);

export default router;
