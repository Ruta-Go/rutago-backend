#!/usr/bin/env node
/**
 * Seed de datos de prueba para RutaGo.
 *
 * Crea usuarios de cada rol, entidad, conductores, pasajeros, rutas,
 * horarios, vehiculos, viajes e inscripciones de pasajeros.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros
 * (los catálogos de Roles, Estados*, TiposDocumento, Comunas y Barrios
 *  ya vienen cargados por las migraciones y no se tocan).
 *
 * Uso:  npm run seed
 */
"use strict";

const bcrypt = require("bcryptjs");
const db = require("../src/models");

const {
  Usuario,
  Entidad,
  Conductor,
  Pasajero,
  Ruta,
  RutaBarrio,
  Horario,
  Vehiculo,
  Viaje,
  ViajePasajero,
  Barrio,
  sequelize,
} = db;

// ─── Catálogos (creados por las migraciones) ─────────────────────────
const ROL = { ADMIN: 1, CONDUCTOR: 2, PASAJERO: 3, ENTIDAD: 4 };
const ESTADO_VIAJE = {
  BUSCANDO: 1,
  ACEPTADO: 2,
  EN_CURSO: 3,
  FINALIZADO: 4,
  CANCELADO: 5,
};
const ESTADO_VEHICULO = { EN_TERMINAL: 1, EN_RUTA: 2, PROXIMO: 3 };
const ESTADO_CONDUCTOR = { DISPONIBLE: 1, EN_VIAJE: 2, INACTIVO: 3 };
const TIPO_DOC_CC = 1;

const CONTRASENA = "RutaGo2026*";

const USUARIOS = [
  ["Stefany", "Hernández", "admin@rutago.com", ROL.ADMIN],
  ["Cristian", "Vargas", "entidad@rutago.com", ROL.ENTIDAD],
  ["Marcela", "Quintero", "coopersur@rutago.com", ROL.ENTIDAD],
  ["Carlos", "Molina", "conductor1@rutago.com", ROL.CONDUCTOR],
  ["Andrés", "Restrepo", "conductor2@rutago.com", ROL.CONDUCTOR],
  ["Laura", "Baldrés", "conductor3@rutago.com", ROL.CONDUCTOR],
  ["Juan", "Pérez", "pasajero1@rutago.com", ROL.PASAJERO],
  ["María", "Gómez", "pasajero2@rutago.com", ROL.PASAJERO],
  ["Sebastián", "Rojas", "pasajero3@rutago.com", ROL.PASAJERO],
  ["Daniela", "Castro", "pasajero4@rutago.com", ROL.PASAJERO],
];

const ENTIDADES = [
  ["entidad@rutago.com", "Transportes del Valle S.A.S.", "900.456.789-1", "602-1234567", "Calle 5 # 12-20, Buenaventura"],
  ["coopersur@rutago.com", "Cooperativa de Transporte Sur S.A.S.", "900.987.654-2", "602-7654321", "Avenida 6 Oeste # 22-15, Buenaventura"],
];

const CONDUCTORES = [
  ["conductor1@rutago.com", "C.C. 71.234.567"],
  ["conductor2@rutago.com", "C.C. 72.345.678"],
  ["conductor3@rutago.com", "C.C. 73.456.789"],
];

/* Barrios del proyecto: el bus universitario deja a los estudiantes en su
 * barrio al terminar las clases. «La Marina» y «La 69» no venían en el
 * catálogo cargado por las migraciones, así que se crean al inicio. */
const BARRIOS_NUEVOS = [
  { nombre: "La Marina", comunaId: 6 },
  { nombre: "La 69", comunaId: 12 },
];

// barrio refiere al catálogo Barrios (resuelto por nombre en main())
const PASAJEROS = [
  ["pasajero1@rutago.com", "3001112233", "Calle 5 # 12-30", "Miraflores", "1094887722", "1996-04-12"],
  ["pasajero2@rutago.com", "3012223344", "Carrera 8 # 40-12", "Juan 23", "1095334455", "1991-11-03"],
  ["pasajero3@rutago.com", "3023334455", "Avenida 4 Oeste # 18-60", "El Triunfo", "1096778899", "1988-07-25"],
  ["pasajero4@rutago.com", "3034445566", "Calle 15 # 100-20", "Gran Colombiana", "1097001122", "1999-02-17"],
];

/* El origen de las cuatro rutas es la universidad (Comuna 7), que es
 * donde el bus recoge a los estudiantes antes de repartirlos por la
 * ciudad. Cada ruta se llama por el barrio principal al que llega.
 *
 * [nombre, comuna origen, comuna destino, descripción, km, minutos, pasaje]
 */
const RUTAS = [
  ["Ruta 1 · La Marina", 7, 6, "Universidad - Barrio La Marina", 8.4, 26, 2800],
  ["Ruta 2 · El Triunfo", 7, 12, "Universidad - Barrio El Triunfo", 11.2, 34, 3200],
  ["Ruta 3 · Bolívar", 7, 10, "Universidad - Barrio Bolívar", 6.9, 21, 2500],
  ["Ruta 4 · Gran Colombiana", 7, 11, "Universidad - Barrio Gran Colombiana", 10.1, 30, 3000],
];

// barrios de cada ruta, en orden de parada
const RUTA_BARRIOS = {
  "Ruta 1 · La Marina": ["La Marina", "Miraflores", "Juan 23", "El Porvenir"],
  "Ruta 2 · El Triunfo": ["El Triunfo", "La 69", "Gran Colombiana", "Nueva Granada"],
  "Ruta 3 · Bolívar": ["Bolívar", "Las Américas", "Bello Horizonte", "Camilo Torres"],
  "Ruta 4 · Gran Colombiana": ["Gran Colombiana", "El Dorado", "Panamericano", "Nueva Colombia"],
};

// Salidas desde la universidad, después del último bloque de clases.
const HORARIOS = [
  ["Ruta 1 · La Marina", "13:30:00", 30, "1,2,3,4,5"],
  ["Ruta 1 · La Marina", "17:00:00", 30, "1,2,3,4,5"],
  ["Ruta 2 · El Triunfo", "14:00:00", 45, "1,2,3,4,5"],
  ["Ruta 3 · Bolívar", "14:30:00", 25, "1,2,3,4,5"],
  ["Ruta 4 · Gran Colombiana", "13:45:00", 40, "1,2,3,4,5"],
];

// entidadIdx 0 -> primera entidad, 1 -> segunda entidad
const VEHICULOS = [
  ["OKL-123", "Hyundai", "Atos Prime", "Blanco", 4, "Automóvil", "INT-001", 0, ESTADO_VEHICULO.EN_TERMINAL, 3.4519, -76.5323, 0],
  ["OKM-456", "Chevrolet", "Spark GT", "Azul", 4, "Automóvil", "INT-002", 0, ESTADO_VEHICULO.EN_RUTA, 3.4453, -76.5401, 34.5],
  ["OKN-789", "Kia", "Rio 2021", "Gris", 5, "Automóvil", "INT-003", 0, ESTADO_VEHICULO.EN_TERMINAL, 3.4681, -76.5244, 0],
  ["OKP-012", "Toyota", "Hilux", "Blanco", 5, "Camioneta", "INT-004", 1, ESTADO_VEHICULO.PROXIMO, 3.4892, -76.5103, 0],
];

const ymd = (d) => d.toISOString().slice(0, 10);

/** Crea el registro solo si no existe. Devuelve [instancia, fueCreado]. */
async function asegurar(modelo, where, values) {
  return modelo.findOrCreate({ where, defaults: values });
}

async function main() {
  const ahora = new Date();
  const haceMinutos = (m) => new Date(ahora.getTime() - m * 60 * 1000);
  const enHoras = (h) => new Date(ahora.getTime() + h * 60 * 60 * 1000);

  const contrasenaHasheada = await bcrypt.hash(CONTRASENA, 10);

  // ─── 0. Barrios del proyecto ───────────────────────────────────────
  // Se trabaja por nombre, no por id: el catálogo cambia según la
  // migración que haya cargado cada base.
  const barriosPorNombre = {};
  for (const b of await Barrio.findAll()) barriosPorNombre[b.nombre] = b.id;

  let creados = 0;
  for (const nuevo of BARRIOS_NUEVOS) {
    if (barriosPorNombre[nuevo.nombre]) continue;
    const registro = await Barrio.create(nuevo);
    barriosPorNombre[nuevo.nombre] = registro.id;
    creados++;
    console.log(`+ Barrio nuevo: ${nuevo.nombre} (comuna ${nuevo.comunaId})`);
  }
  console.log(`✔ Barrios: ${Object.keys(barriosPorNombre).length} en el catálogo (${creados} nuevos)`);

  /** Barrio a partir de su nombre; falla con un mensaje claro si no está. */
  const idDeBarrio = (nombre) => {
    const id = barriosPorNombre[nombre];
    if (!id) {
      throw new Error(
        `El barrio «${nombre}» no está en el catálogo.\n` +
        "Agrégalo a BARRIOS_NUEVOS en scripts/seed.js y vuelve a correrlo.",
      );
    }
    return id;
  };

  // ─── 1. Usuarios ───────────────────────────────────────────────────
  const usuarios = {};
  for (const [nombres, apellidos, correo, rolId] of USUARIOS) {
    const [registro] = await asegurar(
      Usuario,
      { correo },
      { nombres, apellidos, correo, contrasena: contrasenaHasheada, rolId, activo: true },
    );
    usuarios[correo] = registro;
  }
  console.log(`✔ Usuarios: ${USUARIOS.length}`);

  // ─── 2. Entidades ──────────────────────────────────────────────────
  const entidades = {};
  for (const [correo, razonSocial, nit, telefono, direccion] of ENTIDADES) {
    const [registro] = await asegurar(
      Entidad,
      { nit },
      {
        usuarioId: usuarios[correo].id,
        razonSocial,
        nit,
        telefonoContacto: telefono,
        direccion,
        correo,
      },
    );
    entidades[nit] = registro;
  }
  console.log(`✔ Entidades: ${ENTIDADES.length}`);

  // ─── 3. Conductores ────────────────────────────────────────────────
  const conductores = {};
  for (const [correo, licenciaConducir] of CONDUCTORES) {
    const [registro] = await asegurar(
      Conductor,
      { usuarioId: usuarios[correo].id },
      {
        usuarioId: usuarios[correo].id,
        licenciaConducir,
        estadoId: ESTADO_CONDUCTOR.DISPONIBLE,
      },
    );
    conductores[correo] = registro;
  }
  console.log(`✔ Conductores: ${CONDUCTORES.length}`);

  // ─── 4. Pasajeros ──────────────────────────────────────────────────
  const pasajeros = {};
  for (const [correo, telefono, direccion, barrioNombre, numeroDocumento, fechaNacimiento] of PASAJEROS) {
    const [registro] = await asegurar(
      Pasajero,
      { usuarioId: usuarios[correo].id },
      {
        usuarioId: usuarios[correo].id,
        telefono,
        direccion,
        tipoDocumentoId: TIPO_DOC_CC,
        barrioId: idDeBarrio(barrioNombre),
        numeroDocumento,
        fechaNacimiento,
      },
    );
    pasajeros[correo] = registro;
  }
  console.log(`✔ Pasajeros: ${PASAJEROS.length}`);

  // ─── 5. Rutas ──────────────────────────────────────────────────────
  const rutas = {};
  for (const [nombre, origenId, destinoId, descripcion, distanciaKm, tiempoEstimadoMinutos, costo] of RUTAS) {
    const [registro] = await asegurar(
      Ruta,
      { nombre },
      { nombre, origenId, destinoId, descripcion, distanciaKm, tiempoEstimadoMinutos, costo },
    );
    rutas[nombre] = registro;
  }
  console.log(`✔ Rutas: ${RUTAS.length}`);

  // ─── 6. RutaBarrio (barrios de cada ruta, en orden) ────────────────
  let enlaces = 0;
  for (const [nombreRuta, nombresBarrio] of Object.entries(RUTA_BARRIOS)) {
    const ruta = rutas[nombreRuta];
    for (const [i, nombreBarrio] of nombresBarrio.entries()) {
      const barrioId = idDeBarrio(nombreBarrio);
      const [, creado] = await asegurar(
        RutaBarrio,
        { rutaId: ruta.id, barrioId },
        { rutaId: ruta.id, barrioId, orden: i + 1 },
      );
      if (creado) enlaces++;
    }
  }
  console.log(`✔ RutaBarrio: ${enlaces} enlaces nuevos`);

  // ─── 7. Horarios ───────────────────────────────────────────────────
  const fechaInicio = ymd(haceMinutos(60 * 24 * 30));
  const fechaFin = ymd(enHoras(24 * 180));

  let horariosCreados = 0;
  const horarios = [];
  for (const [nombreRuta, horaSalida, frecuenciaMinutos, diasSemana] of HORARIOS) {
    const ruta = rutas[nombreRuta];
    const [registro, creado] = await asegurar(
      Horario,
      { rutaId: ruta.id, horaSalida },
      { rutaId: ruta.id, horaSalida, frecuenciaMinutos, diasSemana, fechaInicio, fechaFin },
    );
    horarios.push(registro);
    if (creado) horariosCreados++;
  }
  console.log(`✔ Horarios: ${horariosCreados} nuevos`);

  // ─── 8. Vehículos ──────────────────────────────────────────────────
  const vehiculos = {};
  for (const [placa, marca, modelo, color, capacidadPasajeros, tipoVehiculo, numeroInterno, entidadIdx, estadoId, latitud, longitud, velocidadActual] of VEHICULOS) {
    const nit = ENTIDADES[entidadIdx][2];
    const [registro] = await asegurar(
      Vehiculo,
      { placa },
      {
        placa,
        marca,
        modelo,
        color,
        capacidadPasajeros,
        tipoVehiculo,
        numeroInterno,
        entidadId: entidades[nit].id,
        estadoId,
        latitud,
        longitud,
        velocidadActual,
        ultimaActualizacion: ahora,
      },
    );
    vehiculos[placa] = registro;
  }
  console.log(`✔ Vehículos: ${VEHICULOS.length}`);

  // ─── 9. Viajes ─────────────────────────────────────────────────────
  // No tienen clave natural única: si ya existe alguno, se omiten.
  if ((await Viaje.count()) > 0) {
    console.log("↷ Viajes: la tabla ya tiene registros, se omiten.");
  } else {
    const VIAJES = [
      {
        etiqueta: "BUSCANDO",
        conductorId: null,
        vehiculoId: null,
        horarioIdx: 0,
        estadoId: ESTADO_VIAJE.BUSCANDO,
        precioEstimado: 4500,
        horaInicio: enHoras(2),
        horaFin: null,
        kilometrosRecorridos: null,
      },
      {
        etiqueta: "ACEPTADO",
        conductorId: conductores["conductor1@rutago.com"].id,
        vehiculoId: vehiculos["OKL-123"].id,
        horarioIdx: 0,
        estadoId: ESTADO_VIAJE.ACEPTADO,
        precioEstimado: 4500,
        horaInicio: enHoras(1),
        horaFin: null,
        kilometrosRecorridos: null,
      },
      {
        etiqueta: "EN_CURSO",
        conductorId: conductores["conductor2@rutago.com"].id,
        vehiculoId: vehiculos["OKM-456"].id,
        horarioIdx: 2,
        estadoId: ESTADO_VIAJE.EN_CURSO,
        precioEstimado: 6800,
        horaInicio: haceMinutos(35),
        horaFin: null,
        kilometrosRecorridos: null,
      },
      {
        etiqueta: "FINALIZADO",
        conductorId: conductores["conductor3@rutago.com"].id,
        vehiculoId: vehiculos["OKN-789"].id,
        horarioIdx: 3,
        estadoId: ESTADO_VIAJE.FINALIZADO,
        precioEstimado: 5200,
        horaInicio: haceMinutos(180),
        horaFin: haceMinutos(120),
        kilometrosRecorridos: 7.8,
      },
      {
        etiqueta: "CANCELADO",
        conductorId: conductores["conductor1@rutago.com"].id,
        vehiculoId: null,
        horarioIdx: 4,
        estadoId: ESTADO_VIAJE.CANCELADO,
        precioEstimado: 5900,
        horaInicio: haceMinutos(300),
        horaFin: haceMinutos(290),
        kilometrosRecorridos: 0,
      },
    ];

    const viajesCreados = [];
    for (const v of VIAJES) {
      const viaje = await Viaje.create({
        conductorId: v.conductorId,
        vehiculoId: v.vehiculoId,
        horarioId: horarios[v.horarioIdx].id,
        estadoId: v.estadoId,
        precioEstimado: v.precioEstimado,
        horaInicio: v.horaInicio,
        horaFin: v.horaFin,
        kilometrosRecorridos: v.kilometrosRecorridos,
      });
      viajesCreados.push({ viaje, etiqueta: v.etiqueta });
    }
    console.log(`✔ Viajes: ${viajesCreados.length}`);

    // ─── 10. Pasajeros inscritos ─────────────────────────────────────
    const enCurso = viajesCreados.find((v) => v.etiqueta === "EN_CURSO").viaje;
    const finalizado = viajesCreados.find((v) => v.etiqueta === "FINALIZADO").viaje;

    const INSCRIPCIONES = [
      [enCurso.id, pasajeros["pasajero1@rutago.com"].id],
      [enCurso.id, pasajeros["pasajero3@rutago.com"].id],
      [finalizado.id, pasajeros["pasajero2@rutago.com"].id],
      [finalizado.id, pasajeros["pasajero4@rutago.com"].id],
    ];

    let inscripciones = 0;
    for (const [viajeId, pasajeroId] of INSCRIPCIONES) {
      const [, creado] = await asegurar(ViajePasajero, { viajeId, pasajeroId }, { viajeId, pasajeroId });
      if (creado) inscripciones++;
    }
    console.log(`✔ Pasajeros inscritos en viajes: ${inscripciones}`);

    // Estado del conductor coherente con los viajes
    await Conductor.update(
      { estadoId: ESTADO_CONDUCTOR.EN_VIAJE },
      { where: { id: conductores["conductor2@rutago.com"].id } },
    );
    console.log("✔ Estados de conductores sincronizados con los viajes");
  }

  console.log("\n── Datos de prueba listos ──");
  console.log(`Contraseña para todos los usuarios: ${CONTRASENA}\n`);
  const nombreRol = { 1: "Administrador", 2: "Conductor", 3: "Pasajero", 4: "Entidad" };
  for (const [nombres, apellidos, correo, rolId] of USUARIOS) {
    console.log(
      `  ${correo.padEnd(26)} ${`${nombres} ${apellidos}`.padEnd(24)} ${nombreRol[rolId]}`,
    );
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error("\n✖ Error en el seed:", err.message);
  console.error(err);
  process.exit(1);
});