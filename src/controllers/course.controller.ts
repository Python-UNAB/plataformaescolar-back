import { Response } from "express";
import { PrismaClient, Turno } from "@prisma/client";
import {
  AuthenticatedRequest,
  CreateCourseDto,
  UpdateCourseDto,
} from "../types";

const prisma = new PrismaClient();

// Obtener todos los cursos
export const getCourses = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { anio, activo } = req.query;

    const where: { anio?: number; activo?: boolean } = {};

    if (anio) {
      where.anio = parseInt(anio as string, 10);
    }

    if (activo !== undefined) {
      where.activo = activo === "true";
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            inscripciones: { where: { activo: true } },
            materias: { where: { activo: true } },
          },
        },
      },
      orderBy: [{ anio: "desc" }, { nombre: "asc" }],
    });

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener un curso por ID con sus materias y alumnos
export const getCourseById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        materias: {
          where: { activo: true },
          include: {
            docente: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        inscripciones: {
          where: { activo: true },
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
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, error: "Curso no encontrado" });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error obteniendo curso:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Crear un nuevo curso
export const createCourse = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, anio, turno }: CreateCourseDto = req.body;

    if (!nombre || !anio || !turno) {
      res
        .status(400)
        .json({ success: false, error: "Todos los campos son requeridos" });
      return;
    }

    if (!Object.values(Turno).includes(turno as Turno)) {
      res.status(400).json({ success: false, error: "Turno inválido" });
      return;
    }

    // Verificar que no exista un curso con el mismo nombre y año
    const existing = await prisma.course.findUnique({
      where: { nombre_anio: { nombre, anio } },
    });

    if (existing) {
      res
        .status(400)
        .json({
          success: false,
          error: "Ya existe un curso con ese nombre para ese año",
        });
      return;
    }

    const course = await prisma.course.create({
      data: { nombre, anio, turno: turno as Turno },
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error("Error creando curso:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Actualizar un curso
export const updateCourse = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData: UpdateCourseDto = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Curso no encontrado" });
      return;
    }

    // Si se actualiza nombre o año, verificar unicidad
    if (updateData.nombre || updateData.anio) {
      const checkName = updateData.nombre || existing.nombre;
      const checkAnio = updateData.anio || existing.anio;

      const duplicate = await prisma.course.findFirst({
        where: { nombre: checkName, anio: checkAnio, id: { not: id } },
      });

      if (duplicate) {
        res
          .status(400)
          .json({
            success: false,
            error: "Ya existe un curso con ese nombre para ese año",
          });
        return;
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error actualizando curso:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Eliminar (baja lógica) un curso
export const deleteCourse = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Curso no encontrado" });
      return;
    }

    await prisma.course.update({
      where: { id },
      data: { activo: false },
    });

    res.json({ success: true, message: "Curso desactivado correctamente" });
  } catch (error) {
    console.error("Error eliminando curso:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
