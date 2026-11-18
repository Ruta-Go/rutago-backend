#!/usr/bin/env node
'use strict';
require('dotenv').config();
const esProduccion = process.env.NODE_ENV === 'production';
const requeridas = [
  ['NODE_ENV', (v) => Boolean(v)],
  ['PORT', (v) => Boolean(v)],
  ['HOST', (v) => Boolean(v)],
  ['PORT_DB', (v) => Boolean(v)],
  ['USER_DB', (v) => Boolean(v)],
  ['DB_PASSWORD', (v) => Boolean(v)],
  ['DB_NAME', (v) => Boolean(v)],
  ['JWT_SECRET', (v) => Boolean(v) && v.length >= 32],
  ['CORS_ORIGIN', (v) => Boolean(v)],
  ['FRONTEND_URL', (v) => Boolean(v)],
];
if (esProduccion) requeridas.push(['PASSWORD_RESET_URL', (v) => Boolean(v)], ['EMAIL_API_KEY', (v) => Boolean(v)], ['EMAIL_FROM', (v) => Boolean(v)]);
let correctas = 0, faltantes = 0, avisos = 0;
console.log(`Entorno: ${esProduccion ? 'production' : process.env.NODE_ENV || 'sin definir'}`);
console.log('Revisando variables obligatorias (sin mostrar valores):');
for (const [nombre, validar] of requeridas) {
  const valor = process.env[nombre];
  if (validar(valor)) { correctas += 1; console.log(`  [OK]     ${nombre}`); }
  else { faltantes += 1; const detalle = nombre === 'JWT_SECRET' && valor ? 'la clave es demasiado corta (mínimo 32 caracteres)' : 'no está definida'; console.log(`  [FALTA]  ${nombre}: ${detalle}`); }
}
if (!esProduccion) for (const nombre of ['PASSWORD_RESET_URL','EMAIL_API_KEY','EMAIL_FROM']) if (!process.env[nombre]) { avisos += 1; console.log(`  [AVISO]  ${nombre}: opcional en desarrollo, obligatorio en producción`); }
console.log(`Resumen: ${correctas} correctas, ${faltantes} faltantes, ${avisos} avisos.`);
console.log('No se imprimieron valores de variables.');
if (faltantes > 0) process.exitCode = 1;
