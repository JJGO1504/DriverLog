# DriverLog API

API REST para la aplicación DriverLog, que calcula rentabilidad real y depreciación vehicular.

## Tecnologías
- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/JJGO1504/DriverLog.git
   cd DriverLog
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura la base de datos:
   - Crea un archivo `.env` con:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/driverlog"
     ```
   - Ejecuta migraciones:
     ```bash
     npx prisma migrate dev
     ```
   - Genera cliente Prisma:
     ```bash
     npx prisma generate
     ```

4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

5. Construye para producción:
   ```bash
   npm run build
   npm start
   ```

## Endpoints

### POST /api/trips
Registra un nuevo viaje.
- Body: `{ "fecha": "2023-01-01", "ingresoBruto": 100, "kmRecorridos": 50, "gastoCombustible": 20, "userId": 1, "vehicleId": 1 }`

### GET /api/trips/profit/:userId/:month/:year
Obtiene la rentabilidad mensual para un usuario.

## Tests
```bash
npm test
```

## Salud
- GET /health: Verifica el estado del servidor.
