import { Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthenticatedRequest, JwtPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: "24h" };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, error: "Token inválido o expirado" });
  }
};

export const requireRole = (...roles: Role[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "No autenticado" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "No tiene permisos para acceder a este recurso",
      });
      return;
    }

    next();
  };
};
