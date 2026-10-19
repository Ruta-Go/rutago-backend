require("dotenv").config();
const { z } = require("zod");

const envSchema = z
  .object({
    PORT: z.string(),
    API_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    HOST: z.string(),
    PORT_DB: z.string(),
    USER_DB: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN es obligatorio"),
    FRONTEND_URL: z.string().url().optional(),
    JWT_SECRET: z
      .string()
      .min(10, "JWT_SECRET debe tener al menos 10 caracteres"),
    JWT_EXPIRES_IN: z.string(),
    JWT_REFRESH_EXPIRES_IN: z.string(),
  })
  .superRefine((datos, ctx) => {
    // En producción no se puede firmar con el valor de ejemplo del
    // .env.example: cualquiera que lo conozca podría fabricar sus propios
    // tokens y entrar como cualquier usuario. En desarrollo no importa.
    if (
      datos.NODE_ENV === "production" &&
      datos.JWT_SECRET === "cambia_esto_por_una_clave_segura"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message:
          "Sigue con el valor de ejemplo. Genera uno propio con:\n" +
          "      node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\n Variables de entorno inválidas:");
  const issues = parsed.error?.issues || parsed.error?.errors || [];
  for (const err of issues) {
    console.error(`   ${err.path?.join(".") || "?"}: ${err.message}`);
  }
  console.error();
  process.exit(1);
}

module.exports = {
  puerto: parsed.data.PORT,
  apiUrl: parsed.data.API_URL,
  entorno: parsed.data.NODE_ENV,

  jwt: {
    secreto: parsed.data.JWT_SECRET,
    expiracion: parsed.data.JWT_EXPIRES_IN,
    refreshExpiracion: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },

  db: {
    host: parsed.data.HOST,
    puerto: parsed.data.PORT_DB,
    usuario: parsed.data.USER_DB,
    password: parsed.data.DB_PASSWORD,
    nombre: parsed.data.DB_NAME,
  },

  cors: {
    origen: parsed.data.CORS_ORIGIN,
  },
};
