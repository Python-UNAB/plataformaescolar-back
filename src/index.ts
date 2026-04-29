import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Plataforma Escolar API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      courses: "/api/courses",
      subjects: "/api/subjects",
      enrollments: "/api/enrollments",
      grades: "/api/grades",
    },
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

// Manejo de errores globales
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  },
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
});

export default app;
