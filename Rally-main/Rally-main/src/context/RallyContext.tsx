import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Equipo, 
  RegistroEstacion, 
  EstacionId, 
  RutaId, 
  Role, 
  BroadcastMessage, 
  RallyGlobalConfig,
  InsigniaId,
  MonitorAuthToken,
  TeamCreationPass
} from '../types/rally';
import { 
  ESTACIONES, 
  RUTAS_BASE, 
  generarEquiposIniciales, 
  REGISTROS_INICIALES,
  PASSWORD_LOGISTICA_FIJA, 
  TOKENS_INICIALES_MONITORES,
  PASSES_INICIALES_EQUIPOS
} from '../data/mockData';

interface RallyContextType {
  equipos: Equipo[];
  registros: RegistroEstacion[];
  activeRole: Role;
  currentTeam: Equipo | null;
  activeMonitorEstacion: EstacionId | null;
  broadcasts: BroadcastMessage[];
  globalConfig: RallyGlobalConfig;
  userGps: { lat: number; lng: number; accuracy?: number } | null;
  gpsSimulado: boolean;
  
  // Logistics Auth State & Methods
  isLogisticaAuthed: boolean;
  loginLogistica: (password: string) => boolean;
  logoutLogistica: () => void;

  // Monitor Device Authorization Methods
  tokensMonitores: MonitorAuthToken[];
  dispositivoAutorizadoEstacion: EstacionId | null;
  autorizarDispositivoMonitor: (tokenOQrPayload: string) => { ok: boolean; mensaje: string; estacionId?: EstacionId };
  desautorizarDispositivoMonitor: () => void;
  generarNuevoTokenMonitor: (estacionId: EstacionId) => MonitorAuthToken;

  // Participant Team Creation via Logistics QR Passes & Re-login via QR
  passesEquipos: TeamCreationPass[];
  dispositivoEquipoId: string | null;
  validarPassCreacionEquipo: (payloadOToken: string) => { ok: boolean; pass?: TeamCreationPass; mensaje: string };
  activarEquipoConPass: (
    passToken: string, 
    nombre: string, 
    integrantes: string[], 
    avatar: string
  ) => Promise<{ ok: boolean; equipo?: Equipo; mensaje: string }>;
  crearEquipoDirecto: (
    nombre: string, 
    integrantes: string[], 
    avatar: string,
    rutaId?: RutaId
  ) => Promise<{ ok: boolean; equipo?: Equipo; mensaje: string }>;
  seleccionarEquipoEnDispositivo: (equipoId: string) => void;
  autorizarEstacionDirecta: (estacionId: EstacionId) => void;
  reingresarEquipoConQr: (qrText: string) => Promise<{ ok: boolean; equipo?: Equipo; mensaje: string }>;
  iniciarTiempoEquipo: (equipoId: string) => Promise<{ ok: boolean; mensaje: string }>;
  desvincularEquipoParticipante: () => void;
  generarNuevoPassEquipo: (rutaId?: RutaId) => TeamCreationPass;

  // Actions
  setActiveRole: (role: Role) => void;
  setCurrentTeamId: (teamId: string) => void;
  setActiveMonitorEstacion: (estacionId: EstacionId) => void;
  registrarEquipo: (nombre: string, integrantes: string[], avatar: string, password?: string) => { equipo: Equipo; error?: string };
  crearEquipoPorLogistica: (nombre: string, integrantes: string[], avatar?: string, rutaEspecifica?: RutaId) => { equipo: Equipo };
  eliminarEquipo: (equipoId: string) => void;
  iniciarLlegadaEstacion: (equipoId: string, estacionId: EstacionId) => { ok: boolean; mensaje: string; registro?: RegistroEstacion };
  validarEstacion: (
    equipoId: string, 
    estacionId: EstacionId, 
    intentos: number, 
    aprobado: boolean, 
    datoCapturado: string,
    monitorId: string
  ) => { ok: boolean; mensaje: string; puntos: number; nuevasInsignias: InsigniaId[] };
  actualizarBlocNotas: (equipoId: string, bloc: { lecturaE3?: string; calculoModulo?: string; calculoDivision?: string; notasLibres?: string }) => void;
  enviarBroadcast: (titulo: string, mensaje: string, tipo: 'alerta' | 'info' | 'tiempo_limite') => void;
  descartarBroadcast: (id: string) => void;
  reiniciarDatosRally: () => void;
  poblarSimulacionCompleta: () => void;
  toggleGpsSimulado: (activo?: boolean) => void;
  calcularDistanciaAEstacion: (estacionId: EstacionId) => { distanciaMetros: number; dentroDelRadio: boolean };
}

const RallyContext = createContext<RallyContextType | undefined>(undefined);

const CURRENT_VERSION = 'v5_clean_zero_teams';
const STORAGE_KEY_VERSION = 'rally2026_storage_version';
const STORAGE_KEY_EQUIPOS = 'rally2026_equipos';
const STORAGE_KEY_REGISTROS = 'rally2026_registros';
const STORAGE_KEY_CONFIG = 'rally2026_config';
const STORAGE_KEY_BROADCASTS = 'rally2026_broadcasts';
const STORAGE_KEY_TOKENS = 'rally2026_monitor_tokens';
const STORAGE_KEY_TEAM_PASSES = 'rally2026_team_passes';
const STORAGE_KEY_DEVICE_AUTH = 'rally2026_device_auth_station';
const STORAGE_KEY_PARTICIPANT_TEAM = 'rally2026_participant_team_id';
const STORAGE_KEY_LOGISTICA_AUTH = 'rally2026_logistica_authed';

export const RallyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge old local dummy data if older version
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_VERSION);
      if (v !== CURRENT_VERSION) {
        localStorage.removeItem(STORAGE_KEY_EQUIPOS);
        localStorage.removeItem(STORAGE_KEY_REGISTROS);
        localStorage.setItem(STORAGE_KEY_VERSION, CURRENT_VERSION);
      }
    } catch (e) {}
  }, []);

  // 1. Initial State from LocalStorage or Clean Defaults
  const [equipos, setEquipos] = useState<Equipo[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_VERSION);
      if (v === CURRENT_VERSION) {
        const saved = localStorage.getItem(STORAGE_KEY_EQUIPOS);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return generarEquiposIniciales();
  });

  const [registros, setRegistros] = useState<RegistroEstacion[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_VERSION);
      if (v === CURRENT_VERSION) {
        const saved = localStorage.getItem(STORAGE_KEY_REGISTROS);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return REGISTROS_INICIALES;
  });

  const [globalConfig, setGlobalConfig] = useState<RallyGlobalConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      rallyIniciado: true,
      horaInicio: new Date().toISOString(),
      tiempoLimiteMinutos: 90,
      pausado: false,
      distanciaMaximaPermitidaMetros: 35,
      passwordLogistica: PASSWORD_LOGISTICA_FIJA
    };
  });

  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BROADCASTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'b-init-1',
        titulo: '¡Rally de Datos 2026 en Marcha!',
        mensaje: 'Bienvenido. Escanea el código QR de Logística para activar tu Pasaporte Oficial.',
        tipo: 'info',
        fecha: new Date().toISOString(),
        activo: true
      }
    ];
  });

  const [tokensMonitores, setTokensMonitores] = useState<MonitorAuthToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return TOKENS_INICIALES_MONITORES;
  });

  const [passesEquipos, setPassesEquipos] = useState<TeamCreationPass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAM_PASSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PASSES_INICIALES_EQUIPOS;
  });

  const [dispositivoAutorizadoEstacion, setDispositivoAutorizadoEstacion] = useState<EstacionId | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEVICE_AUTH);
      if (saved && (['E1', 'E2', 'E3', 'E4', 'E5'] as EstacionId[]).includes(saved as EstacionId)) {
        return saved as EstacionId;
      }
    } catch (e) {}
    return null;
  });

  const [dispositivoEquipoId, setDispositivoEquipoId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PARTICIPANT_TEAM);
    } catch (e) {}
    return null;
  });

  const [isLogisticaAuthed, setIsLogisticaAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_LOGISTICA_AUTH) === 'true';
    } catch (e) {}
    return false;
  });

  const [activeRole, setActiveRoleState] = useState<Role>('participante');
  const [currentTeamId, setCurrentTeamIdState] = useState<string>(dispositivoEquipoId || '');
  const [activeMonitorEstacion, setActiveMonitorEstacionState] = useState<EstacionId>(
    dispositivoAutorizadoEstacion || 'E1'
  );

  const [userGps, setUserGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsSimulado, setGpsSimulado] = useState<boolean>(true);

  // REAL-TIME SERVER SYNC: Polls backend so ALL devices (mobile phones, laptops, monitors) stay in sync
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/rally/state');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (Array.isArray(data.equipos)) setEquipos(data.equipos);
            if (Array.isArray(data.registros)) setRegistros(data.registros);
            if (Array.isArray(data.passesEquipos)) setPassesEquipos(data.passesEquipos);
            if (Array.isArray(data.tokensMonitores)) setTokensMonitores(data.tokensMonitores);
            if (Array.isArray(data.broadcasts)) setBroadcasts(data.broadcasts);
            if (data.globalConfig) setGlobalConfig(data.globalConfig);
          }
        }
      } catch (err) {
        // network or dev fallback
      }
    };

    fetchServerState();
    const interval = setInterval(fetchServerState, 2500);
    return () => clearInterval(interval);
  }, []);

  // URL Query Parameters Support (?team=EQ-XX, ?rol=monitor&estacion=E2, ?rol=logistica)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTeam = params.get('team') || params.get('equipo');
      const urlRole = params.get('rol') || params.get('role');
      const urlStation = (params.get('estacion') || params.get('station')) as EstacionId | null;

      if (urlTeam) {
        setDispositivoEquipoId(urlTeam.toUpperCase());
        setCurrentTeamIdState(urlTeam.toUpperCase());
        localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, urlTeam.toUpperCase());
        setActiveRoleState('participante');
      }

      if (urlRole === 'monitor') {
        setActiveRoleState('monitor');
        if (urlStation && (['E1', 'E2', 'E3', 'E4', 'E5'] as EstacionId[]).includes(urlStation)) {
          setDispositivoAutorizadoEstacion(urlStation);
          setActiveMonitorEstacionState(urlStation);
          localStorage.setItem(STORAGE_KEY_DEVICE_AUTH, urlStation);
        }
      } else if (urlRole === 'logistica') {
        setActiveRoleState('logistica');
      } else if (urlRole === 'participante') {
        setActiveRoleState('participante');
      }
    } catch (e) {}
  }, []);

  // Sync Device Auth change
  useEffect(() => {
    if (dispositivoAutorizadoEstacion) {
      setActiveMonitorEstacionState(dispositivoAutorizadoEstacion);
    }
  }, [dispositivoAutorizadoEstacion]);

  // Sync team change
  useEffect(() => {
    if (dispositivoEquipoId) {
      setCurrentTeamIdState(dispositivoEquipoId);
    }
  }, [dispositivoEquipoId]);

  // Multi-tab synchronization channel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('rally_sync_2026');
        channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_DATA') {
            const { equipos: eq, registros: reg, broadcasts: bc, config: cfg, tokens: tk, passes: ps } = event.data.payload;
            if (eq) setEquipos(eq);
            if (reg) setRegistros(reg);
            if (bc) setBroadcasts(bc);
            if (cfg) setGlobalConfig(cfg);
            if (tk) setTokensMonitores(tk);
            if (ps) setPassesEquipos(ps);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported', err);
    }

    return () => {
      channel?.close();
    };
  }, []);

  // Save to localStorage, broadcast, AND send POST to server
  const persistAndBroadcast = useCallback((
    newEquipos: Equipo[], 
    newRegistros: RegistroEstacion[], 
    newBcs?: BroadcastMessage[], 
    newCfg?: RallyGlobalConfig,
    newTokens?: MonitorAuthToken[],
    newPasses?: TeamCreationPass[]
  ) => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPOS, JSON.stringify(newEquipos));
      localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(newRegistros));
      if (newBcs) localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(newBcs));
      if (newCfg) localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newCfg));
      if (newTokens) localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens));
      if (newPasses) localStorage.setItem(STORAGE_KEY_TEAM_PASSES, JSON.stringify(newPasses));

      // Local Tab Sync
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('rally_sync_2026');
        channel.postMessage({
          type: 'SYNC_DATA',
          payload: {
            equipos: newEquipos,
            registros: newRegistros,
            broadcasts: newBcs || broadcasts,
            config: newCfg || globalConfig,
            tokens: newTokens || tokensMonitores,
            passes: newPasses || passesEquipos
          }
        });
        channel.close();
      }

      // Server Sync (Persistence across devices)
      fetch('/api/rally/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipos: newEquipos,
          registros: newRegistros,
          broadcasts: newBcs || broadcasts,
          globalConfig: newCfg || globalConfig,
          tokensMonitores: newTokens || tokensMonitores,
          passesEquipos: newPasses || passesEquipos
        })
      }).catch(console.warn);

    } catch (e) {
      console.error('Storage sync error', e);
    }
  }, [broadcasts, globalConfig, tokensMonitores, passesEquipos]);

  // Sync state changes to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPOS, JSON.stringify(equipos));
  }, [equipos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEAM_PASSES, JSON.stringify(passesEquipos));
  }, [passesEquipos]);

  useEffect(() => {
    if (dispositivoEquipoId) {
      localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, dispositivoEquipoId);
    } else {
      localStorage.removeItem(STORAGE_KEY_PARTICIPANT_TEAM);
    }
  }, [dispositivoEquipoId]);

  // Current Team reference (STRICTLY THIS DEVICE'S BOUND TEAM)
  const currentTeam = dispositivoEquipoId 
    ? (equipos.find(e => e.equipo_id === dispositivoEquipoId) || null) 
    : (currentTeamId ? (equipos.find(e => e.equipo_id === currentTeamId) || null) : null);

  // Setters
  const setActiveRole = (role: Role) => setActiveRoleState(role);
  const setCurrentTeamId = (teamId: string) => {
    setCurrentTeamIdState(teamId);
    setDispositivoEquipoId(teamId);
  };
  const setActiveMonitorEstacion = (estId: EstacionId) => setActiveMonitorEstacionState(estId);

  // Logistics Authentication: Fixed password 'RALLYSANTOTO'
  const loginLogistica = (pass: string): boolean => {
    if (pass.trim() === PASSWORD_LOGISTICA_FIJA) {
      setIsLogisticaAuthed(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_LOGISTICA_AUTH, 'true');
      } catch (e) {}
      return true;
    }
    return false;
  };

  const logoutLogistica = () => {
    setIsLogisticaAuthed(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_LOGISTICA_AUTH);
    } catch (e) {}
    setActiveRoleState('participante');
  };

  // Monitor Device Authorization via QR
  const autorizarDispositivoMonitor = (tokenOQrPayload: string) => {
    let cleanToken = tokenOQrPayload.trim();

    try {
      if (cleanToken.startsWith('{') && cleanToken.endsWith('}')) {
        const parsed = JSON.parse(cleanToken);
        if (parsed.token) cleanToken = parsed.token;
      }
    } catch (e) {}

    const match = tokensMonitores.find(
      t => t.token.toUpperCase() === cleanToken.toUpperCase()
    );

    if (match) {
      setDispositivoAutorizadoEstacion(match.estacion_id);
      setActiveMonitorEstacionState(match.estacion_id);
      localStorage.setItem(STORAGE_KEY_DEVICE_AUTH, match.estacion_id);
      return {
        ok: true,
        mensaje: `¡Dispositivo Autorizado! Conectado como Monitor Oficial de la ${ESTACIONES[match.estacion_id].nombre} (${match.estacion_id}).`,
        estacionId: match.estacion_id
      };
    }

    return {
      ok: false,
      mensaje: 'Código QR de autorización inválido o no reconocido. Solicita a Logística el Pase QR oficial de la estación.'
    };
  };

  const desautorizarDispositivoMonitor = () => {
    setDispositivoAutorizadoEstacion(null);
    localStorage.removeItem(STORAGE_KEY_DEVICE_AUTH);
  };

  const generarNuevoTokenMonitor = (estacionId: EstacionId): MonitorAuthToken => {
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const nuevoToken: MonitorAuthToken = {
      estacion_id: estacionId,
      token: `RALLY-AUTH-${estacionId}-${randomHex}`,
      creado_el: new Date().toISOString(),
      descripcion: `Pase QR Oficial — Monitor ${ESTACIONES[estacionId].nombre}`
    };

    const updated = tokensMonitores.map(t => t.estacion_id === estacionId ? nuevoToken : t);
    setTokensMonitores(updated);
    persistAndBroadcast(equipos, registros, broadcasts, globalConfig, updated, passesEquipos);
    return nuevoToken;
  };

  // Participant QR Pass Validation
  const validarPassCreacionEquipo = (payloadOToken: string) => {
    let cleanToken = payloadOToken.trim();

    try {
      if (cleanToken.startsWith('{') && cleanToken.endsWith('}')) {
        const parsed = JSON.parse(cleanToken);
        if (parsed.token) cleanToken = parsed.token;
      }
    } catch (e) {}

    const match = passesEquipos.find(p => p.token.toUpperCase() === cleanToken.toUpperCase());

    if (!match) {
      return {
        ok: false,
        mensaje: 'El código QR no corresponde a un Pase Oficial de Registro de Logística.'
      };
    }

    if (match.utilizado) {
      return {
        ok: false,
        mensaje: `Este Pase QR ya fue utilizado anteriormente para registrar al equipo "${match.nombre_equipo_creado || match.equipo_id_asignado}".`
      };
    }

    return {
      ok: true,
      pass: match,
      mensaje: `Pase validado exitosamente. Asignado a ${match.equipo_id_asignado} en Ruta ${match.ruta_id}.`
    };
  };

  // Participant activates team with pass (Server-synced)
  const activarEquipoConPass = async (
    passToken: string, 
    nombre: string, 
    integrantes: string[], 
    avatar: string
  ) => {
    // Call server endpoint
    try {
      const res = await fetch('/api/rally/teams/create-with-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pass_token: passToken,
          nombre: nombre.trim(),
          integrantes,
          avatar
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.equipo) {
          const nuevoEquipo = data.equipo;
          setDispositivoEquipoId(nuevoEquipo.equipo_id);
          setCurrentTeamIdState(nuevoEquipo.equipo_id);
          localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, nuevoEquipo.equipo_id);
          
          setEquipos(prev => [...prev.filter(e => e.equipo_id !== nuevoEquipo.equipo_id), nuevoEquipo]);
          setPassesEquipos(prev => prev.map(p => p.token === passToken ? { ...p, utilizado: true, nombre_equipo_creado: nuevoEquipo.nombre } : p));
          
          return {
            ok: true,
            equipo: nuevoEquipo,
            mensaje: `¡Pasaporte Digital creado con éxito para ${nuevoEquipo.nombre}! Asignado a Ruta ${nuevoEquipo.ruta_id}.`
          };
        }
      } else {
        const err = await res.json();
        return { ok: false, mensaje: err.error || 'Error al crear equipo en el servidor' };
      }
    } catch (e) {
      // Local fallback
    }

    const val = validarPassCreacionEquipo(passToken);
    if (!val.ok || !val.pass) {
      return { ok: false, mensaje: val.mensaje };
    }

    const pass = val.pass;
    const rutaId = pass.ruta_id;

    const nuevoEquipo: Equipo = {
      equipo_id: pass.equipo_id_asignado,
      nombre: nombre.trim() || `Equipo ${pass.equipo_id_asignado}`,
      password: 'rally2026',
      integrantes: Array.isArray(integrantes) ? integrantes.filter(i => i.trim().length > 0) : [],
      avatar: avatar || '🤖',
      ruta_id: rutaId,
      ruta_asignada: [...RUTAS_BASE[rutaId]],
      estacion_actual_index: 0,
      puntaje_total: 0,
      tiempo_acumulado_segundos: 0,
      rally_iniciado: false, // Timer stays NOT started until participant presses "Iniciar Rally"
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

    const updatedPasses = passesEquipos.map(p => {
      if (p.pass_id === pass.pass_id) {
        return {
          ...p,
          utilizado: true,
          nombre_equipo_creado: nuevoEquipo.nombre
        };
      }
      return p;
    });

    const updatedEquipos = [...equipos.filter(e => e.equipo_id !== nuevoEquipo.equipo_id), nuevoEquipo];
    setPassesEquipos(updatedPasses);
    setEquipos(updatedEquipos);
    setDispositivoEquipoId(nuevoEquipo.equipo_id);
    setCurrentTeamIdState(nuevoEquipo.equipo_id);

    persistAndBroadcast(updatedEquipos, registros, broadcasts, globalConfig, tokensMonitores, updatedPasses);

    return {
      ok: true,
      equipo: nuevoEquipo,
      mensaje: `¡Pasaporte Digital activado con éxito para ${nuevoEquipo.nombre}! Asignado a Ruta ${rutaId}.`
    };
  };

  // Direct Team Creation from Any Device (Auto-allocates route/pass)
  const crearEquipoDirecto = async (
    nombre: string, 
    integrantes: string[], 
    avatar: string,
    rutaId?: RutaId
  ) => {
    try {
      const res = await fetch('/api/rally/teams/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          integrantes,
          avatar,
          ruta_id: rutaId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.equipo) {
          const nuevoEquipo = data.equipo;
          setDispositivoEquipoId(nuevoEquipo.equipo_id);
          setCurrentTeamIdState(nuevoEquipo.equipo_id);
          localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, nuevoEquipo.equipo_id);
          setEquipos(prev => [...prev.filter(e => e.equipo_id !== nuevoEquipo.equipo_id), nuevoEquipo]);
          return {
            ok: true,
            equipo: nuevoEquipo,
            mensaje: `¡Pasaporte Digital activado para ${nuevoEquipo.nombre}! Asignado a Ruta ${nuevoEquipo.ruta_id}.`
          };
        }
      } else {
        const err = await res.json();
        return { ok: false, mensaje: err.error || 'Error al crear equipo' };
      }
    } catch (e) {}

    // Fallback if offline/network error
    const localRes = crearEquipoPorLogistica(nombre, integrantes, avatar, rutaId);
    setDispositivoEquipoId(localRes.equipo.equipo_id);
    setCurrentTeamIdState(localRes.equipo.equipo_id);
    localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, localRes.equipo.equipo_id);
    return {
      ok: true,
      equipo: localRes.equipo,
      mensaje: `¡Pasaporte Digital activado para ${localRes.equipo.nombre}!`
    };
  };

  const seleccionarEquipoEnDispositivo = (equipoId: string) => {
    const cleanId = equipoId.trim().toUpperCase();
    const eq = equipos.find(e => e.equipo_id.toUpperCase() === cleanId);
    if (eq) {
      setDispositivoEquipoId(eq.equipo_id);
      setCurrentTeamIdState(eq.equipo_id);
      localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, eq.equipo_id);
      setActiveRoleState('participante');
    }
  };

  const autorizarEstacionDirecta = (estId: EstacionId) => {
    setDispositivoAutorizadoEstacion(estId);
    setActiveMonitorEstacionState(estId);
    localStorage.setItem(STORAGE_KEY_DEVICE_AUTH, estId);
    setActiveRoleState('monitor');
  };

  // Re-login to existing team using QR scan
  const reingresarEquipoConQr = async (qrText: string) => {
    let clean = qrText.trim();
    try {
      if (clean.startsWith('{') && clean.endsWith('}')) {
        const parsed = JSON.parse(clean);
        if (parsed.equipo_id) clean = parsed.equipo_id;
        else if (parsed.token) clean = parsed.token;
      }
    } catch (e) {}

    // Check server endpoint first
    try {
      const res = await fetch('/api/rally/teams/login-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_text: clean })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.equipo) {
          const team = data.equipo;
          setDispositivoEquipoId(team.equipo_id);
          setCurrentTeamIdState(team.equipo_id);
          localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, team.equipo_id);
          setEquipos(prev => [...prev.filter(e => e.equipo_id !== team.equipo_id), team]);
          return {
            ok: true,
            equipo: team,
            mensaje: `¡Sesión restaurada con éxito para ${team.nombre} (${team.equipo_id})!`
          };
        }
      }
    } catch (e) {}

    // Client search fallback
    const match = equipos.find(
      e => e.equipo_id.toUpperCase() === clean.toUpperCase() ||
           (e.auth_qr_secret && e.auth_qr_secret.toUpperCase() === clean.toUpperCase())
    );

    if (match) {
      setDispositivoEquipoId(match.equipo_id);
      setCurrentTeamIdState(match.equipo_id);
      localStorage.setItem(STORAGE_KEY_PARTICIPANT_TEAM, match.equipo_id);
      return {
        ok: true,
        equipo: match,
        mensaje: `¡Sesión restaurada con éxito para ${match.nombre} (${match.equipo_id})!`
      };
    }

    return {
      ok: false,
      mensaje: 'No se encontró ningún equipo registrado con este código QR.'
    };
  };

  // Start Official Rally Timer for Team
  const iniciarTiempoEquipo = async (equipoId: string) => {
    const ahora = new Date().toISOString();
    
    // Server call
    try {
      await fetch('/api/rally/teams/start-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipo_id: equipoId })
      });
    } catch (e) {}

    const updated = equipos.map(e => {
      if (e.equipo_id === equipoId) {
        return {
          ...e,
          rally_iniciado: true,
          hora_inicio_rally: ahora
        };
      }
      return e;
    });

    setEquipos(updated);
    persistAndBroadcast(updated, registros);

    return { ok: true, mensaje: '¡Cronómetro oficial activado! El rally ha comenzado.' };
  };

  const desvincularEquipoParticipante = () => {
    setDispositivoEquipoId(null);
    setCurrentTeamIdState('');
    localStorage.removeItem(STORAGE_KEY_PARTICIPANT_TEAM);
  };

  const generarNuevoPassEquipo = (rutaId?: RutaId): TeamCreationPass => {
    const rutas: RutaId[] = ['A', 'B', 'C', 'D', 'E'];
    const r = rutaId || rutas[passesEquipos.length % 5];
    const nextNum = passesEquipos.length + 1;
    const eqId = `EQ-${String(nextNum).padStart(2, '0')}`;
    const nuevoPass: TeamCreationPass = {
      pass_id: `PASS-${String(nextNum).padStart(2, '0')}`,
      token: `RALLY-TEAM-PASS-${r}-${String(nextNum).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      equipo_id_asignado: eqId,
      ruta_id: r,
      creado_el: new Date().toISOString(),
      utilizado: false
    };

    const updated = [...passesEquipos, nuevoPass];
    setPassesEquipos(updated);
    persistAndBroadcast(equipos, registros, broadcasts, globalConfig, tokensMonitores, updated);
    return nuevoPass;
  };

  // Logistics Direct Team Creation
  const crearEquipoPorLogistica = (
    nombre: string, 
    integrantes: string[], 
    avatar?: string, 
    rutaEspecifica?: RutaId
  ) => {
    const rutas: RutaId[] = ['A', 'B', 'C', 'D', 'E'];
    let rutaAsignada: RutaId = rutaEspecifica || 'A';

    if (!rutaEspecifica) {
      const conteoRutas: Record<RutaId, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
      equipos.forEach(eq => {
        conteoRutas[eq.ruta_id] = (conteoRutas[eq.ruta_id] || 0) + 1;
      });

      let menorCantidad = 999;
      for (const r of rutas) {
        if (conteoRutas[r] < menorCantidad) {
          menorCantidad = conteoRutas[r];
          rutaAsignada = r;
        }
      }
    }

    const nextNum = equipos.length + 1;
    const nuevoId = `EQ-${String(nextNum).padStart(2, '0')}`;

    const nuevoEquipo: Equipo = {
      equipo_id: nuevoId,
      nombre: nombre.trim() || `Equipo ${nextNum}`,
      password: 'rally2026',
      integrantes: integrantes.filter(i => i.trim().length > 0),
      avatar: avatar || '🤖',
      ruta_id: rutaAsignada,
      ruta_asignada: [...RUTAS_BASE[rutaAsignada]],
      estacion_actual_index: 0,
      puntaje_total: 0,
      tiempo_acumulado_segundos: 0,
      rally_iniciado: false, // starts when pressed
      insignias: [],
      bloc_notas: {
        lecturaE3: '',
        calculoModulo: '',
        calculoDivision: '',
        notasLibres: ''
      },
      en_estacion_actual: false,
      auth_qr_secret: `RALLY-TEAM-SECRET-${nuevoId}`
    };

    const updated = [...equipos, nuevoEquipo];
    setEquipos(updated);
    persistAndBroadcast(updated, registros);
    return { equipo: nuevoEquipo };
  };

  const eliminarEquipo = (equipoId: string) => {
    const updatedEquipos = equipos.filter(e => e.equipo_id !== equipoId);
    const updatedRegistros = registros.filter(r => r.equipo_id !== equipoId);
    setEquipos(updatedEquipos);
    setRegistros(updatedRegistros);
    persistAndBroadcast(updatedEquipos, updatedRegistros);

    fetch('/api/rally/teams/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo_id: equipoId })
    }).catch(console.warn);
  };

  const registrarEquipo = (nombre: string, integrantes: string[], avatar: string, password?: string) => {
    return crearEquipoPorLogistica(nombre, integrantes, avatar);
  };

  // Monitor scans arrival
  const iniciarLlegadaEstacion = (equipoId: string, estacionId: EstacionId) => {
    const equipo = equipos.find(e => e.equipo_id === equipoId);
    if (!equipo) {
      return { ok: false, mensaje: `Equipo con código ${equipoId} no encontrado.` };
    }

    if (equipo.estacion_actual_index >= 5) {
      return { ok: false, mensaje: `El equipo ${equipo.nombre} ya completó todas las 5 estaciones del Rally.` };
    }

    const estacionEsperada = equipo.ruta_asignada[equipo.estacion_actual_index];
    if (estacionEsperada !== estacionId) {
      return { 
        ok: false, 
        mensaje: `¡Secuencia Incorrecta! El equipo debe dirigirse a la ${ESTACIONES[estacionEsperada].nombre} (${estacionEsperada}), no a esta estación (${estacionId}).` 
      };
    }

    let regExistente = registros.find(
      r => r.equipo_id === equipoId && r.estacion_id === estacionId && r.estado === 'en_progreso'
    );

    let updatedRegistros: RegistroEstacion[];
    let nuevoRegistro: RegistroEstacion;

    if (!regExistente) {
      nuevoRegistro = {
        registro_id: `REG-${Date.now().toString().slice(-6)}`,
        equipo_id: equipoId,
        estacion_id: estacionId,
        hora_llegada: new Date().toISOString(),
        intentos_usados: 1,
        puntaje_obtenido: 0,
        monitor_id: `MON-${estacionId}`,
        estado: 'en_progreso'
      };
      updatedRegistros = [nuevoRegistro, ...registros];
    } else {
      nuevoRegistro = regExistente;
      updatedRegistros = registros;
    }

    const updatedEquipos = equipos.map(e => {
      if (e.equipo_id === equipoId) {
        return { ...e, en_estacion_actual: true };
      }
      return e;
    });

    setEquipos(updatedEquipos);
    setRegistros(updatedRegistros);
    persistAndBroadcast(updatedEquipos, updatedRegistros);

    return { 
      ok: true, 
      mensaje: `Llegada registrada exitosamente para ${equipo.nombre}. ¡Cronómetro de estación en marcha!`,
      registro: nuevoRegistro 
    };
  };

  // Monitor validates station outcome
  const validarEstacion = (
    equipoId: string, 
    estacionId: EstacionId, 
    intentos: number, 
    aprobado: boolean, 
    datoCapturado: string,
    monitorId: string
  ) => {
    const equipo = equipos.find(e => e.equipo_id === equipoId);
    if (!equipo) return { ok: false, mensaje: 'Equipo no encontrado', puntos: 0, nuevasInsignias: [] };

    const ahora = new Date();
    const horaSalidaIso = ahora.toISOString();

    let regActual = registros.find(
      r => r.equipo_id === equipoId && r.estacion_id === estacionId && r.estado === 'en_progreso'
    );

    const horaLlegada = regActual ? new Date(regActual.hora_llegada) : new Date(Date.now() - 180000);
    const tiempoEstacionSegundos = Math.max(10, Math.round((ahora.getTime() - horaLlegada.getTime()) / 1000));

    let puntos = 0;
    if (aprobado) {
      if (intentos <= 1) puntos = 100;
      else if (intentos === 2) puntos = 70;
      else if (intentos === 3) puntos = 40;
      else puntos = 0;
    } else {
      puntos = 0;
    }

    const regId = regActual?.registro_id || `REG-${Date.now().toString().slice(-6)}`;
    const nuevoRegistro: RegistroEstacion = {
      registro_id: regId,
      equipo_id: equipoId,
      estacion_id: estacionId,
      hora_llegada: horaLlegada.toISOString(),
      hora_salida: horaSalidaIso,
      intentos_usados: intentos,
      puntaje_obtenido: puntos,
      dato_capturado: datoCapturado || 'Dato validado',
      monitor_id: monitorId,
      tiempo_estacion_segundos: tiempoEstacionSegundos,
      estado: aprobado ? 'aprobado' : 'fallido_continuado'
    };

    const updatedRegistros = [
      nuevoRegistro,
      ...registros.filter(r => !(r.equipo_id === equipoId && r.estacion_id === estacionId))
    ];

    const nuevasInsignias: InsigniaId[] = [];
    const insigniasActuales = new Set<InsigniaId>(equipo.insignias);

    if (estacionId === 'E1' && aprobado && intentos === 1 && !insigniasActuales.has('logico_puro')) {
      nuevasInsignias.push('logico_puro');
      insigniasActuales.add('logico_puro');
    }

    if (estacionId === 'E2' && aprobado && tiempoEstacionSegundos <= 120 && !insigniasActuales.has('rayo_binario')) {
      nuevasInsignias.push('rayo_binario');
      insigniasActuales.add('rayo_binario');
    }

    if (estacionId === 'E4' && aprobado && intentos === 1 && !insigniasActuales.has('precision_cero')) {
      nuevasInsignias.push('precision_cero');
      insigniasActuales.add('precision_cero');
    }

    if (aprobado && intentos === 3 && !insigniasActuales.has('resiliencia')) {
      nuevasInsignias.push('resiliencia');
      insigniasActuales.add('resiliencia');
    }

    const nuevoIndex = equipo.estacion_actual_index + 1;
    const nuevoPuntajeTotal = equipo.puntaje_total + puntos;
    const nuevoTiempoTotal = equipo.tiempo_acumulado_segundos + tiempoEstacionSegundos;

    if (nuevoIndex >= 5 && nuevoPuntajeTotal >= 400 && !insigniasActuales.has('pasaporte_dorado')) {
      nuevasInsignias.push('pasaporte_dorado');
      insigniasActuales.add('pasaporte_dorado');
    }

    if (nuevoIndex >= 5 && nuevoTiempoTotal <= 1800 && !insigniasActuales.has('velocista')) {
      nuevasInsignias.push('velocista');
      insigniasActuales.add('velocista');
    }

    const blocActual = { ...(equipo.bloc_notas || { lecturaE3: '', calculoModulo: '', calculoDivision: '', notasLibres: '' }) };
    if (estacionId === 'E3' && datoCapturado) {
      blocActual.lecturaE3 = datoCapturado;
      const num = parseInt(datoCapturado, 10);
      if (!isNaN(num)) {
        blocActual.calculoModulo = (num % 5).toString();
        blocActual.calculoDivision = Math.floor(num / 5).toString();
        blocActual.notasLibres = (blocActual.notasLibres ? blocActual.notasLibres + '\n' : '') +
          `[E3 SENSOR]: Lectura capturada = ${datoCapturado} cm -> Fila=${Math.floor(num / 5)}, Col=${num % 5}`;
      }
    }

    const updatedEquipos = equipos.map(e => {
      if (e.equipo_id === equipoId) {
        return {
          ...e,
          estacion_actual_index: nuevoIndex,
          puntaje_total: nuevoPuntajeTotal,
          tiempo_acumulado_segundos: nuevoTiempoTotal,
          hora_fin_rally: nuevoIndex >= 5 ? horaSalidaIso : e.hora_fin_rally,
          en_estacion_actual: false,
          insignias: Array.from(insigniasActuales),
          bloc_notas: blocActual
        };
      }
      return e;
    });

    setEquipos(updatedEquipos);
    setRegistros(updatedRegistros);
    persistAndBroadcast(updatedEquipos, updatedRegistros);

    return {
      ok: true,
      mensaje: aprobado 
        ? `¡Estación ${estacionId} aprobada con éxito! Puntaje: +${puntos} pts.` 
        : `Estación ${estacionId} cerrada tras 3 intentos. El equipo puede continuar su ruta.`,
      puntos,
      nuevasInsignias
    };
  };

  // Update notepad
  const actualizarBlocNotas = (
    equipoId: string, 
    bloc: { lecturaE3?: string; calculoModulo?: string; calculoDivision?: string; notasLibres?: string }
  ) => {
    const updated = equipos.map(eq => {
      if (eq.equipo_id === equipoId) {
        return {
          ...eq,
          bloc_notas: {
            lecturaE3: bloc.lecturaE3 !== undefined ? bloc.lecturaE3 : (eq.bloc_notas?.lecturaE3 || ''),
            calculoModulo: bloc.calculoModulo !== undefined ? bloc.calculoModulo : (eq.bloc_notas?.calculoModulo || ''),
            calculoDivision: bloc.calculoDivision !== undefined ? bloc.calculoDivision : (eq.bloc_notas?.calculoDivision || ''),
            notasLibres: bloc.notasLibres !== undefined ? bloc.notasLibres : (eq.bloc_notas?.notasLibres || '')
          }
        };
      }
      return eq;
    });
    setEquipos(updated);
    persistAndBroadcast(updated, registros);

    fetch('/api/rally/teams/update-notepad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo_id: equipoId, bloc_notas: bloc })
    }).catch(console.warn);
  };

  // Broadcast
  const enviarBroadcast = (titulo: string, mensaje: string, tipo: 'alerta' | 'info' | 'tiempo_limite') => {
    const nuevo: BroadcastMessage = {
      id: `bc-${Date.now()}`,
      titulo,
      mensaje,
      tipo,
      fecha: new Date().toISOString(),
      activo: true
    };
    const updated = [nuevo, ...broadcasts];
    setBroadcasts(updated);
    persistAndBroadcast(equipos, registros, updated);
  };

  const descartarBroadcast = (id: string) => {
    const updated = broadcasts.filter(b => b.id !== id);
    setBroadcasts(updated);
    persistAndBroadcast(equipos, registros, updated);
  };

  // Reset to default starting clean state (0 teams)
  const reiniciarDatosRally = () => {
    setEquipos([]);
    setRegistros([]);
    setDispositivoEquipoId(null);
    setCurrentTeamIdState('');
    setPassesEquipos(PASSES_INICIALES_EQUIPOS);
    persistAndBroadcast([], [], broadcasts, globalConfig, tokensMonitores, PASSES_INICIALES_EQUIPOS);

    fetch('/api/rally/reset', { method: 'POST' }).catch(console.warn);
  };

  // Simulation generator if user explicitly wants sample progression
  const poblarSimulacionCompleta = () => {
    const rutas: RutaId[] = ['A', 'B', 'C', 'D', 'E'];
    const demoTeams: Equipo[] = rutas.map((r, idx) => ({
      equipo_id: `EQ-${String(idx + 1).padStart(2, '0')}`,
      nombre: `Equipo Beta ${idx + 1}`,
      integrantes: [`Piloto ${idx + 1}`, `Co-piloto ${idx + 1}`],
      avatar: ['🤖', '⚡', '🧠', '🚀', '🔮'][idx],
      ruta_id: r,
      ruta_asignada: [...RUTAS_BASE[r]],
      estacion_actual_index: idx % 3,
      puntaje_total: (idx % 3) * 70,
      tiempo_acumulado_segundos: (idx % 3) * 240,
      rally_iniciado: true,
      hora_inicio_rally: new Date().toISOString(),
      insignias: [],
      bloc_notas: {
        lecturaE3: '',
        calculoModulo: '',
        calculoDivision: '',
        notasLibres: ''
      },
      en_estacion_actual: false,
      auth_qr_secret: `RALLY-DEMO-${idx + 1}`
    }));

    setEquipos(demoTeams);
    persistAndBroadcast(demoTeams, registros);
  };

  // Haversine
  const calcularDistanciaAEstacion = (estacionId: EstacionId) => {
    const est = ESTACIONES[estacionId];
    if (!est) return { distanciaMetros: 0, dentroDelRadio: true };

    if (gpsSimulado || !userGps) {
      return { distanciaMetros: 8, dentroDelRadio: true };
    }

    const R = 6371e3;
    const φ1 = (userGps.lat * Math.PI) / 180;
    const φ2 = (est.coordenadas.lat * Math.PI) / 180;
    const Δφ = ((est.coordenadas.lat - userGps.lat) * Math.PI) / 180;
    const Δλ = ((est.coordenadas.lng - userGps.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = Math.round(R * c);

    const dentro = d <= globalConfig.distanciaMaximaPermitidaMetros;
    return { distanciaMetros: d, dentroDelRadio: dentro };
  };

  const toggleGpsSimulado = (activo?: boolean) => {
    setGpsSimulado(prev => activo !== undefined ? activo : !prev);
  };

  return (
    <RallyContext.Provider
      value={{
        equipos,
        registros,
        activeRole,
        currentTeam,
        activeMonitorEstacion,
        broadcasts,
        globalConfig,
        userGps,
        gpsSimulado,
        isLogisticaAuthed,
        loginLogistica,
        logoutLogistica,
        tokensMonitores,
        dispositivoAutorizadoEstacion,
        autorizarDispositivoMonitor,
        desautorizarDispositivoMonitor,
        generarNuevoTokenMonitor,
        passesEquipos,
        dispositivoEquipoId,
        validarPassCreacionEquipo,
        activarEquipoConPass,
        crearEquipoDirecto,
        seleccionarEquipoEnDispositivo,
        autorizarEstacionDirecta,
        reingresarEquipoConQr,
        iniciarTiempoEquipo,
        desvincularEquipoParticipante,
        generarNuevoPassEquipo,
        setActiveRole,
        setCurrentTeamId,
        setActiveMonitorEstacion,
        registrarEquipo,
        crearEquipoPorLogistica,
        eliminarEquipo,
        iniciarLlegadaEstacion,
        validarEstacion,
        actualizarBlocNotas,
        enviarBroadcast,
        descartarBroadcast,
        reiniciarDatosRally,
        poblarSimulacionCompleta,
        toggleGpsSimulado,
        calcularDistanciaAEstacion
      }}
    >
      {children}
    </RallyContext.Provider>
  );
};

export const useRally = () => {
  const context = useContext(RallyContext);
  if (!context) {
    throw new Error('useRally debe ser utilizado dentro de un RallyProvider');
  }
  return context;
};
