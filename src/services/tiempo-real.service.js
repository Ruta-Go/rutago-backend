"use strict";

const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");
const config = require("../config");
const { ROLES, NOMBRES_ROL } = require("../config/roles");
const { ESTADOS_VIAJE } = require("../config/estados");
const usuarioRepository = require("../repositories/usuario.repository");
const {
  Conductor,
  Entidad,
  Pasajero,
  Viaje,
  ViajePasajero,
  Vehiculo,
} = require("../models");

let servidorWebsocket = null;
const servidoresAdjuntos = new WeakSet();
const salasPorCliente = new WeakMap();

const salaValida = /^(usuario|rol|vehiculo|viaje):\d+$/;
const idDeSala = (sala) => Number(sala.split(":")[1]);

/** Verifica el JWT del handshake. Nunca se fía del rol que viaja en el token. */
exports.autenticar = async (token) => {
  if (!token) throw new Error("TOKEN_REQUERIDO");
  const decodificado = jwt.verify(token, config.jwt.secreto);
  if (decodificado.type === "refresh") throw new Error("TOKEN_INVALIDO");

  const usuario = await usuarioRepository.buscarPorId(decodificado.id);
  if (!usuario || usuario.activo === false) throw new Error("USUARIO_INACTIVO");

  return {
    id: usuario.id,
    rolId: usuario.rolId,
    nombreRol: NOMBRES_ROL[usuario.rolId] || "Desconocido",
  };
};

const conductorDe = (usuarioId) =>
  Conductor.findOne({ where: { usuarioId } });
const pasajeroDe = ( usuarioId) =>
  Pasajero.findOne({ where: { usuarioId } });
const entidadDe = (usuarioId) => Entidad.findOne({ where: { usuarioId } });

async function puedeSuscribirse(usuario, sala) {
  const id = idDeSala(sala);
  if (!Number.isInteger(id) || id <= 0) return false;

  if (sala.startsWith("usuario:")) return id === Number(usuario.id);
  if (sala.startsWith("rol:")) return id === Number(usuario.rolId);

  if (sala.startsWith("vehiculo:")) {
    if (usuario.rolId === ROLES.ADMIN) return true;

    const vehiculo = await Vehiculo.findByPk(id);
    if (!vehiculo) return false;

    if (usuario.rolId === ROLES.ENTIDAD) {
      const entidad = await entidadDe(usuario.id);
      return Boolean(entidad && Number(vehiculo.entidadId) === Number(entidad.id));
    }

    if (usuario.rolId === ROLES.CONDUCTOR) {
      const conductor = await conductorDe(usuario.id);
      if (!conductor) return false;
      const viaje = await Viaje.findOne({
        where: {
          conductorId: conductor.id,
          vehiculoId: id,
          estadoId: [ESTADOS_VIAJE.ACEPTADO, ESTADOS_VIAJE.EN_CURSO],
        },
      });
      return Boolean(viaje);
    }

    if (usuario.rolId === ROLES.PASAJERO) {
      const pasajero = await pasajeroDe(usuario.id);
      if (!pasajero) return false;
      const viaje = await Viaje.findOne({
        where: {
          vehiculoId: id,
          estadoId: [ESTADOS_VIAJE.ACEPTADO, ESTADOS_VIAJE.EN_CURSO],
        },
        include: [
          {
            model: ViajePasajero,
            as: "pasajeros",
            where: { pasajeroId: pasajero.id },
            attributes: ["id"],
          },
        ],
      });
      return Boolean(viaje);
    }

    return false;
  }

  if (sala.startsWith("viaje:")) {
    if (usuario.rolId === ROLES.ADMIN) return true;
    const viaje = await Viaje.findByPk(id);
    if (!viaje) return false;

    if (usuario.rolId === ROLES.CONDUCTOR) {
      const conductor = await conductorDe(usuario.id);
      return Boolean(conductor && Number(viaje.conductorId) === Number(conductor.id));
    }

    if (usuario.rolId === ROLES.PASAJERO) {
      const pasajero = await pasajeroDe(usuario.id);
      if (!pasajero) return false;
      const inscripcion = await ViajePasajero.findOne({
        where: { viajeId: id, pasajeroId: pasajero.id },
      });
      return Boolean(inscripcion);
    }

    if (usuario.rolId === ROLES.ENTIDAD) {
      const entidad = await entidadDe(usuario.id);
      if (!entidad || !viaje.vehiculoId) return false;
      const vehiculo = await Vehiculo.findByPk(viaje.vehiculoId);
      return Boolean(vehiculo && Number(vehiculo.entidadId) === Number(entidad.id));
    }

    return false;
  }

  return false;
}
exports.puedeSuscribirse = puedeSuscribirse;

const enviar = (sala, mensaje) => {
  if (!servidorWebsocket) return 0;
  let enviados = 0;
  const texto = JSON.stringify({
    ...mensaje,
    fecha: new Date().toISOString(),
  });

  for (const cliente of servidorWebsocket.clients) {
    const salas = salasPorCliente.get(cliente);
    if (
      cliente.readyState === WebSocket.OPEN &&
      salas &&
      salas.has(sala)
    ) {
      cliente.send(texto);
      enviados += 1;
    }
  }
  return enviados;
};

/** Publica la ubicación real reportada por un conductor. */
exports.publicarUbicacion = (vehiculoId, ubicacion, viajeId = null) => {
  const mensaje = {
    tipo: "ubicacion",
    payload: {
      vehiculoId: Number(vehiculoId),
      viajeId: viajeId ? Number(viajeId) : null,
      ...ubicacion,
    },
  };
  let receptores = enviar(`vehiculo:${vehiculoId}`, mensaje);
  if (viajeId) receptores += enviar(`viaje:${viajeId}`, mensaje);
  return receptores;
};

/** Publica un evento directo a un usuario (notificaciones, cambios de estado). */
exports.publicarAUsuario = (usuarioId, tipo, payload) =>
  enviar(`usuario:${usuarioId}`, { tipo, payload });

/** Publica un evento a todos los clientes con un rol determinado. */
exports.publicarARol = (rolId, tipo, payload) =>
  enviar(`rol:${rolId}`, { tipo, payload });

function configurarConexion(cliente, usuario) {
  const salas = new Set([`usuario:${usuario.id}`, `rol:${usuario.rolId}`]);
  salasPorCliente.set(cliente, salas);

  cliente.send(
    JSON.stringify({
      tipo: "conectado",
      payload: { usuarioId: usuario.id, rol: usuario.nombreRol, salas: [...salas] },
      fecha: new Date().toISOString(),
    }),
  );

  cliente.on("message", async (bruto) => {
    let mensaje;
    try {
      mensaje = JSON.parse(bruto.toString());
    } catch {
      cliente.send(JSON.stringify({ tipo: "error", payload: { mensaje: "JSON inválido" } }));
      return;
    }

    const accion = mensaje.tipo || mensaje.type;
    const sala = mensaje.sala || mensaje.room;
    if (!sala || !salaValida.test(sala)) {
      cliente.send(JSON.stringify({ tipo: "error", payload: { mensaje: "Sala inválida" } }));
      return;
    }

    try {
      if (accion === "suscribirse" || accion === "subscribe") {
        if (!(await puedeSuscribirse(usuario, sala))) {
          cliente.send(
            JSON.stringify({ tipo: "error", payload: { mensaje: "Sin permiso sobre la sala", sala } }),
          );
          return;
        }
        salas.add(sala);
        cliente.send(JSON.stringify({ tipo: "suscrito", payload: { sala } }));
        return;
      }

      if (accion === "desuscribirse" || accion === "unsubscribe") {
        salas.delete(sala);
        cliente.send(JSON.stringify({ tipo: "desuscrito", payload: { sala } }));
        return;
      }

      cliente.send(JSON.stringify({ tipo: "error", payload: { mensaje: "Acción desconocida" } }));
    } catch (error) {
      console.error("[websocket] error al gestionar sala:", error.message);
      cliente.send(JSON.stringify({ tipo: "error", payload: { mensaje: "No se pudo validar la sala" } }));
    }
  });
}

/** Adjunta el WebSocket al mismo servidor HTTP, en la ruta /ws. */
exports.adjuntar = (servidor) => {
  if (!servidor || servidoresAdjuntos.has(servidor)) return;
  servidoresAdjuntos.add(servidor);

  if (!servidorWebsocket) {
    servidorWebsocket = new WebSocketServer({ noServer: true });
  }

  servidor.on("upgrade", (peticion, socket, cabecera) => {
    let url;
    try {
      url = new URL(peticion.url, "http://localhost");
    } catch {
      socket.destroy();
      return;
    }
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get("token");
    exports
      .autenticar(token)
      .then((usuario) => {
        servidorWebsocket.handleUpgrade(peticion, socket, cabecera, (cliente) => {
          configurarConexion(cliente, usuario);
        });
      })
      .catch(() => {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
      });
  });
};

/** Sólo para pruebas: cierra el servidor WebSocket sin tocar el HTTP. */
exports.cerrar = async () => {
  if (!servidorWebsocket) return;
  const actual = servidorWebsocket;
  servidorWebsocket = null;
  await new Promise((resolver) => actual.close(resolver));
};
