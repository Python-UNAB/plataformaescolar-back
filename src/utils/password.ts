import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Regex para validar contraseña robusta:
// - Mínimo 8 caracteres
// - Al menos una mayúscula
// - Al menos una minúscula
// - Al menos un número
// - Al menos un carácter especial
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const validatePasswordStrength = (
  password: string,
): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "La contraseña debe tener al menos 8 caracteres",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe contener al menos una letra minúscula",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe contener al menos una letra mayúscula",
    };
  }
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: "La contraseña debe contener al menos un número",
    };
  }
  if (!/[@$!%*?&]/.test(password)) {
    return {
      valid: false,
      message:
        "La contraseña debe contener al menos un carácter especial (@$!%*?&)",
    };
  }
  return { valid: true };
};
