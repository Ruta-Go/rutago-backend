const test = require("node:test");
const assert = require("node:assert/strict");
const Sequelize = require("sequelize");
const migracion = require("../src/migrations/20261122190000-create-dispositivos-push");

test("la migración crea DispositivosPush sólo si no existe", async () => {
  const creadas = [];
  await migracion.up(
    {
      describeTable: async () => {
        throw new Error("no existe");
      },
      createTable: async (nombre) => {
        creadas.push(nombre);
      },
      addIndex: async () => {},
    },
    Sequelize,
  );
  assert.deepEqual(creadas, ["DispositivosPush"]);
});

test("la migración no recrea una tabla ya presente", async () => {
  let llamadasCreate = 0;
  let llamadasIndex = 0;
  await migracion.up(
    {
      describeTable: async () => ({ id: {} }),
      createTable: async () => {
        llamadasCreate += 1;
      },
      addIndex: async () => {
        llamadasIndex += 1;
      },
    },
    Sequelize,
  );
  assert.equal(llamadasCreate, 0);
  assert.equal(llamadasIndex, 0);
});

test("el rollback no borra tokens reales", async () => {
  await assert.doesNotReject(() => migracion.down());
});
