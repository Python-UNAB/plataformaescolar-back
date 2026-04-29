import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import courseRoutes from "./course.routes";
import subjectRoutes from "./subject.routes";
import enrollmentRoutes from "./enrollment.routes";
import gradeRoutes from "./grade.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rutas de la API
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/subjects", subjectRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/grades", gradeRoutes);

export default router;
