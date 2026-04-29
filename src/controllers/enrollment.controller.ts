import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest, CreateEnrollmentDto } from "../types";

const prisma = new PrismaClient();

// Obtener todas las inscripciones
export const getEnrollments = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { cursoId, alumnoId, anio, activo } = req.query;

    const where: {
      cursoId?: string;
      alumnoId?: string;
      anio?: number;
      activo?: boolean;
    } = {};

    if (cursoId) where.cursoId = cursoId as string;
    if (alumnoId) where.alumnoId = alumnoId as string;
    if (anio) where.anio = parseInt(anio as string, 10);
    if (activo !== undefined) where.activo = activo === "true";

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        alumno: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            email: true,
          },
        },
        curso: { select: { id: true, nombre: true, anio: true, turno: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error("Error obteniendo inscripciones:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Crear una nueva inscripción
export const createEnrollment = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { alumnoId, cursoId, anio }: CreateEnrollmentDto = req.body;

    if (!alumnoId || !cursoId || !anio) {
      res
        .status(400)
        .json({ success: false, error: "Alumno, curso y año son requeridos" });
      return;
    }

    // Verificar que el alumno existe y es alumno
    const alumno = await prisma.user.findUnique({ where: { id: alumnoId } });
    if (!alumno || alumno.role !== "ALUMNO") {
      res
        .status(400)
        .json({ success: false, error: "Alumno no encontrado o rol inválido" });
      return;
    }

    // Verificar que el curso existe
    const curso = await prisma.course.findUnique({ where: { id: cursoId } });
    if (!curso) {
      res.status(404).json({ success: false, error: "Curso no encontrado" });
      return;
    }

    // Verificar que el alumno no esté ya inscrito en ese curso y año
    const existing = await prisma.enrollment.findUnique({
      where: { alumnoId_cursoId_anio: { alumnoId, cursoId, anio } },
    });

    if (existing) {
      res
        .status(400)
        .json({
          success: false,
          error: "El alumno ya está inscrito en este curso para este año",
        });
      return;
    }

    // Verificar que el alumno no tenga otra inscripción activa para el mismo año
    const otherEnrollment = await prisma.enrollment.findFirst({
      where: { alumnoId, anio, activo: true },
    });

    if (otherEnrollment) {
      res.status(400).json({
        success: false,
        error:
          "El alumno ya tiene una inscripción activa para este año en otro curso",
      });
      return;
    }

    const enrollment = await prisma.enrollment.create({
      data: { alumnoId, cursoId, anio },
      include: {
        alumno: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        curso: { select: { id: true, nombre: true, anio: true, turno: true } },
      },
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error("Error creando inscripción:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Eliminar (baja lógica) una inscripción
export const deleteEnrollment = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: "Inscripción no encontrada" });
      return;
    }

    await prisma.enrollment.update({
      where: { id },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: "Inscripción desactivada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando inscripción:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener historial académico de un alumno
export const getStudentHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Verificar que el usuario es alumno
    const alumno = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        role: true,
      },
    });

    if (!alumno) {
      res.status(404).json({ success: false, error: "Alumno no encontrado" });
      return;
    }

    if (alumno.role !== "ALUMNO") {
      res
        .status(400)
        .json({ success: false, error: "El usuario no es un alumno" });
      return;
    }

    // Obtener todas las inscripciones con cursos y calificaciones
    const history = await prisma.enrollment.findMany({
      where: { alumnoId: id },
      include: {
        curso: {
          include: {
            materias: {
              where: { activo: true },
              include: {
                docente: { select: { id: true, nombre: true, apellido: true } },
                calificaciones: {
                  where: { alumnoId: id },
                  orderBy: { periodo: "asc" },
                },
              },
            },
          },
        },
      },
      orderBy: { anio: "desc" },
    });

    res.json({
      success: true,
      data: {
        alumno,
        historial: history,
      },
    });
  } catch (error) {
    console.error("Error obteniendo historial académico:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
