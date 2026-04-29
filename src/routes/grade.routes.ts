import { Router } from "express";
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getTeacherSubjects,
  getSubjectStudents,
  getStudentInfo,
} from "../controllers/grade.controller";
import { verifyToken, requireRole } from "../middlewares/auth";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// === Rutas para DOCENTE ===

// GET /api/grades/teacher/subjects - Obtener materias del docente logueado
router.get("/teacher/subjects", requireRole("DOCENTE"), getTeacherSubjects);

// GET /api/grades/teacher/subjects/:materiaId/students - Obtener alumnos de una materia
router.get(
  "/teacher/subjects/:materiaId/students",
  requireRole("DOCENTE"),
  getSubjectStudents,
);

// === Rutas para ALUMNO ===

// GET /api/grades/student/info - Obtener información del alumno logueado
router.get("/student/info", requireRole("ALUMNO"), getStudentInfo);

// === Rutas generales de calificaciones ===

// GET /api/grades - Obtener calificaciones (con filtros)
router.get(
  "/",
  requireRole("DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE"),
  getGrades,
);

// POST /api/grades - Crear calificación
router.post("/", requireRole("DOCENTE"), createGrade);

// PUT /api/grades/:id - Actualizar calificación
router.put("/:id", requireRole("DOCENTE"), updateGrade);

// DELETE /api/grades/:id - Eliminar calificación
router.delete("/:id", requireRole("DOCENTE"), deleteGrade);

export default router;
