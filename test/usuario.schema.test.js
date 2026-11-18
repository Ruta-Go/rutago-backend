require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");
const schema = require("../src/schemas/usuario.schema");

const datosRegistro = {
  nombres: "Ana",
  apellidos: "Perez",
  correo: "ANA@ejemplo.com",
  contrasena: "Segura123",
};

test("el registro ignora cualquier rolId enviado por el cliente", () => {
  const resultado = schema.registro.parse({ ...datosRegistro, rolId: 1 });
  assert.equal("rolId" in resultado, false);
  assert.equal(resultado.correo, "ana@ejemplo.com");
});

test("el registro rechaza contraseñas débiles", () => {
  assert.throws(() =>
    schema.registro.parse({ ...datosRegistro, contrasena: "123" }),
  );
  assert.throws(() =>
    schema.registro.parse({ ...datosRegistro, contrasena: "soloLetras" }),
  );
});

test("el perfil no permite cambiar rol, contraseña ni activo", () => {
  const resultado = schema.actualizarPerfil.parse({
    nombres: "Ana Maria",
    rolId: 1,
    contrasena: "Otra1234",
    activo: false,
  });
  assert.deepEqual(resultado, { nombres: "Ana Maria" });
});

test("el cambio de contraseña del perfil exige la actual", () => {
  assert.throws(() =>
    schema.cambiarContrasenaPerfil.parse({ nuevaContrasena: "Nueva1234" }),
  );
  const ok = schema.cambiarContrasenaPerfil.parse({
    contrasenaActual: "Segura123",
    nuevaContrasena: "Nueva1234",
  });
  assert.equal(ok.nuevaContrasena, "Nueva1234");
});
