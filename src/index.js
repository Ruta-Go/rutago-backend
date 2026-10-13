const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const config = require("./config");
const errorHandler = require("./middlewares/error.middleware");

const { sequelize } = require("./models");
const authRoutes = require("./routes/auth.routes");
const usuarioRoutes = require("./routes/usuario.routes");
const rolRoutes = require("./routes/rol.routes");
const comunaRoutes = require("./routes/comuna.routes");
const barrioRoutes = require("./routes/barrio.routes");
const vehiculoRoutes = require("./routes/vehiculo.routes");
const conductorRoutes = require("./routes/conductor.routes");
const entidadRoutes = require("./routes/entidad.routes");
const viajeRoutes = require("./routes/viaje.routes");
const rutaRoutes = require("./routes/ruta.routes");
const horarioRoutes = require("./routes/horario.routes");
const pasajeroRoutes = require("./routes/pasajero.routes");
const tipoDocumentoRoutes = require("./routes/tipodocumento.routes");
const estadoVehiculoRoutes = require("./routes/estadovehiculo.routes");
const estadoConductorRoutes = require("./routes/estadoconductor.routes");
const estadoViajeRoutes = require("./routes/estadoviaje.routes");

const app = express();

app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Demasiadas solicitudes, intente de nuevo más tarde",
  },
});

app.use(express.json({ limit: "10kb" }));
const origenesPermitidos = config.cors.origen.split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No autorizado por CORS"));
      }
    },
    credentials: true,
  }),
);

const PORT = config.puerto;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de RutaGo",
      version: "1.0.0",
      description: "Documentación de la API para RutaGo",
    },
    tags: [
      {
        name: "Autenticación",
        description: "Login, registro, recuperación de contraseña",
      },
      { name: "Usuarios", description: "Gestión de usuarios" },
      { name: "Roles", description: "Roles del sistema" },
      { name: "Conductores", description: "Perfiles de conductores" },
      { name: "Pasajeros", description: "Perfiles de pasajeros" },
      { name: "Entidades", description: "Perfiles de entidades" },
      { name: "Vehículos", description: "Gestión de vehículos" },
      { name: "Rutas", description: "Gestión de rutas" },
      { name: "Horarios", description: "Horarios de rutas" },
      { name: "Barrios", description: "Barrios del sistema" },
      { name: "Comunas", description: "Comunas del sistema" },
      { name: "Viajes", description: "Gestión de viajes" },
      { name: "Estados Vehículo", description: "Estados de vehículos" },
      { name: "Estados Conductor", description: "Estados de conductores" },
      { name: "Estados Viaje", description: "Estados de viajes" },
      { name: "Tipos Documento", description: "Tipos de documento" },
    ],
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local (desarrollo) — ej: http://localhost:8082",
      },
      {
        url: config.apiUrl,
        description: "Producción (VPS)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api/auth/login", authLimiter);
app.use("/api/usuarios/registro", authLimiter);
app.use("/api/usuarios/recuperar-contrasena", authLimiter);
app.use("/api/usuarios/cambiar-contrasena", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/comunas", comunaRoutes);
app.use("/api/barrios", barrioRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/conductores", conductorRoutes);
app.use("/api/entidades", entidadRoutes);
app.use("/api/viajes", viajeRoutes);
app.use("/api/rutas", rutaRoutes);
app.use("/api/horarios", horarioRoutes);
app.use("/api/pasajeros", pasajeroRoutes);
app.use("/api/tipos-documento", tipoDocumentoRoutes);
app.use("/api/estados-vehiculo", estadoVehiculoRoutes);
app.use("/api/estados-conductor", estadoConductorRoutes);
app.use("/api/estados-viaje", estadoViajeRoutes);

app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    message: "El servidor de RutaGo está respondiendo",
  });
});

app.use(errorHandler);

const iniciarServidor = async () => {
  if (config.entorno !== "production") {
    await sequelize.sync();
    console.log("Base de datos sincronizada (modo desarrollo).");
  }
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

iniciarServidor().catch((err) => {
  console.error("No se pudo conectar a la base de datos:", err.message);
  process.exit(1);
});
