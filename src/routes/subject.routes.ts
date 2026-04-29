import { Router } from "express";
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller";
import { verifyToken, requireRole } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/subjects - Obtener todas las materias
// Accesible por SECRETARIO, PRECEPTOR, DIRECTIVO y DOCENTE
router.get(
  "/",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE"),
  getSubjects,
);

// GET /api/subjects/:id - Obtener una materia con detalles
router.get(
  "/:id",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE"),
  getSubjectById,
);

// CRUD de materias - Solo SECRETARIO (y DIRECTIVO)
router.post("/", requireRole("DIRECTIVO", "SECRETARIO"), createSubject);
router.put("/:id", requireRole("DIRECTIVO", "SECRETARIO"), updateSubject);
router.delete("/:id", requireRole("DIRECTIVO", "SECRETARIO"), deleteSubject);

export default router;
