import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Crear usuario DIRECTIVO inicial
  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  const directivo = await prisma.user.upsert({
    where: { email: "directivo@escuela.edu.ar" },
    update: {},
    create: {
      email: "directivo@escuela.edu.ar",
      password: hashedPassword,
      nombre: "Admin",
      apellido: "Directivo",
      dni: "00000001",
      role: "DIRECTIVO",
      activo: true,
    },
  });

  console.log("✅ Usuario DIRECTIVO creado:", directivo.email);

  // Crear algunos usuarios de prueba adicionales
  const secretario = await prisma.user.upsert({
    where: { email: "secretario@escuela.edu.ar" },
    update: {},
    create: {
      email: "secretario@escuela.edu.ar",
      password: hashedPassword,
      nombre: "María",
      apellido: "Secretaria",
      dni: "00000002",
      role: "SECRETARIO",
      activo: true,
    },
  });
  console.log("✅ Usuario SECRETARIO creado:", secretario.email);

  const preceptor = await prisma.user.upsert({
    where: { email: "preceptor@escuela.edu.ar" },
    update: {},
    create: {
      email: "preceptor@escuela.edu.ar",
      password: hashedPassword,
      nombre: "Carlos",
      apellido: "Preceptor",
      dni: "00000003",
      role: "PRECEPTOR",
      activo: true,
    },
  });
  console.log("✅ Usuario PRECEPTOR creado:", preceptor.email);

  const docente = await prisma.user.upsert({
    where: { email: "docente@escuela.edu.ar" },
    update: {},
    create: {
      email: "docente@escuela.edu.ar",
      password: hashedPassword,
      nombre: "Juan",
      apellido: "Profesor",
      dni: "00000004",
      role: "DOCENTE",
      activo: true,
    },
  });
  console.log("✅ Usuario DOCENTE creado:", docente.email);

  const alumno = await prisma.user.upsert({
    where: { email: "alumno@escuela.edu.ar" },
    update: {},
    create: {
      email: "alumno@escuela.edu.ar",
      password: hashedPassword,
      nombre: "Pedro",
      apellido: "Estudiante",
      dni: "00000005",
      role: "ALUMNO",
      activo: true,
    },
  });
  console.log("✅ Usuario ALUMNO creado:", alumno.email);

  // Crear un curso de ejemplo
  const curso = await prisma.course.upsert({
    where: { nombre_anio: { nombre: "1°A", anio: 2026 } },
    update: {},
    create: {
      nombre: "1°A",
      anio: 2026,
      turno: "MANANA",
      activo: true,
    },
  });
  console.log("✅ Curso creado:", curso.nombre);

  // Crear una materia de ejemplo
  const materia = await prisma.subject.upsert({
    where: { nombre_cursoId: { nombre: "Matemáticas", cursoId: curso.id } },
    update: {},
    create: {
      nombre: "Matemáticas",
      cursoId: curso.id,
      docenteId: docente.id,
      activo: true,
    },
  });
  console.log("✅ Materia creada:", materia.nombre);

  // Inscribir al alumno en el curso
  const inscripcion = await prisma.enrollment.upsert({
    where: {
      alumnoId_cursoId_anio: {
        alumnoId: alumno.id,
        cursoId: curso.id,
        anio: 2026,
      },
    },
    update: {},
    create: {
      alumnoId: alumno.id,
      cursoId: curso.id,
      anio: 2026,
      activo: true,
    },
  });
  console.log("✅ Inscripción creada para alumno:", alumno.email);

  // Crear una calificación de ejemplo
  const calificacion = await prisma.grade.upsert({
    where: {
      alumnoId_materiaId_periodo: {
        alumnoId: alumno.id,
        materiaId: materia.id,
        periodo: "PRIMER_TRIMESTRE",
      },
    },
    update: {},
    create: {
      alumnoId: alumno.id,
      materiaId: materia.id,
      nota: 8.5,
      periodo: "PRIMER_TRIMESTRE",
      observaciones: "Buen rendimiento",
    },
  });
  console.log("✅ Calificación creada:", calificacion.nota);

  console.log("\n📋 Resumen de datos de prueba:");
  console.log("================================");
  console.log(
    "Usuario: directivo@escuela.edu.ar | Contraseña: Admin@123 | Rol: DIRECTIVO",
  );
  console.log(
    "Usuario: secretario@escuela.edu.ar | Contraseña: Admin@123 | Rol: SECRETARIO",
  );
  console.log(
    "Usuario: preceptor@escuela.edu.ar | Contraseña: Admin@123 | Rol: PRECEPTOR",
  );
  console.log(
    "Usuario: docente@escuela.edu.ar | Contraseña: Admin@123 | Rol: DOCENTE",
  );
  console.log(
    "Usuario: alumno@escuela.edu.ar | Contraseña: Admin@123 | Rol: ALUMNO",
  );
  console.log("================================");
  console.log("\n🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
