import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { 
  Equipo, 
  RegistroEstacion, 
  TeamCreationPass, 
  MonitorAuthToken, 
  BroadcastMessage, 
  RallyGlobalConfig 
} from './src/types/rally.ts';
import { 
  generarPassesIniciales,
  TOKENS_INICIALES_MONITORES, 
  PASSWORD_LOGISTICA_FIJA, 
  RUTAS_BASE 
} from './src/data/mockData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'rally_state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerState {
  equipos: Equipo[];
  registros: RegistroEstacion[];
  passesEquipos: TeamCreationPass[];
  tokensMonitores: MonitorAuthToken[];
  broadcasts: BroadcastMessage[];
  globalConfig: RallyGlobalConfig;
}

function getInitialState(): ServerState {
  return {
    equipos: [],
    registros: [],
    passesEquipos: generarPassesIniciales(),
    tokensMonitores: TOKENS_INICIALES_MONITORES.map(t => ({ ...t })),
    broadcasts: [
      {
        id: 'b-init-1',
        titulo: '¡Rally de Datos 2026 en Marcha!',
        mensaje: 'Bienvenido. Escanea el código QR de Logística para activar tu Pasaporte Oficial.',
        tipo: 'info',
        fecha: new Date().toISOString(),
        activo: true
      }
    ],
    globalConfig: {
      rallyIniciado: true,
      horaInicio: new Date().toISOString(),
      tiempoLimiteMinutos: 90,
      pausado: false,
      distanciaMaximaPermitidaMetros: 35,
      passwordLogistica: PASSWORD_LOGISTICA_FIJA
    }
  };
}

function loadState(): ServerState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.equipos)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading state from disk, using clean state:', err);
  }
  const clean = getInitialState();
  saveState(clean);
  return clean;
}

async function syncToMysql(state: ServerState) {
  try {
    const { mysqlService } = await import('./src/db/mysqlClient.ts');
    const pool = mysqlService.getPool();
    if (!pool) return;

    // Sync equipos
    for (const eq of state.equipos) {
      const horaInicio = eq.hora_inicio_rally ? new Date(eq.hora_inicio_rally).toISOString().slice(0, 19).replace('T', ' ') : null;
      const horaFin = eq.hora_fin_rally ? new Date(eq.hora_fin_rally).toISOString().slice(0, 19).replace('T', ' ') : null;

      await pool.query(`
        INSERT INTO equipos (equipo_id, nombre, integrantes, avatar, ruta_id, ruta_asignada, estacion_actual_index, puntaje_total, tiempo_acumulado_segundos, rally_iniciado, hora_inicio_rally, hora_fin_rally, auth_qr_secret)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          puntaje_total = VALUES(puntaje_total),
          tiempo_acumulado_segundos = VALUES(tiempo_acumulado_segundos),
          estacion_actual_index = VALUES(estacion_actual_index),
          rally_iniciado = VALUES(rally_iniciado),
          hora_inicio_rally = VALUES(hora_inicio_rally),
          hora_fin_rally = VALUES(hora_fin_rally);
      `, [
        eq.equipo_id, 
        eq.nombre, 
        JSON.stringify(eq.integrantes), 
        eq.avatar, 
        eq.ruta_id, 
        JSON.stringify(eq.ruta_asignada),
        eq.estacion_actual_index, 
        eq.puntaje_total, 
        eq.tiempo_acumulado_segundos,
        eq.rally_iniciado ? 1 : 0, 
        horaInicio, 
        horaFin, 
        eq.auth_qr_secret || ''
      ]);
    }

    // Sync pases_logistica
    for (const pass of state.passesEquipos) {
      await pool.query(`
        UPDATE pases_logistica 
        SET utilizado = ?, nombre_equipo_creado = ?
        WHERE token = ?;
      `, [pass.utilizado ? 1 : 0, pass.nombre_equipo_creado || null, pass.token]);
    }

    // Sync registros_estaciones
    for (const reg of state.registros) {
      const horaLlegada = new Date(reg.hora_llegada).toISOString().slice(0, 19).replace('T', ' ');
      const horaSalida = reg.hora_salida ? new Date(reg.hora_salida).toISOString().slice(0, 19).replace('T', ' ') : null;

      await pool.query(`
        INSERT INTO registros_estaciones (registro_id, equipo_id, estacion_id, hora_llegada, hora_salida, intentos_usados, puntaje_obtenido, dato_capturado, monitor_id, tiempo_estacion_segundos, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          puntaje_obtenido = VALUES(puntaje_obtenido),
          estado = VALUES(estado),
          hora_salida = VALUES(hora_salida),
          tiempo_estacion_segundos = VALUES(tiempo_estacion_segundos);
      `, [
        reg.registro_id, 
        reg.equipo_id, 
        reg.estacion_id, 
        horaLlegada, 
        horaSalida,
        reg.intentos_usados, 
        reg.puntaje_obtenido, 
        reg.dato_capturado || '',
        reg.monitor_id, 
        reg.tiempo_estacion_segundos || 0, 
        reg.estado
      ]);
    }
  } catch (err) {
    // Non-blocking sync error
  }
}

function saveState(state: ServerState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    syncToMysql(state).catch(() => {});
  } catch (err) {
    console.error('Error saving state to disk:', err);
  }
}

let rallyState: ServerState = loadState();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Route: Get complete shared state (for any device connecting)
  app.get('/api/rally/state', (req, res) => {
    res.json(rallyState);
  });

  // API Route: Database Health & Verification stats
  app.get('/api/rally/db-stats', (req, res) => {
    let fileSizeBytes = 0;
    try {
      if (fs.existsSync(STATE_FILE)) {
        fileSizeBytes = fs.statSync(STATE_FILE).size;
      }
    } catch (e) {}

    res.json({
      status: 'healthy',
      storage: 'json_file_persisted',
      filePath: STATE_FILE,
      fileSizeBytes,
      equiposTotales: rallyState.equipos.length,
      registrosTotales: rallyState.registros.length,
      passesDisponibles: rallyState.passesEquipos.filter(p => !p.utilizado).length,
      passesUtilizados: rallyState.passesEquipos.filter(p => p.utilizado).length,
      monitoresAutorizados: rallyState.tokensMonitores.length,
      passwordLogisticaConfigurada: Boolean(rallyState.globalConfig.passwordLogistica)
    });
  });

  // API Route: MySQL Workbench Schema & Connection Status
  app.get('/api/rally/mysql/status', async (req, res) => {
    const { mysqlService } = await import('./src/db/mysqlClient.ts');
    res.json(mysqlService.getStatus());
  });

  // API Route: Test MySQL Connection (supports credentials in req.body or env defaults)
  app.post('/api/rally/mysql/test', async (req, res) => {
    const { mysqlService } = await import('./src/db/mysqlClient.ts');
    const result = await mysqlService.testConnection(req.body);
    res.json(result);
  });

  // API Route: Parse Aiven Service URI
  app.post('/api/rally/mysql/parse-uri', async (req, res) => {
    const { parseAivenUri } = await import('./src/db/mysqlClient.ts');
    const { uri } = req.body || {};
    const parsed = parseAivenUri(uri || '');
    res.json(parsed);
  });

  // API Route: Save & Apply MySQL / Aiven Configuration
  app.post('/api/rally/mysql/save-config', async (req, res) => {
    const { mysqlService } = await import('./src/db/mysqlClient.ts');
    const config = req.body || {};
    
    // Save to .env
    mysqlService.saveConfigToEnv(config);
    // Init pool with new credentials
    mysqlService.initPool(config);
    // Test connection
    const testResult = await mysqlService.testConnection(config);
    
    // If successfully connected, sync existing rally state right away
    if (testResult.ok) {
      syncToMysql(rallyState).catch(() => {});
    }

    res.json({
      ok: testResult.ok,
      message: testResult.message,
      status: mysqlService.getStatus()
    });
  });

  // API Route: Manual trigger to force sync state to MySQL
  app.post('/api/rally/mysql/sync-now', async (req, res) => {
    await syncToMysql(rallyState);
    res.json({ ok: true, message: 'Datos sincronizados exitosamente con la base de datos MySQL / Aiven.' });
  });

  // API Route: Automatically Create Database rally_datos_2026 & All Tables
  app.post('/api/rally/mysql/create-database', async (req, res) => {
    const { mysqlService } = await import('./src/db/mysqlClient.ts');
    const result = await mysqlService.createDatabaseAndTables(req.body);
    if (result.ok) {
      syncToMysql(rallyState).catch(() => {});
    }
    res.json(result);
  });

  // API Route: Quick SQL command to create database
  app.get('/api/rally/mysql/quick-create-sql', (req, res) => {
    const dbName = process.env.MYSQL_DATABASE || 'rally_datos_2026';
    const sql = `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE \`${dbName}\`;\n`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(sql);
  });

  // API Route: Get complete MySQL Schema SQL Script for MySQL Workbench
  app.get('/api/rally/mysql/schema', (req, res) => {
    const schemaPath = path.join(__dirname, 'mysql', 'schema_rally_datos_2026.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(sqlContent);
    } else {
      res.status(404).send('-- Error: Archivo de esquema no encontrado');
    }
  });

  // API Route: Generate Live SQL Dump with current data for MySQL Workbench
  app.get('/api/rally/mysql/export-dump', (req, res) => {
    let sqlDump = `-- =====================================================================\n`;
    sqlDump += `-- VOLCADO DE DATOS EN VIVO — RALLY DE DATOS 2026\n`;
    sqlDump += `-- Generado: ${new Date().toISOString()}\n`;
    sqlDump += `-- Compatible con: MySQL Workbench 8.0+\n`;
    sqlDump += `-- =====================================================================\n\n`;
    sqlDump += `USE rally_datos_2026;\n\n`;

    // Equipos
    if (rallyState.equipos.length > 0) {
      sqlDump += `-- EQUIPOS PARTICIPANTES (${rallyState.equipos.length} registros)\n`;
      for (const eq of rallyState.equipos) {
        const nombreEsc = eq.nombre.replace(/'/g, "''");
        const integrantesEsc = JSON.stringify(eq.integrantes).replace(/'/g, "''");
        const rutaAsigEsc = JSON.stringify(eq.ruta_asignada).replace(/'/g, "''");
        const horaInicio = eq.hora_inicio_rally ? `'${new Date(eq.hora_inicio_rally).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
        const horaFin = eq.hora_fin_rally ? `'${new Date(eq.hora_fin_rally).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
        
        sqlDump += `INSERT INTO equipos (equipo_id, nombre, integrantes, avatar, ruta_id, ruta_asignada, estacion_actual_index, puntaje_total, tiempo_acumulado_segundos, rally_iniciado, hora_inicio_rally, hora_fin_rally, auth_qr_secret) \n`;
        sqlDump += `VALUES ('${eq.equipo_id}', '${nombreEsc}', '${integrantesEsc}', '${eq.avatar}', '${eq.ruta_id}', '${rutaAsigEsc}', ${eq.estacion_actual_index}, ${eq.puntaje_total}, ${eq.tiempo_acumulado_segundos}, ${eq.rally_iniciado ? 1 : 0}, ${horaInicio}, ${horaFin}, '${eq.auth_qr_secret || ''}') \n`;
        sqlDump += `ON DUPLICATE KEY UPDATE puntaje_total = VALUES(puntaje_total), tiempo_acumulado_segundos = VALUES(tiempo_acumulado_segundos), estacion_actual_index = VALUES(estacion_actual_index);\n\n`;
      }
    }

    // Registros
    if (rallyState.registros.length > 0) {
      sqlDump += `-- REGISTROS DE EVALUACIÓN (${rallyState.registros.length} registros)\n`;
      for (const reg of rallyState.registros) {
        const datoEsc = (reg.dato_capturado || '').replace(/'/g, "''");
        const horaLlegada = `'${new Date(reg.hora_llegada).toISOString().slice(0, 19).replace('T', ' ')}'`;
        const horaSalida = reg.hora_salida ? `'${new Date(reg.hora_salida).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';

        sqlDump += `INSERT INTO registros_estaciones (registro_id, equipo_id, estacion_id, hora_llegada, hora_salida, intentos_usados, puntaje_obtenido, dato_capturado, monitor_id, tiempo_estacion_segundos, estado) \n`;
        sqlDump += `VALUES ('${reg.registro_id}', '${reg.equipo_id}', '${reg.estacion_id}', ${horaLlegada}, ${horaSalida}, ${reg.intentos_usados}, ${reg.puntaje_obtenido}, '${datoEsc}', '${reg.monitor_id}', ${reg.tiempo_estacion_segundos || 0}, '${reg.estado}') \n`;
        sqlDump += `ON DUPLICATE KEY UPDATE puntaje_obtenido = VALUES(puntaje_obtenido), estado = VALUES(estado);\n\n`;
      }
    }

    res.setHeader('Content-Type', 'text/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rally_datos_2026_dump.sql"');
    res.send(sqlDump);
  });

  // API Route: Sync complete shared state (with atomic map-based merge)
  app.post('/api/rally/sync', (req, res) => {
    const { equipos, registros, passesEquipos, tokensMonitores, broadcasts, globalConfig, isReset } = req.body;
    
    if (isReset) {
      rallyState = getInitialState();
      saveState(rallyState);
      return res.json({ ok: true, state: rallyState });
    }

    if (equipos !== undefined && Array.isArray(equipos)) {
      if (equipos.length === 0 && rallyState.equipos.length > 0) {
        // Prevent accidental wipe from uninitialized clients
      } else {
        // Merge teams by equipo_id to prevent overwrite collisions between concurrent devices
        const teamMap = new Map(rallyState.equipos.map(e => [e.equipo_id, e]));
        for (const eq of equipos) {
          teamMap.set(eq.equipo_id, eq);
        }
        rallyState.equipos = Array.from(teamMap.values());
      }
    }

    if (registros !== undefined && Array.isArray(registros)) {
      if (registros.length === 0 && rallyState.registros.length > 0) {
        // Prevent accidental wipe
      } else {
        const regMap = new Map(rallyState.registros.map(r => [r.registro_id, r]));
        for (const r of registros) {
          regMap.set(r.registro_id, r);
        }
        rallyState.registros = Array.from(regMap.values());
      }
    }

    if (passesEquipos !== undefined && Array.isArray(passesEquipos)) {
      const passMap = new Map(rallyState.passesEquipos.map(p => [p.pass_id, p]));
      for (const p of passesEquipos) {
        passMap.set(p.pass_id, p);
      }
      rallyState.passesEquipos = Array.from(passMap.values());
    }

    if (tokensMonitores !== undefined && Array.isArray(tokensMonitores)) {
      rallyState.tokensMonitores = tokensMonitores;
    }

    if (broadcasts !== undefined && Array.isArray(broadcasts)) {
      rallyState.broadcasts = broadcasts;
    }

    if (globalConfig !== undefined && typeof globalConfig === 'object') {
      rallyState.globalConfig = { ...rallyState.globalConfig, ...globalConfig };
    }

    saveState(rallyState);
    res.json({ ok: true, state: rallyState });
  });

  // API Route: Delete team
  app.post('/api/rally/teams/delete', (req, res) => {
    const { equipo_id } = req.body;
    if (!equipo_id) return res.status(400).json({ ok: false, error: 'equipo_id requerido' });

    rallyState.equipos = rallyState.equipos.filter(e => e.equipo_id !== equipo_id);
    rallyState.registros = rallyState.registros.filter(r => r.equipo_id !== equipo_id);
    const passIndex = rallyState.passesEquipos.findIndex(p => p.equipo_id_asignado === equipo_id);
    if (passIndex !== -1) {
      rallyState.passesEquipos[passIndex].utilizado = false;
      delete rallyState.passesEquipos[passIndex].nombre_equipo_creado;
    }

    // Delete from MySQL if connected
    (async () => {
      try {
        const { mysqlService } = await import('./src/db/mysqlClient.ts');
        const pool = mysqlService.getPool();
        if (pool) {
          await pool.query('DELETE FROM equipos WHERE equipo_id = ?', [equipo_id]);
        }
      } catch (e) {}
    })();

    saveState(rallyState);
    res.json({ ok: true });
  });

  // API Route: Update team notepad
  app.post('/api/rally/teams/update-notepad', (req, res) => {
    const { equipo_id, bloc_notas } = req.body;
    const teamIndex = rallyState.equipos.findIndex(e => e.equipo_id === equipo_id);
    if (teamIndex !== -1 && bloc_notas) {
      rallyState.equipos[teamIndex].bloc_notas = {
        ...rallyState.equipos[teamIndex].bloc_notas,
        ...bloc_notas
      };
      saveState(rallyState);
      return res.json({ ok: true, equipo: rallyState.equipos[teamIndex] });
    }
    res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
  });

  // API Route: Start team timer
  app.post('/api/rally/teams/start-timer', (req, res) => {
    const { equipo_id } = req.body;
    const teamIndex = rallyState.equipos.findIndex(e => e.equipo_id === equipo_id);
    if (teamIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Equipo no encontrado' });
    }

    const ahora = new Date().toISOString();
    rallyState.equipos[teamIndex].rally_iniciado = true;
    rallyState.equipos[teamIndex].hora_inicio_rally = ahora;

    saveState(rallyState);
    res.json({ ok: true, equipo: rallyState.equipos[teamIndex] });
  });

  // API Route: Create Team via Logistics QR Pass
  app.post('/api/rally/teams/create-with-pass', (req, res) => {
    const { pass_token, nombre, integrantes, avatar } = req.body;
    
    // Find pass
    const passIndex = rallyState.passesEquipos.findIndex(
      p => p.token.toUpperCase() === pass_token.trim().toUpperCase()
    );

    if (passIndex === -1) {
      return res.status(400).json({ ok: false, error: 'Pase QR no encontrado o inválido.' });
    }

    const pass = rallyState.passesEquipos[passIndex];
    if (pass.utilizado) {
      return res.status(400).json({ 
        ok: false, 
        error: `Este Pase QR ya fue utilizado anteriormente por "${pass.nombre_equipo_creado || pass.equipo_id_asignado}".` 
      });
    }

    const nuevoEquipo: Equipo = {
      equipo_id: pass.equipo_id_asignado,
      nombre: nombre.trim() || `Equipo ${pass.equipo_id_asignado}`,
      password: 'rally2026',
      integrantes: Array.isArray(integrantes) ? integrantes.filter((i: string) => i && i.trim().length > 0) : [],
      avatar: avatar || '🤖',
      ruta_id: pass.ruta_id,
      ruta_asignada: [...RUTAS_BASE[pass.ruta_id]],
      estacion_actual_index: 0,
      puntaje_total: 0,
      tiempo_acumulado_segundos: 0,
      rally_iniciado: false, // Timer starts ONLY when team presses "Iniciar Rally"
      insignias: [],
      bloc_notas: {
        lecturaE3: '',
        calculoModulo: '',
        calculoDivision: '',
        notasLibres: ''
      },
      en_estacion_actual: false,
      auth_qr_secret: pass.token
    };

    rallyState.passesEquipos[passIndex].utilizado = true;
    rallyState.passesEquipos[passIndex].nombre_equipo_creado = nuevoEquipo.nombre;

    rallyState.equipos = [...rallyState.equipos.filter(e => e.equipo_id !== nuevoEquipo.equipo_id), nuevoEquipo];

    saveState(rallyState);
    res.json({ ok: true, equipo: nuevoEquipo });
  });

  // API Route: Direct Team Creation from Any Device (Auto-allocates next pass / balanced route)
  app.post('/api/rally/teams/create-direct', (req, res) => {
    const { nombre, integrantes, avatar, ruta_id, password } = req.body || {};
    
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ ok: false, error: 'El nombre del equipo es obligatorio.' });
    }

    const cleanIntegrantes = Array.isArray(integrantes) 
      ? integrantes.filter((i: string) => i && i.trim().length > 0)
      : [];
    
    if (cleanIntegrantes.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se requiere al menos un integrante.' });
    }

    // Determine Route (if specified and valid, use it; otherwise balance)
    const validRoutes: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
    let selectedRoute: 'A' | 'B' | 'C' | 'D' | 'E' = (validRoutes.includes(ruta_id) ? ruta_id : 'A');

    if (!validRoutes.includes(ruta_id)) {
      const routeCounts: Record<'A' | 'B' | 'C' | 'D' | 'E', number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      rallyState.equipos.forEach(eq => {
        if (routeCounts[eq.ruta_id] !== undefined) {
          routeCounts[eq.ruta_id]++;
        }
      });
      let minCount = 999;
      for (const r of validRoutes) {
        if (routeCounts[r] < minCount) {
          minCount = routeCounts[r];
          selectedRoute = r;
        }
      }
    }

    // Find next available unused pass for this route, or any unused pass
    let passIndex = rallyState.passesEquipos.findIndex(p => !p.utilizado && p.ruta_id === selectedRoute);
    if (passIndex === -1) {
      passIndex = rallyState.passesEquipos.findIndex(p => !p.utilizado);
    }

    let equipoId = '';
    let passToken = '';

    if (passIndex !== -1) {
      const pass = rallyState.passesEquipos[passIndex];
      equipoId = pass.equipo_id_asignado;
      selectedRoute = pass.ruta_id;
      passToken = pass.token;
      rallyState.passesEquipos[passIndex].utilizado = true;
      rallyState.passesEquipos[passIndex].nombre_equipo_creado = nombre.trim();
    } else {
      // Generate new sequential pass
      const nextNum = rallyState.passesEquipos.length + 1;
      equipoId = `EQ-${String(nextNum).padStart(2, '0')}`;
      passToken = `RALLY-TEAM-PASS-${selectedRoute}-${String(nextNum).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const nuevoPass: TeamCreationPass = {
        pass_id: `PASS-${String(nextNum).padStart(2, '0')}`,
        token: passToken,
        equipo_id_asignado: equipoId,
        ruta_id: selectedRoute,
        creado_el: new Date().toISOString(),
        utilizado: true,
        nombre_equipo_creado: nombre.trim()
      };
      rallyState.passesEquipos.push(nuevoPass);
    }

    const nuevoEquipo: Equipo = {
      equipo_id: equipoId,
      nombre: nombre.trim(),
      password: password || 'rally2026',
      integrantes: cleanIntegrantes,
      avatar: avatar || '🤖',
      ruta_id: selectedRoute,
      ruta_asignada: [...RUTAS_BASE[selectedRoute]],
      estacion_actual_index: 0,
      puntaje_total: 0,
      tiempo_acumulado_segundos: 0,
      rally_iniciado: false,
      insignias: [],
      bloc_notas: {
        lecturaE3: '',
        calculoModulo: '',
        calculoDivision: '',
        notasLibres: ''
      },
      en_estacion_actual: false,
      auth_qr_secret: passToken
    };

    rallyState.equipos = [...rallyState.equipos.filter(e => e.equipo_id !== equipoId), nuevoEquipo];
    saveState(rallyState);

    res.json({ ok: true, equipo: nuevoEquipo });
  });

  // API Route: Re-login to existing team using QR scan
  app.post('/api/rally/teams/login-qr', (req, res) => {
    let { qr_text } = req.body;
    if (!qr_text) {
      return res.status(400).json({ ok: false, error: 'Código QR no proporcionado.' });
    }

    qr_text = qr_text.trim();
    try {
      if (qr_text.startsWith('{') && qr_text.endsWith('}')) {
        const parsed = JSON.parse(qr_text);
        if (parsed.equipo_id) qr_text = parsed.equipo_id;
        else if (parsed.token) qr_text = parsed.token;
      }
    } catch (e) {}

    // Find team by team_id or auth secret or matching pass token
    const team = rallyState.equipos.find(
      e => e.equipo_id.toUpperCase() === qr_text.toUpperCase() ||
           (e.auth_qr_secret && e.auth_qr_secret.toUpperCase() === qr_text.toUpperCase())
    );

    if (team) {
      return res.json({ ok: true, equipo: team });
    }

    // Check if it's a pass token already used for a team
    const usedPass = rallyState.passesEquipos.find(
      p => p.token.toUpperCase() === qr_text.toUpperCase() && p.utilizado
    );
    if (usedPass) {
      const passTeam = rallyState.equipos.find(e => e.equipo_id === usedPass.equipo_id_asignado);
      if (passTeam) {
        return res.json({ ok: true, equipo: passTeam });
      }
    }

    res.status(404).json({ ok: false, error: 'No se encontró ningún equipo registrado con este código QR.' });
  });

  // API Route: Reset Rally
  app.post('/api/rally/reset', (req, res) => {
    rallyState = getInitialState();
    saveState(rallyState);
    res.json({ ok: true, state: rallyState });
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Servidor del Rally de Datos 2026 activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
