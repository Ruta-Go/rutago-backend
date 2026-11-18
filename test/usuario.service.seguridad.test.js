require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const estado = { guardado: null, actualizado: null, tokenGuardado: null, usuario: null };

const simularModulo = (ruta, exports) => {
  const resolved = require.resolve(ruta);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
};

simularModulo("../src/repositories/usuario.repository", {
  buscarPorCorreo: async (correo) =>
    estado.usuario && estado.usuario.correo === correo ? estado.usuario : null,
  buscarPorId: async () => estado.usuario,
  guardarUsuario: async (datos) => {
    estado.guardado = datos;
    return { id: 10, ...datos };
  },
  actualizarDatos: async (id, datos) => {
    estado.actualizado = { id, datos };
    return { id, ...datos };
  },
  actualizarRol: async (id, rolId) => ({ id, rolId }),
  actualizarTokenRecuperacion: async (id, token, expira) => {
    estado.tokenGuardado = { id, token, expira };
  },
  buscarPorToken: async () => null,
  actualizarContrasena: async () => true,
});

simularModulo("../src/repositories/rol.repository", {
  obtenerPorId: async (id) => ({ id }),
});

simularModulo("../src/services/correo.service", {
  enviarRecuperacion: async () => ({ modo: "consola" }),
});

const service = require("../src/services/usuario.service");
const { ROLES } = require("../src/config/roles");

test("crearUsuario fuerza el rol pasajero aunque reciba rolId de administrador", async () => {
  await service.crearUsuario({
    nombres: "Ana",
    apellidos: "Perez",
    correo: "ana@ejemplo.com",
    contrasena: "Segura123",
    rolId: ROLES.ADMIN,
  });
  assert.equal(estado.guardado.rolId, ROLES.PASAJERO);
  assert.equal("activo" in estado.guardado, false);
});

test("actualizarDatos descarta campos no permitidos", async () => {
  await service.actualizarDatos(10, {
    nombres: "Ana Maria",
    rolId: ROLES.ADMIN,
    contrasena: "Otra1234",
    activo: false,
    resetPasswordToken: "abc",
  });
  assert.deepEqual(estado.actualizado.datos, { nombres: "Ana Maria" });
});

test("el administrador puede cambiar activo pero no rol ni contraseña", async () => {
  await service.actualizarDatos(
    10,
    { activo: false, rolId: ROLES.CONDUCTOR, contrasena: "Otra1234" },
    true,
  );
  assert.deepEqual(estado.actualizado.datos, { activo: false });
});

test("el token de recuperación se guarda hasheado", async () => {
  estado.usuario = { id: 10, correo: "ana@ejemplo.com" };
  await service.solicitarRecuperacion("ana@ejemplo.com");
  assert.notEqual(estado.tokenGuardado.token.length, 40);
  assert.equal(estado.tokenGuardado.token.length, 64);
  assert.match(estado.tokenGuardado.token, /^[a-f0-9]{64}$/);
});

test("cambiar contraseña rechaza la contraseña actual incorrecta", async () => {
  estado.usuario = {
    id: 10,
    contrasena: await bcrypt.hash("Correcta123", 4),
  };
  await assert.rejects(
    () =>
      service.cambiarContrasenaAutenticado(
        10,
        "Incorrecta123",
        "Nueva1234",
      ),
    /CONTRASENA_ACTUAL_INCORRECTA/,
  );
});
