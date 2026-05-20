# DriverLog

DriverLog es una aplicación de gestión financiera para conductores de plataformas de transporte. Se organiza en dos carpetas principales:

- `/backend`: API de Express con Prisma y lógica de cálculo de ganancias.
- `/frontend`: Aplicación React con Vite y Tailwind CSS.

## Estructura del proyecto

- `backend/`
  - `src/app.ts`: servidor Express y configuración básica.
  - `src/routes/`: rutas de viajes, usuarios y administración.
  - `src/controllers/`: controladores de trip, user y admin.
  - `src/services/`: lógica de negocio, cálculo de ganancia real y métricas agregadas.
  - `src/middleware/roleMiddleware.ts`: protección de rutas basada en roles.
  - `prisma/schema.prisma`: esquema de Prisma.
- `frontend/`
  - `src/App.tsx`: rutas, layout y rol de acceso.
  - `src/components/ProtectedRoute.tsx`: componente para proteger rutas según rol.
  - `src/components/TripForm.tsx`: formulario para registrar viajes.
  - `src/pages/DriverDashboard.tsx`: vista para conductores.
  - `src/pages/AdminPanel.tsx`: panel de administración para SUPERUSER.
  - `src/hooks/useAuth.tsx`: contexto de autenticación mock.
  - `src/services/api.ts`: llamadas al backend.
  - `src/types.ts`: tipos compartidos `User`, `Vehicle`, `Trip`, `Role`.

## Backend

### Características

- Modelo `User` con `role String @default("USER")`.
- Cálculo de Ganancia Neta Real:
  - `ingresoBruto - gastoCombustible - (kmRecorridos * depreciaciónPorKm)`
  - `depreciaciónPorKm = (valorCompra - valorReventaEstimado) / vidaUtilKm`
- Rutas protegidas para `SUPERUSER` en `/api/admin`.

### Instrucciones

```bash
cd backend
npm install
cp .env.example .env
# Ajusta DATABASE_URL en backend/.env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Endpoints principales

- `POST /api/trips`
- `GET /api/trips/profit/:userId/:month/:year`
- `GET /api/users/:id`
- `GET /api/admin/stats` (SUPERUSER)
- `GET /api/admin/alerts` (SUPERUSER)

## Frontend

### Características

- React + Vite + Tailwind CSS.
- Sistema de roles:
  - `USER`: Dashboard personal y registro de viajes.
  - `SUPERUSER`: panel global con estadísticas y alertas.
- Protección de rutas con `ProtectedRoute`.

### Instrucciones

```bash
cd frontend
npm install
npm run dev
```

### Desarrollo

- Navega a `http://localhost:5173`
- Usa los botones de la cabecera para simular el login como `USER` o `SUPERUSER`.

## Notas

- El backend y frontend están separados para una arquitectura limpia.
- El frontend utiliza `x-user-role` en las llamadas API para simular autorización de roles.
- El backend compila correctamente con `npm run build`.
- El frontend compila correctamente con `npm run build`.
