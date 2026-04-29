import { Role } from "@prisma/client";
import { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface CreateUserDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  role: Role;
}

export interface UpdateUserDto {
  email?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  role?: Role;
  activo?: boolean;
  password?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateCourseDto {
  nombre: string;
  anio: number;
  turno: "MANANA" | "TARDE" | "NOCHE";
}

export interface UpdateCourseDto {
  nombre?: string;
  anio?: number;
  turno?: "MANANA" | "TARDE" | "NOCHE";
  activo?: boolean;
}

export interface CreateSubjectDto {
  nombre: string;
  cursoId: string;
  docenteId?: string;
}

export interface UpdateSubjectDto {
  nombre?: string;
  docenteId?: string;
  activo?: boolean;
}

export interface CreateEnrollmentDto {
  alumnoId: string;
  cursoId: string;
  anio: number;
}

export interface CreateGradeDto {
  alumnoId: string;
  materiaId: string;
  nota: number;
  periodo:
    | "PRIMER_TRIMESTRE"
    | "SEGUNDO_TRIMESTRE"
    | "TERCER_TRIMESTRE"
    | "FINAL";
  observaciones?: string;
}

export interface UpdateGradeDto {
  nota?: number;
  observaciones?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
