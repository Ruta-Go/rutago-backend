require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");

const injectar = (ruta, exports) => {
  const absolute = require.resolve(ruta);
  require.cache[absolute] = {
    id: absolute,
    filename: absolute,
    loaded: true,
    exports,
  };
};

const guardados = [];

injectar("../src/repositories/pushToken.repository", {
  registrar: async (datos) => {
    guardados.push(datos);
    return {
      id: guardados.length,
      plataforma: datos.plataforma,
      activo: true,
      token: datos.token,
    };
  },
});

const pushTokenService = require("../src/services/pushToken.service");

test("registra el token recortando espacios y sin devolverlo", async () => {
  guardados.length = 0;

  const resultado = await pushTokenService.registrar(42, {
    token: "  ExpoPushToken[abc123]  ",
    plataforma: "ios",
  });

  assert.deepEqual(resultado, { id: 1, plataforma: "ios", activo: true });
  assert.equal(Object.hasOwn(resultado, "token"), false);
  assert.deepEqual(guardados[0], {
    usuarioId: 42,
    token: "ExpoPushToken[abc123]",
    plataforma: "ios",
  });
});

test("una plataforma desconocida se normaliza sin inventar datos", async () => {
  guardados.length = 0;

  const resultado = await pushTokenService.registrar(7, {
    token: "ExpoPushToken[xyz]",
    plataforma: "blackberry",
  });

  assert.equal(resultado.plataforma, "desconocida");
  assert.equal(guardados[0].plataforma, "desconocida");
});

test("un token vacío se rechaza antes de tocar la base", async () => {
  guardados.length = 0;

  await assert.rejects(
    () => pushTokenService.registrar(7, { token: "   " }),
    /TOKEN_PUSH_OBLIGATORIO/,
  );
  assert.equal(guardados.length, 0);
});
