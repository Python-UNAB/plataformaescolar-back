import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest, LoginDto } from "../types";
import { comparePassword } from "../utils/password";
import { generateToken } from "../middlewares/auth";

const prisma = new PrismaClient();

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, error: "Email y contraseña son requeridos" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ success: false, error: "Credenciales inválidas" });
      return;
    }

    if (!user.activo) {
      res.status(401).json({ success: false, error: "Usuario desactivado" });
      return;
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ success: false, error: "Credenciales inválidas" });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};

export const me = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "No autenticado" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    if (!user) {
      res.status(404).json({ success: false, error: "Usuario no encontrado" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error en me:", error);
    res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
};
