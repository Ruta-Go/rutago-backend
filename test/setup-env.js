// Valores ficticios ONLY para pruebas locales. Nunca se usa .env real.
const valores = {
  NODE_ENV: "test",
  PORT: "8082",
  API_URL: "http://localhost:8082",
  HOST: "localhost",
  PORT_DB: "5432",
  USER_DB: "postgres",
  DB_PASSWORD: "password_de_prueba",
  DB_NAME: "rutago_test",
  CORS_ORIGIN: "http://localhost:5173",
  FRONTEND_URL: "http://localhost:5173",
  JWT_SECRET: "secreto_de_prueba_no_usar_en_produccion_123",
  JWT_EXPIRES_IN: "8h",
  JWT_REFRESH_EXPIRES_IN: "7d",
};

for (const [clave, valor] of Object.entries(valores)) {
  if (!process.env[clave]) process.env[clave] = valor;
}
