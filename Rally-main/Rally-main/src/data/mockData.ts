import type { EstacionConfig, RutaId, EstacionId, Insignia, Equipo, TeamCreationPass } from '../types/rally.ts';

export const ESTACIONES: Record<EstacionId, EstacionConfig> = {
  E1: {
    id: 'E1',
    numero: 1,
    nombre: 'Lógica Combinatoria & Compuertas',
    subtitulo: 'Álgebra de Boole y Circuitos Lógicos',
    enigmaLlegada: 'Retorna a la fuente de la lógica elemental donde los bits nacen de interruptores y compuertas primitivas.',
    descripcionReto: 'Implementar el circuito sumador binario de 2 bits y deducir la tabla de verdad correcta.',
    datoCapturaNombre: 'Bit de Acarreo (Carry)',
    datoCapturaPlaceholder: 'Ej. Carry=1, Sum=0',
    color: '#3b82f6', // blue
    coordenadas: {
      lat: 19.432608,
      lng: -99.133209,
      nombreLugar: 'Laboratorio de Hardware y Lógica Digital (Ala Norte)'
    }
  },
  E2: {
    id: 'E2',
    numero: 2,
    nombre: 'Adquisición & Conversión A/D',
    subtitulo: 'Muestreo de Señales Ópticas y Frecuencia',
    enigmaLlegada: 'Busca el lugar donde dos corrientes de datos se unen para sumar sin llevar acarreo.',
    descripcionReto: 'Interrumpir el haz invisible con la frecuencia correcta para calibrar el convertidor analógico a digital.',
    datoCapturaNombre: 'Valor ADC Muestreado',
    datoCapturaPlaceholder: 'Ej. ADC=1023 (10 bits)',
    color: '#8b5cf6', // purple
    coordenadas: {
      lat: 19.432750,
      lng: -99.133050,
      nombreLugar: 'Taller de Señales y Telecomunicaciones (Nivel 2)'
    }
  },
  E3: {
    id: 'E3',
    numero: 3,
    nombre: 'Sensores Físicos & Telemetría',
    subtitulo: 'Medición Ultrasónica y Adquisición en Vivo',
    enigmaLlegada: 'Dirígete al punto donde la realidad física se convierte en números binarios a través del haz invisible.',
    descripcionReto: 'Calibrar el sensor ultrasónico y registrar la distancia métrica del objetivo (dato clave para la estación 4).',
    datoCapturaNombre: 'Distancia Registrada (cm)',
    datoCapturaPlaceholder: 'Ej. 23',
    color: '#06b6d4', // cyan
    coordenadas: {
      lat: 19.432920,
      lng: -99.133400,
      nombreLugar: 'Estación de Telemetría e Internet de las Cosas (Patio Central)'
    }
  },
  E4: {
    id: 'E4',
    numero: 4,
    nombre: 'Matriz de Datos & Mapeo Espacial',
    subtitulo: 'Coordenadas Discretas y Aritmética Modular',
    enigmaLlegada: 'Encuentra la gran matriz de 5x5 donde cada dato toma su coordenada exacta.',
    descripcionReto: 'Utilizar el valor capturado en la Estación 3 para calcular Fila = Floor(Dato / 5) y Columna = Dato Mod 5, e iluminar la celda.',
    datoCapturaNombre: 'Coordenada [Fila, Col]',
    datoCapturaPlaceholder: 'Ej. [4, 3]',
    color: '#10b981', // emerald
    coordenadas: {
      lat: 19.432450,
      lng: -99.133650,
      nombreLugar: 'Sala de Cómputo Espacial y Matrices de Memoria (Planta Baja)'
    }
  },
  E5: {
    id: 'E5',
    numero: 5,
    nombre: 'Consola de Telemetría & Análisis',
    subtitulo: 'Integridad de Trama y Checksum del Rally',
    enigmaLlegada: 'Avanza hacia la consola central donde se analiza el comportamiento de todo el rally.',
    descripcionReto: 'Consolidar el paquete de datos del rally, validar el algoritmo de paridad CRC y certificar el pasaporte.',
    datoCapturaNombre: 'Checksum Validado',
    datoCapturaPlaceholder: 'Ej. 0x7E4F',
    color: '#f59e0b', // amber
    coordenadas: {
      lat: 19.432650,
      lng: -99.133350,
      nombreLugar: 'Centro de Operaciones y Analítica Central (Auditorio)'
    }
  }
};

export const RUTAS_BASE: Record<RutaId, EstacionId[]> = {
  A: ['E1', 'E2', 'E3', 'E4', 'E5'],
  B: ['E2', 'E3', 'E4', 'E5', 'E1'],
  C: ['E3', 'E4', 'E5', 'E1', 'E2'],
  D: ['E4', 'E5', 'E1', 'E2', 'E3'],
  E: ['E5', 'E1', 'E2', 'E3', 'E4']
};

export const INSIGNIAS_CATALOG: Insignia[] = [
  {
    id: 'logico_puro',
    icono: '🥇',
    nombre: 'Lógico Puro',
    descripcion: 'Completar la Estación 1 con éxito en el primer intento sin ninguna penalización.',
    color: 'from-amber-400 to-yellow-600'
  },
  {
    id: 'rayo_binario',
    icono: '⚡',
    nombre: 'Rayo Binario',
    descripcion: 'Resolver la Estación 2 en menos de 2 minutos (120 segundos).',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    id: 'precision_cero',
    icono: '🎯',
    nombre: 'Precisión Cero',
    descripcion: 'Mapear correctamente la coordenada en la Estación 4 a la primera sin errores de cálculo.',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'resiliencia',
    icono: '🛡️',
    nombre: 'Espíritu Resiliente',
    descripcion: 'Superar un reto técnico complejo en el 3er intento sin rendirse.',
    color: 'from-purple-400 to-indigo-600'
  },
  {
    id: 'pasaporte_dorado',
    icono: '🏆',
    nombre: 'Pasaporte Dorado',
    descripcion: 'Completar las 5 estaciones con más de 400 puntos acumulados.',
    color: 'from-yellow-300 to-amber-500'
  },
  {
    id: 'velocista',
    icono: '⏱️',
    nombre: 'Velocista del Rally',
    descripcion: 'Concluir el recorrido completo con ritmo sobresaliente.',
    color: 'from-rose-400 to-red-600'
  }
];

export const AVATARES_DISPONIBLES = [
  '🤖', '⚡', '🧠', '🚀', '🔮', '🛰️', '💾', '🧬', '🛡️', '⚙️', '📊', '🔥'
];

// Empty initial teams as requested: Teams are created exclusively via Logistics QR pass
export function generarEquiposIniciales(): Equipo[] {
  return [];
}

// Initial registered records are completely clean
export const REGISTROS_INICIALES: any[] = [];

// 25 Official Team Creation Passes pre-balanced (5 per route: A, B, C, D, E)
export function generarPassesIniciales(): TeamCreationPass[] {
  const rutas: RutaId[] = ['A', 'B', 'C', 'D', 'E'];
  return Array.from({ length: 25 }).map((_, i) => {
    const ruta = rutas[i % 5];
    const num = i + 1;
    const eqId = `EQ-${String(num).padStart(2, '0')}`;
    return {
      pass_id: `PASS-${String(num).padStart(2, '0')}`,
      token: `RALLY-TEAM-PASS-${ruta}-${String(num).padStart(2, '0')}`,
      equipo_id_asignado: eqId,
      ruta_id: ruta,
      creado_el: '2026-10-06T08:00:00.000Z',
      utilizado: false
    };
  });
}

export const PASSES_INICIALES_EQUIPOS: TeamCreationPass[] = generarPassesIniciales();

export const PASSWORD_LOGISTICA_FIJA = 'RALLYSANTOTO';

export const TOKENS_INICIALES_MONITORES = [
  {
    estacion_id: 'E1' as EstacionId,
    token: 'RALLY-AUTH-E1-9842',
    creado_el: '2026-10-06T08:00:00.000Z',
    descripcion: 'Pase QR Oficial — Monitor Estación 1 (Lógica Combinatoria)'
  },
  {
    estacion_id: 'E2' as EstacionId,
    token: 'RALLY-AUTH-E2-5173',
    creado_el: '2026-10-06T08:00:00.000Z',
    descripcion: 'Pase QR Oficial — Monitor Estación 2 (Conversión A/D)'
  },
  {
    estacion_id: 'E3' as EstacionId,
    token: 'RALLY-AUTH-E3-2649',
    creado_el: '2026-10-06T08:00:00.000Z',
    descripcion: 'Pase QR Oficial — Monitor Estación 3 (Sensores Físicos)'
  },
  {
    estacion_id: 'E4' as EstacionId,
    token: 'RALLY-AUTH-E4-7381',
    creado_el: '2026-10-06T08:00:00.000Z',
    descripcion: 'Pase QR Oficial — Monitor Estación 4 (Matriz de Datos)'
  },
  {
    estacion_id: 'E5' as EstacionId,
    token: 'RALLY-AUTH-E5-4095',
    creado_el: '2026-10-06T08:00:00.000Z',
    descripcion: 'Pase QR Oficial — Monitor Estación 5 (Consola Central)'
  }
];

export const MONITORES_CREDENCIALES = [
  { username: 'monitor_e1', password: 'rally2026', estacion_id: 'E1' as EstacionId, nombre: 'Monitor Estación 1 (Lógica Combinatoria)' },
  { username: 'monitor_e2', password: 'rally2026', estacion_id: 'E2' as EstacionId, nombre: 'Monitor Estación 2 (Conversión A/D)' },
  { username: 'monitor_e3', password: 'rally2026', estacion_id: 'E3' as EstacionId, nombre: 'Monitor Estación 3 (Sensores Físicos)' },
  { username: 'monitor_e4', password: 'rally2026', estacion_id: 'E4' as EstacionId, nombre: 'Monitor Estación 4 (Matriz de Datos)' },
  { username: 'monitor_e5', password: 'rally2026', estacion_id: 'E5' as EstacionId, nombre: 'Monitor Estación 5 (Consola Central)' }
];
