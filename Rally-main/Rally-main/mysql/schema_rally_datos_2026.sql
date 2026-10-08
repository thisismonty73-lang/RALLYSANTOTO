-- =====================================================================
-- PASAPORTE DIGITAL — RALLY DE DATOS 2026
-- Script Oficial de Base de Datos para MySQL Workbench
-- Codificación: UTF-8 (utf8mb4)
-- Compatible con: MySQL 8.0+, MySQL 5.7, MariaDB 10.3+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS rally_datos_2026
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE rally_datos_2026;

-- Desactivar restricciones de claves foráneas temporalmente para limpieza segura
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS insignias_equipos;
DROP TABLE IF EXISTS bloc_notas_equipos;
DROP TABLE IF EXISTS registros_estaciones;
DROP TABLE IF EXISTS equipos;
DROP TABLE IF EXISTS pases_logistica;
DROP TABLE IF EXISTS tokens_monitores;
DROP TABLE IF EXISTS broadcasts;
DROP TABLE IF EXISTS config_global;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. TABLA: CONFIGURACIÓN GLOBAL DEL EVENTO
-- =====================================================================
CREATE TABLE config_global (
  id INT PRIMARY KEY DEFAULT 1,
  rally_iniciado BOOLEAN NOT NULL DEFAULT TRUE,
  hora_inicio DATETIME NULL,
  tiempo_limite_minutos INT NOT NULL DEFAULT 90,
  pausado BOOLEAN NOT NULL DEFAULT FALSE,
  distancia_maxima_permitida_metros INT NOT NULL DEFAULT 35,
  password_logistica VARCHAR(100) NOT NULL DEFAULT 'RALLYSANTOTO',
  actualizado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2. TABLA: PASES DE CREACIÓN DE EQUIPO (EMITIDOS POR LOGÍSTICA)
-- Exactamente 25 pases pre-balanceados (5 por ruta cíclica: A, B, C, D, E)
-- =====================================================================
CREATE TABLE pases_logistica (
  pass_id VARCHAR(16) PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  equipo_id_asignado VARCHAR(16) NOT NULL,
  ruta_id ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
  utilizado BOOLEAN NOT NULL DEFAULT FALSE,
  nombre_equipo_creado VARCHAR(120) NULL,
  creado_el DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pases_token (token),
  INDEX idx_pases_ruta (ruta_id),
  INDEX idx_pases_utilizado (utilizado)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. TABLA: TOKENS DE AUTORIZACIÓN DE DISPOSITIVOS MONITORES
-- Un token criptográfico por cada una de las 5 estaciones
-- =====================================================================
CREATE TABLE tokens_monitores (
  estacion_id ENUM('E1', 'E2', 'E3', 'E4', 'E5') PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  creado_el DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tokens_token (token)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. TABLA: EQUIPOS PARTICIPANTES
-- Creados exclusivamente mediante escaneo del Pase QR de Logística
-- =====================================================================
CREATE TABLE equipos (
  equipo_id VARCHAR(16) PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  password VARCHAR(100) NOT NULL DEFAULT 'rally2026',
  integrantes JSON NOT NULL,
  avatar VARCHAR(16) NOT NULL DEFAULT '🤖',
  ruta_id ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
  ruta_asignada JSON NOT NULL,
  estacion_actual_index INT NOT NULL DEFAULT 0,
  puntaje_total INT NOT NULL DEFAULT 0,
  tiempo_acumulado_segundos INT NOT NULL DEFAULT 0,
  rally_iniciado BOOLEAN NOT NULL DEFAULT FALSE,
  hora_inicio_rally DATETIME NULL,
  hora_fin_rally DATETIME NULL,
  auth_qr_secret VARCHAR(128) NULL,
  en_estacion_actual BOOLEAN NOT NULL DEFAULT FALSE,
  creado_el DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equipos_ruta (ruta_id),
  INDEX idx_equipos_puntaje (puntaje_total DESC, tiempo_acumulado_segundos ASC),
  INDEX idx_equipos_iniciado (rally_iniciado)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. TABLA: REGISTROS DE EVALUACIÓN EN ESTACIONES (SELLOS DIGITALES)
-- Registra llegada por escaneo, intentos, puntaje, dato capturado y salida
-- =====================================================================
CREATE TABLE registros_estaciones (
  registro_id VARCHAR(32) PRIMARY KEY,
  equipo_id VARCHAR(16) NOT NULL,
  estacion_id ENUM('E1', 'E2', 'E3', 'E4', 'E5') NOT NULL,
  hora_llegada DATETIME NOT NULL,
  hora_salida DATETIME NULL,
  intentos_usados INT NOT NULL DEFAULT 1,
  puntaje_obtenido INT NOT NULL DEFAULT 0,
  dato_capturado VARCHAR(255) NULL,
  monitor_id VARCHAR(32) NOT NULL,
  tiempo_estacion_segundos INT NOT NULL DEFAULT 0,
  estado ENUM('en_progreso', 'aprobado', 'fallido_continuado') NOT NULL DEFAULT 'en_progreso',
  registrado_el DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id) ON DELETE CASCADE,
  INDEX idx_registros_equipo (equipo_id),
  INDEX idx_registros_estacion (estacion_id),
  INDEX idx_registros_estado (estado)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. TABLA: BLOC DE NOTAS DIGITAL Y CALCULADORA POR EQUIPO
-- Permite guardar lecturas del sensor E3, conversiones y cálculos
-- =====================================================================
CREATE TABLE bloc_notas_equipos (
  equipo_id VARCHAR(16) PRIMARY KEY,
  lectura_e3 VARCHAR(50) NOT NULL DEFAULT '',
  calculo_modulo VARCHAR(50) NOT NULL DEFAULT '',
  calculo_division VARCHAR(50) NOT NULL DEFAULT '',
  notas_libres TEXT,
  actualizado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 7. TABLA: INSIGNIAS Y MEDALLAS DIGITALES DESBLOQUEADAS
-- =====================================================================
CREATE TABLE insignias_equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id VARCHAR(16) NOT NULL,
  insignia_id VARCHAR(50) NOT NULL,
  desbloqueada_el DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES equipos(equipo_id) ON DELETE CASCADE,
  UNIQUE KEY uk_equipo_insignia (equipo_id, insignia_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. TABLA: NOTIFICACIONES BROADCAST Y ALERTAS DEL EVENTO
-- =====================================================================
CREATE TABLE broadcasts (
  id VARCHAR(32) PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('alerta', 'info', 'tiempo_limite') NOT NULL DEFAULT 'info',
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_broadcasts_activo (activo)
) ENGINE=InnoDB;

-- =====================================================================
-- CARGA DE DATOS INICIALES (SEEDS OFICIALES)
-- =====================================================================

-- Configuración inicial
INSERT INTO config_global (id, rally_iniciado, tiempo_limite_minutos, pausado, distancia_maxima_permitida_metros, password_logistica)
VALUES (1, TRUE, 90, FALSE, 35, 'RALLYSANTOTO')
ON DUPLICATE KEY UPDATE password_logistica = 'RALLYSANTOTO';

-- 5 Tokens autorizados de Monitores (Estaciones 1 a 5)
INSERT INTO tokens_monitores (estacion_id, token, descripcion) VALUES
('E1', 'RALLY-AUTH-E1-9842', 'Pase QR Oficial — Monitor Estación 1 (Lógica Combinatoria)'),
('E2', 'RALLY-AUTH-E2-5173', 'Pase QR Oficial — Monitor Estación 2 (Conversión A/D)'),
('E3', 'RALLY-AUTH-E3-2649', 'Pase QR Oficial — Monitor Estación 3 (Sensores Físicos)'),
('E4', 'RALLY-AUTH-E4-7381', 'Pase QR Oficial — Monitor Estación 4 (Matriz de Datos)'),
('E5', 'RALLY-AUTH-E5-4095', 'Pase QR Oficial — Monitor Estación 5 (Consola Central)')
ON DUPLICATE KEY UPDATE token = VALUES(token);

-- 25 Pases Oficiales de Registro para Equipos (5 por cada ruta A, B, C, D, E)
INSERT INTO pases_logistica (pass_id, token, equipo_id_asignado, ruta_id, utilizado) VALUES
('PASS-01', 'RALLY-TEAM-PASS-A-01', 'EQ-01', 'A', FALSE),
('PASS-02', 'RALLY-TEAM-PASS-B-02', 'EQ-02', 'B', FALSE),
('PASS-03', 'RALLY-TEAM-PASS-C-03', 'EQ-03', 'C', FALSE),
('PASS-04', 'RALLY-TEAM-PASS-D-04', 'EQ-04', 'D', FALSE),
('PASS-05', 'RALLY-TEAM-PASS-E-05', 'EQ-05', 'E', FALSE),
('PASS-06', 'RALLY-TEAM-PASS-A-06', 'EQ-06', 'A', FALSE),
('PASS-07', 'RALLY-TEAM-PASS-B-07', 'EQ-07', 'B', FALSE),
('PASS-08', 'RALLY-TEAM-PASS-C-08', 'EQ-08', 'C', FALSE),
('PASS-09', 'RALLY-TEAM-PASS-D-09', 'EQ-09', 'D', FALSE),
('PASS-10', 'RALLY-TEAM-PASS-E-10', 'EQ-10', 'E', FALSE),
('PASS-11', 'RALLY-TEAM-PASS-A-11', 'EQ-11', 'A', FALSE),
('PASS-12', 'RALLY-TEAM-PASS-B-12', 'EQ-12', 'B', FALSE),
('PASS-13', 'RALLY-TEAM-PASS-C-13', 'EQ-13', 'C', FALSE),
('PASS-14', 'RALLY-TEAM-PASS-D-14', 'EQ-14', 'D', FALSE),
('PASS-15', 'RALLY-TEAM-PASS-E-15', 'EQ-15', 'E', FALSE),
('PASS-16', 'RALLY-TEAM-PASS-A-16', 'EQ-16', 'A', FALSE),
('PASS-17', 'RALLY-TEAM-PASS-B-17', 'EQ-17', 'B', FALSE),
('PASS-18', 'RALLY-TEAM-PASS-C-18', 'EQ-18', 'C', FALSE),
('PASS-19', 'RALLY-TEAM-PASS-D-19', 'EQ-19', 'D', FALSE),
('PASS-20', 'RALLY-TEAM-PASS-E-20', 'EQ-20', 'E', FALSE),
('PASS-21', 'RALLY-TEAM-PASS-A-21', 'EQ-21', 'A', FALSE),
('PASS-22', 'RALLY-TEAM-PASS-B-22', 'EQ-22', 'B', FALSE),
('PASS-23', 'RALLY-TEAM-PASS-C-23', 'EQ-23', 'C', FALSE),
('PASS-24', 'RALLY-TEAM-PASS-D-24', 'EQ-24', 'D', FALSE),
('PASS-25', 'RALLY-TEAM-PASS-E-25', 'EQ-25', 'E', FALSE)
ON DUPLICATE KEY UPDATE utilizado = VALUES(utilizado);

-- Broadcast inicial de bienvenida
INSERT INTO broadcasts (id, titulo, mensaje, tipo, fecha, activo) VALUES
('b-init-1', '¡Rally de Datos 2026 en Marcha!', 'Bienvenido. Escanea el código QR de Logística para activar tu Pasaporte Oficial.', 'info', NOW(), TRUE)
ON DUPLICATE KEY UPDATE activo = VALUES(activo);

-- =====================================================================
-- VISTAS ÚTILES PARA CONSULTAS EN MYSQL WORKBENCH
-- =====================================================================

-- 1. Vista de Ranking y Tabla de Posiciones en Vivo
CREATE OR REPLACE VIEW v_ranking_en_vivo AS
SELECT 
  RANK() OVER (ORDER BY e.puntaje_total DESC, e.tiempo_acumulado_segundos ASC) AS puesto,
  e.equipo_id,
  e.nombre AS nombre_equipo,
  e.avatar,
  e.ruta_id,
  e.puntaje_total,
  CONCAT(FLOOR(e.tiempo_acumulado_segundos / 60), 'm ', LPAD(e.tiempo_acumulado_segundos % 60, 2, '0'), 's') AS tiempo_acumulado,
  CASE 
    WHEN e.estacion_actual_index >= 5 THEN '🏁 FINALIZADO'
    ELSE CONCAT('Estación ', e.estacion_actual_index + 1, '/5')
  END AS progreso,
  e.rally_iniciado,
  COUNT(i.id) AS medallas_obtenidas
FROM equipos e
LEFT JOIN insignias_equipos i ON e.equipo_id = i.equipo_id
GROUP BY e.equipo_id
ORDER BY e.puntaje_total DESC, e.tiempo_acumulado_segundos ASC;

-- 2. Vista de Auditoría de Estaciones y Tiempos
CREATE OR REPLACE VIEW v_auditoria_estaciones AS
SELECT 
  r.registro_id,
  r.equipo_id,
  e.nombre AS nombre_equipo,
  r.estacion_id,
  r.intentos_usados,
  r.puntaje_obtenido,
  r.dato_capturado,
  r.tiempo_estacion_segundos,
  r.estado,
  r.monitor_id,
  r.hora_llegada,
  r.hora_salida
FROM registros_estaciones r
JOIN equipos e ON r.equipo_id = e.equipo_id
ORDER BY r.hora_llegada DESC;

-- 3. Vista de Control de Pases de Logística
CREATE OR REPLACE VIEW v_resumen_pases_logistica AS
SELECT 
  p.pass_id,
  p.token,
  p.equipo_id_asignado,
  p.ruta_id,
  CASE WHEN p.utilizado THEN 'UTILIZADO' ELSE 'DISPONIBLE' END AS estado,
  p.nombre_equipo_creado
FROM pases_logistica p
ORDER BY p.ruta_id, p.pass_id;

-- =====================================================================
-- CONSULTAS DE EJEMPLO PARA EJECUTAR EN MYSQL WORKBENCH:
-- =====================================================================
-- Ver Ranking en vivo:
--   SELECT * FROM v_ranking_en_vivo;
--
-- Ver estado de todos los pases QR:
--   SELECT * FROM v_resumen_pases_logistica;
--
-- Ver últimas validaciones hechas por monitores:
--   SELECT * FROM v_auditoria_estaciones LIMIT 10;
-- =====================================================================
