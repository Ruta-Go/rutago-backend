require("./setup-env");
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const config = require("../src/config");

const usuarioDePrueba = {
  id: 7,
  rolId: 4,
  nombres: "Usuario",
  correo: "usuario@ejemplo.com",
  activo: true,
};

const rutaRepo = require.resolve("../src/repositories/usuario.repository");
require.cache[rutaRepo] = {
  id: rutaRepo,
  filename: rutaRepo,
  loaded: true,
  exports: {
    buscarPorId: async (id) =>
      Number(id) === usuarioDePrueba.id ? usuarioDePrueba : null,
  },
};

const { verificarToken } = require("../src/middlewares/auth.middleware");

const crearRes = (resolve) => ({
  codigo: null,
  cuerpo: null,
  status(codigo) {
    this.codigo = codigo;
    return this;
  },
  json(cuerpo) {
    this.cuerpo = cuerpo;
    resolve({ res: this, siguiente: false });
    return this;
  },
});

const ejecutar = (token) =>
  new Promise((resolve) => {
    const res = crearRes(resolve);
    verificarToken({ headers: { authorization: `Bearer ${token}` } }, res, () =>
      resolve({ res, siguiente: true }),
    );
  });

test("token inválido responde 401, no 403", async () => {
  const { res, siguiente } = await ejecutar("token-roto");
  assert.equal(siguiente, false);
  assert.equal(res.codigo, 401);
  assert.equal(res.cuerpo.code, "TOKEN_INVALIDO_O_EXPIRADO");
});

test("un refresh token no sirve como token de acceso", async () => {
  const refresh = jwt.sign({ id: 7, type: "refresh" }, config.jwt.secreto, {
    expiresIn: "1h",
  });
  const { res, siguiente } = await ejecutar(refresh);
  assert.equal(siguiente, false);
  assert.equal(res.codigo, 401);
});

test("el rol se toma de la BD, no del contenido del JWT", async () => {
  const token = jwt.sign({ id: 7, rolId: 1 }, config.jwt.secreto, {
    expiresIn: "1h",
  });
  const resultado = await new Promise((resolve) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    verificarToken(req, crearRes(), () => resolve(req.usuario));
  });
  assert.equal(resultado.rolId, 4);
  assert.equal(resultado.id, 7);
});
