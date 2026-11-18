const test = require("node:test");
const assert = require("node:assert/strict");
const Sequelize = require("sequelize");
const migracion = require("../src/migrations/20261118000001-create-notificaciones");

test("la migración crea Notificaciones sólo si no existe", async () => {
  const creadas = [];
  await migracion.up(
    {
      describeTable: async () => {
        throw new Error("no existe");
      },
      createTable: async (nombre) => {
        creadas.push(nombre);
      },
    },
    Sequelize,
  );
  assert.deepEqual(creadas, ["Notificaciones"]);
});

test("la migración no recreate ni modifica una tabla ya presente", async () => {
  let llamadasCreate = 0;
  await migracion.up(
    {
      describeTable: async () => ({ id: {} }),
      createTable: async () => {
        llamadasCreate += 1;
      },
    },
    Sequelize,
  );
  assert.equal(llamadasCreate, 0);
});

test("el rollback no borra la tabla ni su historial", async () => {
  await assert.doesNotReject(() => migracion.down());
});
