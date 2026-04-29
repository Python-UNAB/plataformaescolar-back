import { Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { AuthenticatedRequest, CreateUserDto, UpdateUserDto } from "../types";
import { hashPassword, validatePasswordStrength } from "../utils/password";

const prisma = new PrismaClient();

// Obtener todos los usuarios con filtros y paginación
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { role, search, page = "1", limit = "10", activo } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: {
      role?: Role;
      activo?: boolean;
      OR?: Array<{
        nombre?: { contains: string; mode: "insensitive" };
        apellido?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        dni?: { contains: string };
      }>;
    } = {};

    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    if (activo !== undefined) {
      where.activo = activo === "true";
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: "insensitive" } },
        { apellido: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { dni: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          dni: true,
          role: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener un usuario por ID
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        dni: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "Usuario no encontrado" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Crear un nuevo usuario
export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, nombre, apellido, dni, role }: CreateUserDto =
      req.body;

    // Validaciones
    if (!email || !password || !nombre || !apellido || !dni || !role) {
      res
        .status(400)
        .json({ success: false, error: "Todos los campos son requeridos" });
      return;
    }

    if (!Object.values(Role).includes(role)) {
      res.status(400).json({ success: false, error: "Rol inválido" });
      return;
    }

    // Validar contraseña robusta
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      res
        .status(400)
        .json({ success: false, error: passwordValidation.message });
      return;
    }

    // Verificar email único
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res
        .status(400)
        .json({ success: false, error: "El email ya está registrado" });
      return;
    }

    // Verificar DNI único
    const existingDni = await prisma.user.findUnique({ where: { dni } });
    if (existingDni) {
      res
        .status(400)
        .json({ success: false, error: "El DNI ya está registrado" });
      return;
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        dni,
        role,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        dni: true,
        role: true,
        activo: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error("Error creando usuario:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Actualizar un usuario
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData: UpdateUserDto = req.body;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: "Usuario no encontrado" });
      return;
    }

    // Si se actualiza el email, verificar que sea único
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (emailExists) {
        res
          .status(400)
          .json({ success: false, error: "El email ya está registrado" });
        return;
      }
    }

    // Si se actualiza el DNI, verificar que sea único
    if (updateData.dni && updateData.dni !== existingUser.dni) {
      const dniExists = await prisma.user.findUnique({
        where: { dni: updateData.dni },
      });
      if (dniExists) {
        res
          .status(400)
          .json({ success: false, error: "El DNI ya está registrado" });
        return;
      }
    }

    // Si se actualiza la contraseña, validar y hashear
    if (updateData.password) {
      const passwordValidation = validatePasswordStrength(updateData.password);
      if (!passwordValidation.valid) {
        res
          .status(400)
          .json({ success: false, error: passwordValidation.message });
        return;
      }
      updateData.password = await hashPassword(updateData.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        dni: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Eliminar (baja lógica) un usuario
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ success: false, error: "Usuario no encontrado" });
      return;
    }

    // No permitir que el directivo se desactive a sí mismo
    if (req.user?.userId === id) {
      res
        .status(400)
        .json({
          success: false,
          error: "No puede desactivar su propio usuario",
        });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { activo: false },
    });

    res.json({ success: true, message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener docentes (para asignar a materias)
export const getDocentes = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const docentes = await prisma.user.findMany({
      where: { role: "DOCENTE", activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
      },
      orderBy: { apellido: "asc" },
    });

    res.json({ success: true, data: docentes });
  } catch (error) {
    console.error("Error obteniendo docentes:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

// Obtener alumnos (para inscripciones)
export const getAlumnos = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { search } = req.query;

    const where: {
      role: Role;
      activo: boolean;
      OR?: Array<{
        nombre?: { contains: string; mode: "insensitive" };
        apellido?: { contains: string; mode: "insensitive" };
        dni?: { contains: string };
      }>;
    } = { role: "ALUMNO", activo: true };

    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: "insensitive" } },
        { apellido: { contains: search as string, mode: "insensitive" } },
        { dni: { contains: search as string } },
      ];
    }

    const alumnos = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
      },
      orderBy: { apellido: "asc" },
      take: 50,
    });

    res.json({ success: true, data: alumnos });
  } catch (error) {
    console.error("Error obteniendo alumnos:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
