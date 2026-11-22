#!/usr/bin/env node
/**
 * Seed EXCLUSIVO DE STAGING.
 *
 * Crea exactamente dos cuentas de demostración: Conductor y Pasajero.
 * Nunca debe ejecutarse contra la base de producción: el script exige que
 * NODE_ENV=development y que el nombre de la base contenga "staging".
 *
 * Es idempotente: los registros con clave natural se crean con findOrCreate
 * y los viajes sólo se generan si la tabla está vacía. No actualiza
 * contraseñas de usuarios existentes.
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
  Notificacion,
  Barrio,
  sequelize,
} = db;

const CONDUCTOR_EMAIL = "demo.conductor@rutago.staging";
const PASAJERO_EMAIL = "demo.pasajero@rutago.staging";

const ROL = { CONDUCTOR: 2, PASAJERO: 3 };
const ESTADO_VIAJE = { BUSCANDO: 1, ACEPTADO: 2, EN_CURSO: 3 };
const ESTADO_VEHICULO = { EN_RUTA: 2 };
const ESTADO_CONDUCTOR = { EN_VIAJE: 2 };
const TIPO_DOC_CC = 1;

const RUTAS = [
  {
    nombre: "Ruta 1 · La Marina",
    origenId: 7,
    destinoId: 6,
    descripcion: "Universidad - Barrio La Marina",
    distanciaKm: 8.4,
    tiempoEstimadoMinutos: 26,
    costo: 2800,
    paradas: ["La Marina", "Miraflores", "Juan 23", "El Porvenir"],
    horarios: ["13:30:00", "17:00:00"],
  },
  {
    nombre: "Ruta 2 · El Triunfo",
    origenId: 7,
    destinoId: 12,
    descripcion: "Universidad - Barrio El Triunfo",
    distanciaKm: 11.2,
    tiempoEstimadoMinutos: 34,
    costo: 3200,
    paradas: ["El Triunfo", "La 69", "Gran Colombiana", "Nueva Granada"],
    horarios: ["14:00:00", "17:30:00"],
  },
];

/** Coordenadas ya presentes en el seed histórico del proyecto; no se inventan. */
const VEHICULO = {
  placa: "STG-001",
  marca: "Hyundai",
  modelo: "Atos Prime",
  color: "Blanco",
  capacidadPasajeros: 4,
  tipoVehiculo: "Automóvil",
  numeroInterno: "STG-001",
  estadoId: ESTADO_VEHICULO.EN_RUTA,
  latitud: 3.4519,
  longitud: -76.5323,
};

async function asegurar(modelo, where, values) {
  return modelo.findOrCreate({ where, defaults: values });
}

function validarEntorno() {
  const entorno = String(process.env.NODE_ENV || "").toLowerCase();
  const base = String(process.env.DB_NAME || "").toLowerCase();
  if (entorno !== "development" || !base.includes("staging")) {
    throw new Error(
      "SEED_STAGING_RECHAZADO: este script sólo corre con NODE_ENV=development " +
        "y una DB_NAME que contenga 'staging'.",
    );
  }
  const password = process.env.STAGING_DEMO_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Falta STAGING_DEMO_PASSWORD (12 caracteres mínimo).");
  }
  return password;
}

async function main() {
  const passwordDemo = validarEntorno();
  const hash = await bcrypt.hash(passwordDemo, 10);
  const ahora = new Date();
  const enHoras = (h) => new Date(ahora.getTime() + h * 60 * 60 * 1000);
  const fechaInicio = "2026-01-01";
  const fechaFin = "2027-12-31";

  const barriosPorNombre = {};
  for (const barrio of await Barrio.findAll()) barriosPorNombre[barrio.nombre] = barrio.id;
  for (const nuevo of [
    { nombre: "La Marina", comunaId: 6 },
    { nombre: "La 69", comunaId: 12 },
  ]) {
    if (!barriosPorNombre[nuevo.nombre]) {
      const [registro] = await asegurar(Barrio, { nombre: nuevo.nombre }, nuevo);
      barriosPorNombre[nuevo.nombre] = registro.id;
    }
  }
  const idDeBarrio = (nombre) => {
    const id = barriosPorNombre[nombre];
    if (!id) throw new Error(`Falta el barrio del catálogo: ${nombre}`);
    return id;
  };

  const [usuarioConductor] = await asegurar(
    Usuario,
    { correo: CONDUCTOR_EMAIL },
    {
      nombres: "Demo",
      apellidos: "Conductor",
      correo: CONDUCTOR_EMAIL,
      contrasena: hash,
      rolId: ROL.CONDUCTOR,
      activo: true,
    },
  );
  const [usuarioPasajero] = await asegurar(
    Usuario,
    { correo: PASAJERO_EMAIL },
    {
      nombres: "Demo",
      apellidos: "Pasajero",
      correo: PASAJERO_EMAIL,
      contrasena: hash,
      rolId: ROL.PASAJERO,
      activo: true,
    },
  );

  const [entidad] = await asegurar(
    Entidad,
    { nit: "STG-001" },
    {
      usuarioId: usuarioConductor.id,
      razonSocial: "Transportes Staging RutaGo",
      nit: "STG-001",
      telefonoContacto: "6000000000",
      direccion: "Buenaventura, Valle del Cauca",
      correo: CONDUCTOR_EMAIL,
    },
  );

  const [conductor] = await asegurar(
    Conductor,
    { usuarioId: usuarioConductor.id },
    {
      usuarioId: usuarioConductor.id,
      licenciaConducir: "STG-C-001",
      estadoId: ESTADO_CONDUCTOR.EN_VIAJE,
    },
  );
  const [pasajero] = await asegurar(
    Pasajero,
    { usuarioId: usuarioPasajero.id },
    {
      usuarioId: usuarioPasajero.id,
      telefono: "3000000001",
      direccion: "Buenaventura, Valle del Cauca",
      tipoDocumentoId: TIPO_DOC_CC,
      barrioId: idDeBarrio("El Triunfo"),
      numeroDocumento: "STG-1001",
      fechaNacimiento: "2000-01-01",
    },
  );

  const rutas = [];
  const horarios = [];
  for (const dato of RUTAS) {
    const [ruta] = await asegurar(
      Ruta,
      { nombre: dato.nombre },
      {
        nombre: dato.nombre,
        origenId: dato.origenId,
        destinoId: dato.destinoId,
        descripcion: dato.descripcion,
        distanciaKm: dato.distanciaKm,
        tiempoEstimadoMinutos: dato.tiempoEstimadoMinutos,
        costo: dato.costo,
      },
    );
    rutas.push(ruta);

    for (const [indice, nombre] of dato.paradas.entries()) {
      await asegurar(
        RutaBarrio,
        { rutaId: ruta.id, barrioId: idDeBarrio(nombre) },
        { rutaId: ruta.id, barrioId: idDeBarrio(nombre), orden: indice + 1 },
      );
    }
    for (const horaSalida of dato.horarios) {
      const [horario] = await asegurar(
        Horario,
        { rutaId: ruta.id, horaSalida },
        {
          rutaId: ruta.id,
          horaSalida,
          frecuenciaMinutos: 30,
          diasSemana: "1,2,3,4,5",
          fechaInicio,
          fechaFin,
        },
      );
      horarios.push(horario);
    }
  }

  const [vehiculo] = await asegurar(
    Vehiculo,
    { placa: VEHICULO.placa },
    { ...VEHICULO, entidadId: entidad.id, ultimaActualizacion: ahora },
  );

  let viajes = [];
  if ((await Viaje.count()) === 0) {
    const datosViajes = [
      {
        etiqueta: "BUSCANDO",
        conductorId: null,
        vehiculoId: null,
        horarioId: horarios[0].id,
        estadoId: ESTADO_VIAJE.BUSCANDO,
        horaInicio: enHoras(2),
      },
      {
        etiqueta: "ACEPTADO",
        conductorId: conductor.id,
        vehiculoId: vehiculo.id,
        horarioId: horarios[0].id,
        estadoId: ESTADO_VIAJE.ACEPTADO,
        horaInicio: enHoras(1),
      },
      {
        etiqueta: "EN_CURSO",
        conductorId: conductor.id,
        vehiculoId: vehiculo.id,
        horarioId: horarios[2].id,
        estadoId: ESTADO_VIAJE.EN_CURSO,
        horaInicio: new Date(ahora.getTime() - 35 * 60 * 1000),
      },
    ];
    for (const dato of datosViajes) {
      const viaje = await Viaje.create({
        conductorId: dato.conductorId,
        vehiculoId: dato.vehiculoId,
        horarioId: dato.horarioId,
        estadoId: dato.estadoId,
        precioEstimado: 4500,
        horaInicio: dato.horaInicio,
        horaFin: null,
        kilometrosRecorridos: null,
      });
      viajes.push({ viaje, etiqueta: dato.etiqueta });
    }
    console.log(`Viajes creados: ${viajes.length}`);
  } else {
    viajes = (await Viaje.findAll()).map((viaje) => ({ viaje }));
    console.log("Viajes: la tabla ya tenía registros, se omiten.");
  }

  const enCurso = viajes.find((v) => v.etiqueta === "EN_CURSO")?.viaje ?? viajes[0]?.viaje;
  if (enCurso) {
    await asegurar(
      ViajePasajero,
      { viajeId: enCurso.id, pasajeroId: pasajero.id },
      { viajeId: enCurso.id, pasajeroId: pasajero.id },
    );
    await asegurar(
      Notificacion,
      { usuarioId: usuarioPasajero.id, titulo: "Tu viaje está en curso" },
      {
        usuarioId: usuarioPasajero.id,
        viajeId: enCurso.id,
        tipo: "VIAJE_EN_CURSO",
        titulo: "Tu viaje está en curso",
        mensaje: "El conductor de la ruta aceptó tu solicitud y está en camino.",
        datos: JSON.stringify({ viajeId: enCurso.id }),
        leida: false,
      },
    );
    await asegurar(
      Notificacion,
      { usuarioId: usuarioConductor.id, titulo: "Tienes un viaje asignado" },
      {
        usuarioId: usuarioConductor.id,
        viajeId: enCurso.id,
        tipo: "VIAJE_ASIGNADO",
        titulo: "Tienes un viaje asignado",
        mensaje: "Revisa el panel del conductor para ver los datos del viaje.",
        datos: JSON.stringify({ viajeId: enCurso.id }),
        leida: false,
      },
    );
  }

  console.log("Cuentas demo:");
  console.log(`  ${CONDUCTOR_EMAIL} (Conductor)`);
  console.log(`  ${PASAJERO_EMAIL} (Pasajero)`);
  console.log(`Rutas: ${rutas.length}; horarios: ${horarios.length}; viajes: ${viajes.length}`);
  console.log("La contraseña demo se tomó de STAGING_DEMO_PASSWORD y no se imprime.");

  await sequelize.close();
}

main().catch((error) => {
  console.error("Error en seed-staging:", error.message);
  process.exit(1);
});
