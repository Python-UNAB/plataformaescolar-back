import { Response } from "express";
import { PrismaClient, Periodo } from "@prisma/client";
import { AuthenticatedRequest, CreateGradeDto, UpdateGradeDto } from "../types";

const prisma = new PrismaClient();

// Obtener calificaciones (con filtros)
export const getGrades = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { materiaId, alumnoId, periodo } = req.query;

    const where: { materiaId?: string; alumnoId?: string; periodo?: Periodo } =
      {};

    if (materiaId) where.materiaId = materiaId as string;
    if (alumnoId) where.alumnoId = alumnoId as string;
    if (periodo && Object.values(Periodo).includes(periodo as Periodo)) {
      where.periodo = periodo as Periodo;
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        alumno: {
          select: { id: true, nombre: true, apellido: true, dni: true },
        },
        materia: {
          select: {
            id: true,
            nombre: true,
            curso: { select: { id: true, nombre: true, anio: true } },
          },
        },
      },
      orderBy: [
        { materia: { nombre: "asc" } },
        { alumno: { apellido: "asc" } },
        { periodo: "asc" },
      ],
    });

    res.json({ success: true, data: grades });
  } catch (error) {
    console.error("Error obteniendo calificaciones:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Crear una nueva calificación
export const createGrade = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      alumnoId,
      materiaId,
      nota,
      periodo,
      observaciones,
    }: CreateGradeDto = req.body;

    if (!alumnoId || !materiaId || nota === undefined || !periodo) {
      res
        .status(400)
        .json({
          success: false,
          error: "Alumno, materia, nota y período son requeridos",
        });
      return;
    }

    // Validar nota
    if (nota < 0 || nota > 10) {
      res
        .status(400)
        .json({ success: false, error: "La nota debe estar entre 0 y 10" });
      return;
    }

    // Validar período
    if (!Object.values(Periodo).includes(periodo as Periodo)) {
      res.status(400).json({ success: false, error: "Período inválido" });
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

    // Verificar que la materia existe
    const materia = await prisma.subject.findUnique({
      where: { id: materiaId },
      include: { curso: true },
    });
    if (!materia) {
      res.status(404).json({ success: false, error: "Materia no encontrada" });
      return;
    }

    // Verificar que el alumno está inscrito en el curso de la materia
    const enrollment = await prisma.enrollment.findFirst({
      where: { alumnoId, cursoId: materia.cursoId, activo: true },
    });

    if (!enrollment) {
      res
        .status(400)
        .json({
          success: false,
          error: "El alumno no está inscrito en el curso de esta materia",
        });
      return;
    }

    // Verificar que no existe una calificación para este alumno, materia y período
    const existing = await prisma.grade.findUnique({
      where: {
        alumnoId_materiaId_periodo: {
          alumnoId,
          materiaId,
          periodo: periodo as Periodo,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: "Ya existe una calificación para este alumno, materia y período",
      });
      return;
    }

    // Si el usuario es docente, verificar que la materia es suya
    if (req.user?.role === "DOCENTE" && materia.docenteId !== req.user.userId) {
      res
        .status(403)
        .json({
          success: false,
          error: "No tiene permisos para calificar esta materia",
        });
      return;
    }

    const grade = await prisma.grade.create({
      data: {
        alumnoId,
        materiaId,
        nota,
        periodo: periodo as Periodo,
        observaciones,
      },
      include: {
        alumno: { select: { id: true, nombre: true, apellido: true } },
        materia: { select: { id: true, nombre: true } },
      },
    });

    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    console.error("Error creando calificación:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Actualizar una calificación
export const updateGrade = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { nota, observaciones }: UpdateGradeDto = req.body;

    const existing = await prisma.grade.findUnique({
      where: { id },
      include: { materia: true },
    });

    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: "Calificación no encontrada" });
      return;
    }

    // Si el usuario es docente, verificar que la materia es suya
    if (
      req.user?.role === "DOCENTE" &&
      existing.materia.docenteId !== req.user.userId
    ) {
      res
        .status(403)
        .json({
          success: false,
          error: "No tiene permisos para modificar esta calificación",
        });
      return;
    }

    // Validar nota si se proporciona
    if (nota !== undefined && (nota < 0 || nota > 10)) {
      res
        .status(400)
        .json({ success: false, error: "La nota debe estar entre 0 y 10" });
      return;
    }

    const grade = await prisma.grade.update({
      where: { id },
      data: { nota, observaciones },
      include: {
        alumno: { select: { id: true, nombre: true, apellido: true } },
        materia: { select: { id: true, nombre: true } },
      },
    });

    res.json({ success: true, data: grade });
  } catch (error) {
    console.error("Error actualizando calificación:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Eliminar una calificación
export const deleteGrade = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.grade.findUnique({
      where: { id },
      include: { materia: true },
    });

    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: "Calificación no encontrada" });
      return;
    }

    // Si el usuario es docente, verificar que la materia es suya
    if (
      req.user?.role === "DOCENTE" &&
      existing.materia.docenteId !== req.user.userId
    ) {
      res
        .status(403)
        .json({
          success: false,
          error: "No tiene permisos para eliminar esta calificación",
        });
      return;
    }

    await prisma.grade.delete({ where: { id } });

    res.json({
      success: true,
      message: "Calificación eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando calificación:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener materias asignadas al docente logueado
export const getTeacherSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "No autenticado" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { docenteId: req.user.userId, activo: true },
      include: {
        curso: {
          select: { id: true, nombre: true, anio: true, turno: true },
        },
        _count: {
          select: { calificaciones: true },
        },
      },
      orderBy: [
        { curso: { anio: "desc" } },
        { curso: { nombre: "asc" } },
        { nombre: "asc" },
      ],
    });

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error("Error obteniendo materias del docente:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener alumnos de una materia (para el docente)
export const getSubjectStudents = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const materiaId = req.params.materiaId as string;

    const subject = await prisma.subject.findUnique({
      where: { id: materiaId },
      include: {
        curso: {
          include: {
            inscripciones: {
              where: { activo: true },
              include: {
                alumno: {
                  select: { id: true, nombre: true, apellido: true, dni: true },
                },
              },
            },
          },
        },
        calificaciones: true,
      },
    });

    if (!subject) {
      res.status(404).json({ success: false, error: "Materia no encontrada" });
      return;
    }

    // Verificar que el docente tiene asignada esta materia
    if (req.user?.role === "DOCENTE" && subject.docenteId !== req.user.userId) {
      res
        .status(403)
        .json({
          success: false,
          error: "No tiene permisos para ver esta materia",
        });
      return;
    }

    // Formatear respuesta con alumnos y sus calificaciones
    const students = subject.curso.inscripciones.map((enrollment) => {
      const grades = subject.calificaciones.filter(
        (g) => g.alumnoId === enrollment.alumnoId,
      );

      return {
        ...enrollment.alumno,
        calificaciones: grades.reduce(
          (acc, g) => {
            acc[g.periodo] = {
              id: g.id,
              nota: g.nota,
              observaciones: g.observaciones,
            };
            return acc;
          },
          {} as Record<
            string,
            { id: string; nota: number; observaciones: string | null }
          >,
        ),
      };
    });

    res.json({
      success: true,
      data: {
        materia: { id: subject.id, nombre: subject.nombre },
        curso: {
          id: subject.curso.id,
          nombre: subject.curso.nombre,
          anio: subject.curso.anio,
        },
        alumnos: students,
      },
    });
  } catch (error) {
    console.error("Error obteniendo alumnos de materia:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener información del alumno logueado
export const getStudentInfo = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "No autenticado" });
      return;
    }

    const currentYear = new Date().getFullYear();

    // Obtener inscripción activa del año actual
    const enrollment = await prisma.enrollment.findFirst({
      where: { alumnoId: req.user.userId, anio: currentYear, activo: true },
      include: {
        curso: {
          include: {
            materias: {
              where: { activo: true },
              include: {
                docente: { select: { id: true, nombre: true, apellido: true } },
                calificaciones: {
                  where: { alumnoId: req.user.userId },
                  orderBy: { periodo: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      res.json({
        success: true,
        data: {
          mensaje: "No tienes inscripción activa para el año actual",
          inscripcion: null,
        },
      });
      return;
    }

    // Calcular promedios por materia
    const materiasConPromedio = enrollment.curso.materias.map((materia) => {
      const calificacionesNumericas = materia.calificaciones
        .filter((c) => c.periodo !== "FINAL")
        .map((c) => c.nota);

      const promedio =
        calificacionesNumericas.length > 0
          ? calificacionesNumericas.reduce((a, b) => a + b, 0) /
            calificacionesNumericas.length
          : null;

      return {
        id: materia.id,
        nombre: materia.nombre,
        docente: materia.docente,
        calificaciones: materia.calificaciones,
        promedio: promedio ? Math.round(promedio * 100) / 100 : null,
      };
    });

    res.json({
      success: true,
      data: {
        inscripcion: {
          id: enrollment.id,
          anio: enrollment.anio,
          curso: {
            id: enrollment.curso.id,
            nombre: enrollment.curso.nombre,
            turno: enrollment.curso.turno,
          },
        },
        materias: materiasConPromedio,
      },
    });
  } catch (error) {
    console.error("Error obteniendo información del alumno:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
