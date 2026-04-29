import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  AuthenticatedRequest,
  CreateSubjectDto,
  UpdateSubjectDto,
} from "../types";

const prisma = new PrismaClient();

// Obtener todas las materias (con filtro por curso)
export const getSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { cursoId, activo } = req.query;

    const where: { cursoId?: string; activo?: boolean } = {};

    if (cursoId) {
      where.cursoId = cursoId as string;
    }

    if (activo !== undefined) {
      where.activo = activo === "true";
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        curso: { select: { id: true, nombre: true, anio: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { nombre: "asc" },
    });

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error("Error obteniendo materias:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener una materia por ID
export const getSubjectById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const subject = await prisma.subject.findUnique({
      where: { id },
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
        docente: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        calificaciones: {
          include: {
            alumno: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!subject) {
      res.status(404).json({ success: false, error: "Materia no encontrada" });
      return;
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error("Error obteniendo materia:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Crear una nueva materia
export const createSubject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, cursoId, docenteId }: CreateSubjectDto = req.body;

    if (!nombre || !cursoId) {
      res
        .status(400)
        .json({ success: false, error: "Nombre y curso son requeridos" });
      return;
    }

    // Verificar que el curso existe
    const course = await prisma.course.findUnique({ where: { id: cursoId } });
    if (!course) {
      res.status(404).json({ success: false, error: "Curso no encontrado" });
      return;
    }

    // Verificar que no exista una materia con el mismo nombre en el curso
    const existing = await prisma.subject.findUnique({
      where: { nombre_cursoId: { nombre, cursoId } },
    });

    if (existing) {
      res
        .status(400)
        .json({
          success: false,
          error: "Ya existe una materia con ese nombre en el curso",
        });
      return;
    }

    // Si se especifica docente, verificar que existe y es docente
    if (docenteId) {
      const docente = await prisma.user.findUnique({
        where: { id: docenteId },
      });
      if (!docente || docente.role !== "DOCENTE") {
        res
          .status(400)
          .json({
            success: false,
            error: "Docente no encontrado o rol inválido",
          });
        return;
      }
    }

    const subject = await prisma.subject.create({
      data: { nombre, cursoId, docenteId },
      include: {
        curso: { select: { id: true, nombre: true, anio: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error("Error creando materia:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Actualizar una materia
export const updateSubject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData: UpdateSubjectDto = req.body;

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Materia no encontrada" });
      return;
    }

    // Si se actualiza el docente, verificar que existe y es docente
    if (updateData.docenteId) {
      const docente = await prisma.user.findUnique({
        where: { id: updateData.docenteId },
      });
      if (!docente || docente.role !== "DOCENTE") {
        res
          .status(400)
          .json({
            success: false,
            error: "Docente no encontrado o rol inválido",
          });
        return;
      }
    }

    // Si se actualiza el nombre, verificar unicidad en el curso
    if (updateData.nombre && updateData.nombre !== existing.nombre) {
      const duplicate = await prisma.subject.findFirst({
        where: {
          nombre: updateData.nombre,
          cursoId: existing.cursoId,
          id: { not: id },
        },
      });

      if (duplicate) {
        res
          .status(400)
          .json({
            success: false,
            error: "Ya existe una materia con ese nombre en el curso",
          });
        return;
      }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        curso: { select: { id: true, nombre: true, anio: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error("Error actualizando materia:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Eliminar (baja lógica) una materia
export const deleteSubject = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Materia no encontrada" });
      return;
    }

    await prisma.subject.update({
      where: { id },
      data: { activo: false },
    });

    res.json({ success: true, message: "Materia desactivada correctamente" });
  } catch (error) {
    console.error("Error eliminando materia:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
