# Plataforma Escolar — Backend API

API REST para la gestión escolar, desarrollada con **Node.js**, **Express 5**, **TypeScript**, **Prisma ORM** y **PostgreSQL**. Incluye autenticación JWT y control de acceso basado en roles (RBAC).

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos de la base de datos](#modelos-de-la-base-de-datos)
- [Variables de entorno](#variables-de-entorno)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Scripts disponibles](#scripts-disponibles)
- [Autenticación y roles](#autenticación-y-roles)
- [Endpoints de la API](#endpoints-de-la-api)
  - [Auth](#auth)
  - [Usuarios](#usuarios)
  - [Cursos](#cursos)
  - [Materias](#materias)
  - [Inscripciones](#inscripciones)
  - [Calificaciones](#calificaciones)
- [Formato de respuesta](#formato-de-respuesta)
- [Usuarios de prueba (seed)](#usuarios-de-prueba-seed)
- [Despliegue en Render](#despliegue-en-render)

---

## Tecnologías

| Paquete      | Versión                  | Rol                                   |
| ------------ | ------------------------ | ------------------------------------- |
| Node.js      | ≥ 18 (recomendado 20.18) | Runtime                               |
| TypeScript   | ^6                       | Tipado estático                       |
| Express      | ^5                       | Framework HTTP                        |
| Prisma ORM   | ^5.22                    | ORM / migraciones                     |
| PostgreSQL   | —                        | Base de datos                         |
| jsonwebtoken | ^9                       | Emisión y verificación de JWT         |
| bcryptjs     | ^3                       | Hash de contraseñas (salt rounds: 12) |
| dotenv       | ^17                      | Gestión de variables de entorno       |
| cors         | ^2.8                     | Control de CORS                       |

---

## Requisitos previos

- Node.js **≥ 18**
- PostgreSQL corriendo localmente o en la nube
- `npm` (o `pnpm` / `yarn`)

---

## Estructura del proyecto

```
plataformaescolar-back/
├── prisma/
│   ├── schema.prisma        # Esquema de la base de datos (modelos, enums, relaciones)
│   ├── seed.ts              # Script de datos iniciales
│   └── migrations/          # Historial de migraciones SQL
├── src/
│   ├── index.ts             # Punto de entrada: configuración de Express y arranque del servidor
│   ├── controllers/
│   │   ├── auth.controller.ts        # Login y perfil propio
│   │   ├── user.controller.ts        # CRUD de usuarios
│   │   ├── course.controller.ts      # CRUD de cursos
│   │   ├── subject.controller.ts     # CRUD de materias
│   │   ├── enrollment.controller.ts  # Inscripciones de alumnos
│   │   └── grade.controller.ts       # Calificaciones
│   ├── middlewares/
│   │   └── auth.ts          # generateToken, verifyToken, requireRole
│   ├── routes/
│   │   ├── index.ts          # Router raíz + health check
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── course.routes.ts
│   │   ├── subject.routes.ts
│   │   ├── enrollment.routes.ts
│   │   └── grade.routes.ts
│   ├── types/
│   │   └── index.ts          # Interfaces: DTOs, JwtPayload, AuthenticatedRequest, ApiResponse
│   └── utils/
│       └── password.ts       # hashPassword, comparePassword, validatePasswordStrength
├── .env.example
├── render.yaml               # Configuración de despliegue en Render
├── tsconfig.json
└── package.json
```

---

## Modelos de la base de datos

### Enums

| Enum      | Valores                                                              |
| --------- | -------------------------------------------------------------------- |
| `Role`    | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR`, `DOCENTE`, `ALUMNO`          |
| `Turno`   | `MANANA`, `TARDE`, `NOCHE`                                           |
| `Periodo` | `PRIMER_TRIMESTRE`, `SEGUNDO_TRIMESTRE`, `TERCER_TRIMESTRE`, `FINAL` |

### Modelos

#### `User`

| Campo                     | Tipo             | Descripción                         |
| ------------------------- | ---------------- | ----------------------------------- |
| `id`                      | `String` (UUID)  | PK generada automáticamente         |
| `email`                   | `String` (único) | Email de acceso                     |
| `password`                | `String`         | Hash bcrypt                         |
| `nombre`                  | `String`         | Nombre                              |
| `apellido`                | `String`         | Apellido                            |
| `dni`                     | `String` (único) | Documento nacional                  |
| `role`                    | `Role`           | Rol del usuario                     |
| `activo`                  | `Boolean`        | Activo/Desactivado (default `true`) |
| `createdAt` / `updatedAt` | `DateTime`       | Timestamps automáticos              |

**Relaciones:** un `User` con rol `DOCENTE` puede estar asignado a varias `Subject`. Un `User` con rol `ALUMNO` puede tener múltiples `Enrollment` y `Grade`.

---

#### `Course`

| Campo    | Tipo            | Descripción            |
| -------- | --------------- | ---------------------- |
| `id`     | `String` (UUID) | PK                     |
| `nombre` | `String`        | Ej: `"1°A"`            |
| `anio`   | `Int`           | Año lectivo            |
| `turno`  | `Turno`         | Mañana / Tarde / Noche |
| `activo` | `Boolean`       | Default `true`         |

**Constraint único:** `(nombre, anio)` — no pueden existir dos cursos con el mismo nombre en el mismo año.

---

#### `Subject`

| Campo       | Tipo            | Descripción                 |
| ----------- | --------------- | --------------------------- |
| `id`        | `String` (UUID) | PK                          |
| `nombre`    | `String`        | Nombre de la materia        |
| `cursoId`   | `String` (FK)   | Curso al que pertenece      |
| `docenteId` | `String?` (FK)  | Docente asignado (opcional) |
| `activo`    | `Boolean`       | Default `true`              |

**Constraint único:** `(nombre, cursoId)`.

---

#### `Enrollment`

| Campo      | Tipo            | Descripción              |
| ---------- | --------------- | ------------------------ |
| `id`       | `String` (UUID) | PK                       |
| `alumnoId` | `String` (FK)   | Alumno inscripto         |
| `cursoId`  | `String` (FK)   | Curso al que se inscribe |
| `anio`     | `Int`           | Año de inscripción       |
| `activo`   | `Boolean`       | Default `true`           |

**Constraint único:** `(alumnoId, cursoId, anio)` — un alumno no puede estar inscrito dos veces en el mismo curso y año.

---

#### `Grade`

| Campo           | Tipo            | Descripción              |
| --------------- | --------------- | ------------------------ |
| `id`            | `String` (UUID) | PK                       |
| `alumnoId`      | `String` (FK)   | Alumno                   |
| `materiaId`     | `String` (FK)   | Materia                  |
| `nota`          | `Float`         | Valor entre 0 y 10       |
| `periodo`       | `Periodo`       | Trimestre o Final        |
| `fecha`         | `DateTime`      | Fecha de la calificación |
| `observaciones` | `String?`       | Comentario opcional      |

**Constraint único:** `(alumnoId, materiaId, periodo)` — una calificación por período.

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```env
# Conexión a PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/plataforma_escolar?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"

# Servidor
PORT=3001
NODE_ENV=development

# CORS (separar con coma para múltiples orígenes)
CORS_ORIGIN="http://localhost:5173"
```

> **Producción:** `JWT_SECRET` debe ser un secreto largo y aleatorio. `CORS_ORIGIN` debe apuntar a la URL del frontend desplegado.

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de la base de datos

# 3. Ejecutar migraciones y generar cliente Prisma
npm run prisma:migrate

# 4. (Opcional) Cargar datos iniciales
npm run prisma:seed

# 5. Iniciar en modo desarrollo
npm run dev
```

El servidor quedará disponible en `http://localhost:3001`.

---

## Scripts disponibles

| Script            | Comando                               | Descripción                         |
| ----------------- | ------------------------------------- | ----------------------------------- |
| `dev`             | `nodemon --exec ts-node src/index.ts` | Servidor con recarga automática     |
| `build`           | `tsc`                                 | Compilar TypeScript a `dist/`       |
| `start`           | `node dist/index.js`                  | Servidor de producción              |
| `prisma:generate` | `prisma generate`                     | Regenerar el cliente Prisma         |
| `prisma:migrate`  | `prisma migrate dev`                  | Crear y aplicar nueva migración     |
| `prisma:push`     | `prisma db push`                      | Sincronizar esquema sin migración   |
| `prisma:seed`     | `ts-node prisma/seed.ts`              | Poblar la BD con datos iniciales    |
| `prisma:studio`   | `prisma studio`                       | Abrir el explorador visual de la BD |

---

## Autenticación y roles

Todas las rutas (salvo `/api/auth/login`) requieren un **JWT Bearer token** en el header:

```
Authorization: Bearer <token>
```

El token se obtiene del endpoint `POST /api/auth/login` y tiene una vigencia de **24 horas**.

### Jerarquía de roles y permisos

| Rol          | Descripción                           | Acceso                                               |
| ------------ | ------------------------------------- | ---------------------------------------------------- |
| `DIRECTIVO`  | Director del establecimiento          | Acceso total                                         |
| `SECRETARIO` | Administración académica              | Usuarios especiales, cursos, materias, inscripciones |
| `PRECEPTOR`  | Control de asistencia e inscripciones | Lectura de cursos, materias e inscripciones          |
| `DOCENTE`    | Profesor                              | Sus materias y calificaciones de sus alumnos         |
| `ALUMNO`     | Estudiante                            | Su propia información y calificaciones               |

### Lógica del middleware

- **`verifyToken`**: valida el JWT y adjunta el payload decodificado (`userId`, `email`, `role`) a `req.user`.
- **`requireRole(...roles)`**: permite el acceso solo si el rol del usuario está en la lista proporcionada; responde `403` en caso contrario.

---

## Endpoints de la API

Base URL: `http://localhost:3001/api`

### Health check

| Método | Ruta      | Auth | Descripción         |
| ------ | --------- | ---- | ------------------- |
| `GET`  | `/health` | No   | Estado del servidor |

Respuesta:

```json
{ "status": "ok", "timestamp": "2026-05-11T12:00:00.000Z" }
```

---

### Auth

| Método | Ruta          | Auth | Roles | Descripción                 |
| ------ | ------------- | ---- | ----- | --------------------------- |
| `POST` | `/auth/login` | No   | —     | Iniciar sesión              |
| `GET`  | `/auth/me`    | Sí   | Todos | Obtener usuario autenticado |

#### `POST /auth/login`

**Body:**

```json
{
  "email": "directivo@escuela.edu.ar",
  "password": "Admin@123"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "email": "...",
      "nombre": "...",
      "apellido": "...",
      "role": "DIRECTIVO"
    }
  }
}
```

---

### Usuarios

| Método   | Ruta              | Roles                                  | Descripción                             |
| -------- | ----------------- | -------------------------------------- | --------------------------------------- |
| `GET`    | `/users`          | `DIRECTIVO`                            | Listar usuarios (paginado, con filtros) |
| `GET`    | `/users/:id`      | `DIRECTIVO`                            | Obtener usuario por ID                  |
| `POST`   | `/users`          | `DIRECTIVO`                            | Crear usuario                           |
| `PUT`    | `/users/:id`      | `DIRECTIVO`                            | Actualizar usuario                      |
| `DELETE` | `/users/:id`      | `DIRECTIVO`                            | Desactivar usuario                      |
| `GET`    | `/users/docentes` | `DIRECTIVO`, `SECRETARIO`              | Listar docentes (para selects)          |
| `GET`    | `/users/alumnos`  | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR` | Listar alumnos                          |

**Query params para `GET /users`:** `role`, `search`, `activo`, `page` (default `1`), `limit` (default `10`).

**Body para `POST /users`:**

```json
{
  "email": "docente@escuela.edu.ar",
  "password": "Docente@2026",
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "role": "DOCENTE"
}
```

**Validación de contraseña:** mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial (`@$!%*?&`).

---

### Cursos

| Método   | Ruta           | Roles                                  | Descripción                                |
| -------- | -------------- | -------------------------------------- | ------------------------------------------ |
| `GET`    | `/courses`     | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR` | Listar cursos                              |
| `GET`    | `/courses/:id` | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR` | Detalle del curso (con materias y alumnos) |
| `POST`   | `/courses`     | `DIRECTIVO`, `SECRETARIO`              | Crear curso                                |
| `PUT`    | `/courses/:id` | `DIRECTIVO`, `SECRETARIO`              | Actualizar curso                           |
| `DELETE` | `/courses/:id` | `DIRECTIVO`, `SECRETARIO`              | Desactivar curso                           |

**Query params para `GET /courses`:** `anio`, `activo`.

**Body para `POST /courses`:**

```json
{
  "nombre": "2°B",
  "anio": 2026,
  "turno": "TARDE"
}
```

---

### Materias

| Método   | Ruta            | Roles                                             | Descripción                            |
| -------- | --------------- | ------------------------------------------------- | -------------------------------------- |
| `GET`    | `/subjects`     | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR`, `DOCENTE` | Listar materias                        |
| `GET`    | `/subjects/:id` | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR`, `DOCENTE` | Detalle (con alumnos y calificaciones) |
| `POST`   | `/subjects`     | `DIRECTIVO`, `SECRETARIO`                         | Crear materia                          |
| `PUT`    | `/subjects/:id` | `DIRECTIVO`, `SECRETARIO`                         | Actualizar materia                     |
| `DELETE` | `/subjects/:id` | `DIRECTIVO`, `SECRETARIO`                         | Desactivar materia                     |

**Query params para `GET /subjects`:** `cursoId`, `activo`.

**Body para `POST /subjects`:**

```json
{
  "nombre": "Matemática",
  "cursoId": "<uuid-del-curso>",
  "docenteId": "<uuid-del-docente>"
}
```

---

### Inscripciones

| Método   | Ruta                       | Roles                                  | Descripción                      |
| -------- | -------------------------- | -------------------------------------- | -------------------------------- |
| `GET`    | `/enrollments`             | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR` | Listar inscripciones             |
| `POST`   | `/enrollments`             | `DIRECTIVO`, `SECRETARIO`              | Inscribir alumno en curso        |
| `DELETE` | `/enrollments/:id`         | `DIRECTIVO`, `SECRETARIO`              | Eliminar inscripción             |
| `GET`    | `/enrollments/history/:id` | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR` | Historial académico de un alumno |

**Query params para `GET /enrollments`:** `cursoId`, `alumnoId`, `anio`, `activo`.

**Body para `POST /enrollments`:**

```json
{
  "alumnoId": "<uuid-del-alumno>",
  "cursoId": "<uuid-del-curso>",
  "anio": 2026
}
```

> **Regla de negocio:** un alumno solo puede tener una inscripción activa por año lectivo.

---

### Calificaciones

| Método   | Ruta                                           | Roles                                             | Descripción                            |
| -------- | ---------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `GET`    | `/grades`                                      | `DIRECTIVO`, `SECRETARIO`, `PRECEPTOR`, `DOCENTE` | Listar calificaciones                  |
| `POST`   | `/grades`                                      | `DOCENTE`                                         | Registrar calificación                 |
| `PUT`    | `/grades/:id`                                  | `DOCENTE`                                         | Actualizar calificación                |
| `DELETE` | `/grades/:id`                                  | `DOCENTE`                                         | Eliminar calificación                  |
| `GET`    | `/grades/teacher/subjects`                     | `DOCENTE`                                         | Materias asignadas al docente logueado |
| `GET`    | `/grades/teacher/subjects/:materiaId/students` | `DOCENTE`                                         | Alumnos de una materia                 |
| `GET`    | `/grades/student/info`                         | `ALUMNO`                                          | Información y calificaciones propias   |

**Query params para `GET /grades`:** `materiaId`, `alumnoId`, `periodo`.

**Body para `POST /grades`:**

```json
{
  "alumnoId": "<uuid>",
  "materiaId": "<uuid>",
  "nota": 8.5,
  "periodo": "PRIMER_TRIMESTRE",
  "observaciones": "Buen desempeño"
}
```

> **Validación:** `nota` debe estar entre `0` y `10`. Solo se admite una calificación por alumno, materia y período.

---

## Formato de respuesta

Todas las respuestas siguen la misma estructura:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

**Éxito:**

```json
{ "success": true, "data": { ... } }
```

**Error:**

```json
{ "success": false, "error": "Descripción del error" }
```

---

## Usuarios de prueba (seed)

El script `npm run prisma:seed` crea los siguientes usuarios. Todos con contraseña: `Admin@123`.

| Email                       | Rol          |
| --------------------------- | ------------ |
| `directivo@escuela.edu.ar`  | `DIRECTIVO`  |
| `secretario@escuela.edu.ar` | `SECRETARIO` |
| `preceptor@escuela.edu.ar`  | `PRECEPTOR`  |
| `docente@escuela.edu.ar`    | `DOCENTE`    |
| `alumno@escuela.edu.ar`     | `ALUMNO`     |

También se crea el curso `1°A` (año 2026, turno MAÑANA) como dato de ejemplo.

---

## Despliegue en Render

El archivo `render.yaml` configura el despliegue automático en [Render](https://render.com).

**Comando de build:**

```
npm ci && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build
```

**Variables de entorno a configurar manualmente en el dashboard de Render:**

| Variable         | Descripción                          |
| ---------------- | ------------------------------------ |
| `DATABASE_URL`   | URL de conexión a PostgreSQL         |
| `CORS_ORIGIN`    | URL del frontend en producción       |
| `JWT_SECRET`     | Se genera automáticamente por Render |
| `JWT_EXPIRES_IN` | `24h` (valor por defecto)            |
| `NODE_ENV`       | `production`                         |
