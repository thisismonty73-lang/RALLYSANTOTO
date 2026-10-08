export type EstacionId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
export type RutaId = 'A' | 'B' | 'C' | 'D' | 'E';
export type Role = 'participante' | 'monitor' | 'logistica';

export interface EstacionConfig {
  id: EstacionId;
  numero: number;
  nombre: string;
  subtitulo: string;
  enigmaLlegada: string;
  descripcionReto: string;
  datoCapturaNombre: string;
  datoCapturaPlaceholder: string;
  color: string;
  coordenadas: {
    lat: number;
    lng: number;
    nombreLugar: string;
  };
}

export interface RegistroEstacion {
  registro_id: string;
  equipo_id: string;
  estacion_id: EstacionId;
  hora_llegada: string;
  hora_salida?: string;
  intentos_usados: number;
  puntaje_obtenido: number;
  dato_capturado?: string;
  monitor_id: string;
  tiempo_estacion_segundos?: number;
  estado: 'en_progreso' | 'aprobado' | 'fallido_continuado';
}

export type InsigniaId = 
  | 'logico_puro'
  | 'rayo_binario'
  | 'precision_cero'
  | 'resiliencia'
  | 'pasaporte_dorado'
  | 'velocista';

export interface Insignia {
  id: InsigniaId;
  icono: string;
  nombre: string;
  descripcion: string;
  color: string;
}

export interface Equipo {
  equipo_id: string;
  nombre: string;
  password?: string;
  integrantes: string[];
  avatar: string;
  colorTema?: string;
  ruta_id: RutaId;
  ruta_asignada: EstacionId[];
  estacion_actual_index: number;
  puntaje_total: number;
  tiempo_acumulado_segundos: number;
  rally_iniciado?: boolean;
  hora_inicio_rally?: string;
  hora_fin_rally?: string;
  auth_qr_secret?: string;
  insignias: InsigniaId[];
  bloc_notas?: {
    lecturaE3: string;
    calculoModulo: string;
    calculoDivision: string;
    notasLibres: string;
  };
  en_estacion_actual?: boolean;
}

export interface BroadcastMessage {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'alerta' | 'info' | 'tiempo_limite';
  fecha: string;
  activo: boolean;
}

export interface MonitorAuthToken {
  estacion_id: EstacionId;
  token: string;
  creado_el: string;
  descripcion: string;
}

export interface TeamCreationPass {
  pass_id: string;
  token: string;
  equipo_id_asignado: string;
  ruta_id: RutaId;
  creado_el: string;
  utilizado: boolean;
  nombre_equipo_creado?: string;
}

export interface RallyGlobalConfig {
  rallyIniciado: boolean;
  horaInicio?: string;
  tiempoLimiteMinutos: number;
  pausado: boolean;
  distanciaMaximaPermitidaMetros: number;
  passwordLogistica: string;
}
