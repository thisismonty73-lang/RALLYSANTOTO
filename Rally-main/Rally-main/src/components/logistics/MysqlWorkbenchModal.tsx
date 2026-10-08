import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  X, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Table,
  Layers,
  Code,
  Sparkles,
  Play,
  KeyRound,
  Server,
  Info,
  Cloud,
  Link2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface MysqlWorkbenchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MysqlWorkbenchModal: React.FC<MysqlWorkbenchModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedQuickSql, setCopiedQuickSql] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [copiedAivenConfig, setCopiedAivenConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'aiven' | 'crear_bd' | 'conexion' | 'schema' | 'consultas'>('aiven');
  const [sqlContent, setSqlContent] = useState<string>('');
  const [loadingSql, setLoadingSql] = useState(false);
  
  // Custom connection form for testing and auto-creation
  const [customHost, setCustomHost] = useState('mysql-3ec5f85a-diegoullo344-a2b1.b.aivencloud.com');
  const [customPort, setCustomPort] = useState('24754');
  const [customUser, setCustomUser] = useState('avnadmin');
  const [customPassword, setCustomPassword] = useState('');
  const [customDbName, setCustomDbName] = useState('rally_datos_2026');
  const [showPassword, setShowPassword] = useState(false);

  // Aiven Service URI input
  const [aivenUriInput, setAivenUriInput] = useState('');
  const [processingUri, setProcessingUri] = useState(false);
  const [uriResult, setUriResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [creatingDb, setCreatingDb] = useState(false);
  const [createDbResult, setCreateDbResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [syncingState, setSyncingState] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [savingConfig, setSavingConfig] = useState(false);
  const [saveConfigResult, setSaveConfigResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [mysqlStatus, setMysqlStatus] = useState<{
    configured: boolean;
    connected: boolean;
    isMissingDatabase?: boolean;
    error: string | null;
    host: string;
    port: number;
    database: string;
    user: string;
    isAiven?: boolean;
    sslEnabled?: boolean;
  } | null>(null);

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; isMissingDatabase?: boolean; message: string } | null>(null);

  // Fetch status and SQL schema when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchSchema();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/rally/mysql/status');
      if (res.ok) {
        const data = await res.json();
        setMysqlStatus(data);
        if (data.host && data.host !== 'no configurado') setCustomHost(data.host);
        if (data.port) setCustomPort(String(data.port));
        if (data.user && data.user !== 'no configurado') setCustomUser(data.user);
        if (data.database) setCustomDbName(data.database);
      }
    } catch (e) {}
  };

  const fetchSchema = async () => {
    setLoadingSql(true);
    try {
      const res = await fetch('/api/rally/mysql/schema');
      if (res.ok) {
        const text = await res.text();
        setSqlContent(text);
      }
    } catch (e) {
      console.warn('Error fetching schema', e);
    } finally {
      setLoadingSql(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/rally/mysql/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: customHost,
          port: parseInt(customPort, 10) || 3306,
          user: customUser,
          password: customPassword,
          database: customDbName,
          ssl: true
        })
      });
      const data = await res.json();
      setTestResult(data);
      fetchStatus();
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Error de red al conectar' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConnectWithAivenUri = async () => {
    if (!aivenUriInput.trim()) {
      setUriResult({ ok: false, message: 'Por favor ingresa o pega el Service URI de Aiven.io.' });
      return;
    }

    setProcessingUri(true);
    setUriResult(null);

    try {
      // 1. Parse URI on server
      const parseRes = await fetch('/api/rally/mysql/parse-uri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: aivenUriInput })
      });
      const parsedData = await parseRes.json();

      if (!parsedData.ok || !parsedData.config) {
        setUriResult({ ok: false, message: parsedData.error || 'No se pudo procesar el formato de la URI.' });
        return;
      }

      const cfg = parsedData.config;
      // Populate fields
      if (cfg.host) setCustomHost(cfg.host);
      if (cfg.port) setCustomPort(String(cfg.port));
      if (cfg.user) setCustomUser(cfg.user);
      if (cfg.password) setCustomPassword(cfg.password);
      if (cfg.database) setCustomDbName(cfg.database);

      // 2. Save and activate config on server
      const saveRes = await fetch('/api/rally/mysql/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const saveData = await saveRes.json();

      if (saveData.ok) {
        setUriResult({
          ok: true,
          message: `¡Conexión a Aiven.io establecida exitosamente con el host ${cfg.host}:${cfg.port}!`
        });
        fetchStatus();
      } else {
        setUriResult({
          ok: false,
          message: `Se extrajeron los datos, pero hubo un error de conexión: ${saveData.message}`
        });
      }
    } catch (err: any) {
      setUriResult({ ok: false, message: err.message || 'Error al conectar con Aiven.io' });
    } finally {
      setProcessingUri(false);
    }
  };

  const handleSaveAndApplyConfig = async () => {
    setSavingConfig(true);
    setSaveConfigResult(null);
    try {
      const res = await fetch('/api/rally/mysql/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: customHost,
          port: parseInt(customPort, 10) || 3306,
          user: customUser,
          password: customPassword,
          database: customDbName,
          ssl: true
        })
      });
      const data = await res.json();
      setSaveConfigResult(data);
      fetchStatus();
    } catch (err: any) {
      setSaveConfigResult({ ok: false, message: err.message || 'Error al guardar configuración' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncingState(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/rally/mysql/sync-now', {
        method: 'POST'
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (err: any) {
      setSyncResult({ ok: false, message: err.message || 'Error al sincronizar' });
    } finally {
      setSyncingState(false);
    }
  };

  const handleCreateDatabaseAuto = async () => {
    setCreatingDb(true);
    setCreateDbResult(null);
    try {
      const res = await fetch('/api/rally/mysql/create-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: customHost,
          port: parseInt(customPort, 10) || 3306,
          user: customUser,
          password: customPassword,
          database: customDbName,
          ssl: true
        })
      });
      const data = await res.json();
      setCreateDbResult(data);
      if (data.ok) {
        fetchStatus();
      }
    } catch (err: any) {
      setCreateDbResult({ ok: false, message: err.message || 'Error al enviar orden de creación a MySQL' });
    } finally {
      setCreatingDb(false);
    }
  };

  const quickSqlText = `CREATE DATABASE IF NOT EXISTS \`${customDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE \`${customDbName}\`;`;

  const handleCopyQuickSql = () => {
    navigator.clipboard.writeText(quickSqlText);
    setCopiedQuickSql(true);
    setTimeout(() => setCopiedQuickSql(false), 2500);
  };

  const handleCopySql = () => {
    if (!sqlContent) return;
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyQuery = (query: string, id: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const handleCopyAivenConfig = () => {
    const text = `Host: ${customHost}\nPort: ${customPort}\nUser: ${customUser}\nDatabase: ${customDbName}\nSSL: REQUIRED`;
    navigator.clipboard.writeText(text);
    setCopiedAivenConfig(true);
    setTimeout(() => setCopiedAivenConfig(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema_rally_datos_2026.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const isAivenDetected = Boolean(
    mysqlStatus?.isAiven || 
    customHost.includes('aivencloud.com') || 
    customHost.includes('aiven.io')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-7 relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white">
                  Base de Datos & Conexión Aiven.io
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Aiven Cloud MySQL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecta tu instancia en la nube de Aiven.io, inicializa el esquema o enlaza con MySQL Workbench
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-3 border-b border-slate-800/80 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('aiven')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'aiven'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-500/30'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>☁️ Conectar a Aiven.io</span>
          </button>

          <button
            onClick={() => setActiveTab('crear_bd')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'crear_bd'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Inicializar Tablas Oficiales</span>
          </button>

          <button
            onClick={() => setActiveTab('conexion')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'conexion'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. Parámetros para Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>2. Script SQL Oficial</span>
          </button>

          <button
            onClick={() => setActiveTab('consultas')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'consultas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>3. Consultas en Vivo</span>
          </button>
        </div>

        {/* TAB 0: AIVEN.IO INTEGRATION */}
        {activeTab === 'aiven' && (
          <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
            
            {/* Live Aiven Connection Status Banner */}
            <div className={`p-4 rounded-2xl border transition-all ${
              mysqlStatus?.connected && isAivenDetected
                ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/60 border-emerald-500/40'
                : 'bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-blue-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    mysqlStatus?.connected && isAivenDetected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {mysqlStatus?.connected && isAivenDetected
                          ? '¡Conectado Exitosamente a Aiven.io Cloud!'
                          : 'Conexión a tu Base de Datos en Aiven.io'}
                      </h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        mysqlStatus?.connected && isAivenDetected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {mysqlStatus?.connected && isAivenDetected ? '🟢 Online (TLS)' : 'Configurar'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {mysqlStatus?.connected && isAivenDetected
                        ? `Tu servidor está enlazado a ${mysqlStatus.host}:${mysqlStatus.port}. Todos los equipos, pases y registros se sincronizan en vivo.`
                        : 'Puedes conectar la base de datos de tu proyecto en Aiven.io pegando la Service URI o ingresando tus credenciales.'}
                    </p>

                    {mysqlStatus?.connected && isAivenDetected && (
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-emerald-300/90">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cifrado SSL/TLS Activo
                        </span>
                        <span>•</span>
                        <span>Base de Datos: <strong className="text-white">{mysqlStatus.database}</strong></span>
                        <span>•</span>
                        <span>Usuario: <strong className="text-white">{mysqlStatus.user}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={handleSyncNow}
                    disabled={syncingState}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    title="Forzar sincronización inmediata de equipos y pases"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingState ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{syncingState ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
                  </button>

                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-slate-950' : ''}`} />
                    <span>Verificar Ping</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncResult.message}</span>
                </div>
              )}
            </div>

            {/* MÉTODO 1: PEGAR SERVICE URI DE AIVEN */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-cyan-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <h5 className="text-xs font-black uppercase text-cyan-300 tracking-wide">
                    Método Rápido: Pegar "Service URI" de Aiven.io
                  </h5>
                </div>
                <span className="text-[10px] text-cyan-400/80 font-mono">
                  Detección y configuración automática
                </span>
              </div>

              <p className="text-xs text-slate-300">
                En tu panel de Aiven (<strong>console.aiven.io</strong>) &gt; Servicio MySQL &gt; pestaña <strong>Overview</strong> &gt; haz clic en copiar el <strong>Service URI</strong>:
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aivenUriInput}
                  onChange={(e) => setAivenUriInput(e.target.value)}
                  placeholder="mysql://avnadmin:password@mysql-xxxxx.aivencloud.com:24754/defaultdb?ssl-mode=REQUIRED"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleConnectWithAivenUri}
                  disabled={processingUri || !aivenUriInput.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {processingUri ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span>{processingUri ? 'Conectando...' : 'Conectar con Aiven'}</span>
                </button>
              </div>

              {uriResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  uriResult.ok 
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                }`}>
                  {uriResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{uriResult.message}</span>
                </div>
              )}
            </div>

            {/* MÉTODO 2: PARÁMETROS MANUALES DE AIVEN */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <h5 className="text-xs font-black uppercase text-blue-300 tracking-wide">
                    Credenciales Detalladas de Aiven
                  </h5>
                </div>
                <button
                  onClick={handleCopyAivenConfig}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  {copiedAivenConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAivenConfig ? '¡Copiado!' : 'Copiar Parámetros'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Host de Aiven:
                  </label>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="mysql-xxxx.aivencloud.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Puerto:
                  </label>
                  <input
                    type="text"
                    value={customPort}
                    onChange={(e) => setCustomPort(e.target.value)}
                    placeholder="24754"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Usuario:
                  </label>
                  <input
                    type="text"
                    value={customUser}
                    onChange={(e) => setCustomUser(e.target.value)}
                    placeholder="avnadmin"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400">
                      Contraseña:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Contraseña de Aiven"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Base de Datos:
                  </label>
                  <input
                    type="text"
                    value={customDbName}
                    onChange={(e) => setCustomDbName(e.target.value)}
                    placeholder="rally_datos_2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleSaveAndApplyConfig}
                  disabled={savingConfig}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {savingConfig ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{savingConfig ? 'Guardando...' : 'Guardar y Activar en Servidor'}</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Probar Conexión</span>
                </button>

                <button
                  onClick={handleCreateDatabaseAuto}
                  disabled={creatingDb}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                >
                  {creatingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Inicializar Tablas en Aiven</span>
                </button>
              </div>

              {saveConfigResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  saveConfigResult.ok 
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                }`}>
                  {saveConfigResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{saveConfigResult.message}</span>
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.ok 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                }`}>
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* GUÍA PASO A PASO: WORKBENCH CON AIVEN */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                ¿Cómo abrir la base de datos de Aiven en MySQL Workbench?
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-mono font-bold block">1. Nueva Conexión</span>
                  <p>En MySQL Workbench haz clic en <strong>"+"</strong> junto a <em>MySQL Connections</em>.</p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-mono font-bold block">2. Parámetros</span>
                  <p>Pega el <strong>Hostname</strong> (<code className="text-cyan-300 font-mono">{customHost}</code>) y el <strong>Puerto</strong> (<code className="text-cyan-300 font-mono">{customPort}</code>).</p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-mono font-bold block">3. SSL Requerido</span>
                  <p>En la pestaña <strong>SSL</strong> de Workbench, cambia <em>Use SSL</em> a <strong>"Require"</strong>. ¡Aiven exige cifrado TLS!</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 1: CREAR BASE DE DATOS E INICIALIZAR TABLAS */}
        {activeTab === 'crear_bd' && (
          <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
            
            {/* Direct Answer Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-cyan-950/40 p-4 rounded-2xl border border-amber-500/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Inicializar Esquema Oficial del Rally en tu Base de Datos
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Crea la base de datos <code className="text-amber-300 font-mono bg-amber-950/80 px-2 py-0.5 rounded text-xs border border-amber-500/30">rally_datos_2026</code>, las 8 tablas, las 3 vistas de auditoría y los 25 pases de logística autorizados.
                  </p>
                </div>
              </div>
            </div>

            {/* OPCIÓN 1: CREAR AUTOMÁTICAMENTE CON 1 CLIC */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <h5 className="text-xs font-black uppercase text-cyan-300 tracking-wide">
                    Opción A: Creación Automática en 1 Clic (Recomendada)
                  </h5>
                </div>
                <span className="text-[10px] text-cyan-400/80 font-mono">
                  Crea DB + 8 Tablas + 3 Vistas
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Aplica directamente las tablas y vistas oficiales sobre tu conexión actual ({customHost}:{customPort}).
              </p>

              {/* Action button */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleCreateDatabaseAuto}
                  disabled={creatingDb}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {creatingDb ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {creatingDb ? 'Creando base de datos y tablas...' : '⚡ Crear Base de Datos rally_datos_2026 Ahora'}
                  </span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Probar Conexión</span>
                </button>
              </div>

              {/* Results feedback */}
              {createDbResult && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  createDbResult.ok 
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                }`}>
                  {createDbResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block">{createDbResult.ok ? '¡Creación Exitosa!' : 'Atención al Crear:'}</strong>
                    <p className="mt-0.5">{createDbResult.message}</p>
                    {createDbResult.ok && (
                      <p className="text-[11px] text-emerald-300 mt-1 font-mono">
                        Ya puedes abrir MySQL Workbench o la consola de Aiven y consultar las tablas de <code>rally_datos_2026</code>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* OPCIÓN 2: CREAR EN MYSQL WORKBENCH CON 2 LÍNEAS */}
            <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <h5 className="text-xs font-black uppercase text-purple-300 tracking-wide">
                    Opción B: Crearla directamente en MySQL Workbench (2 líneas SQL)
                  </h5>
                </div>
                
                <button
                  onClick={handleCopyQuickSql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {copiedQuickSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuickSql ? '¡Copiado!' : 'Copiar Comando SQL'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Si prefieres hacerlo manualmente en <strong>MySQL Workbench</strong>:
              </p>

              {/* Code display */}
              <div className="relative">
                <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">
{quickSqlText}
                </pre>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Connection Details for Workbench */}
        {activeTab === 'conexion' && (
          <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
            {/* Status card */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  mysqlStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Estado del Motor:</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
                      mysqlStatus?.connected 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {mysqlStatus?.connected ? 'Conectado a MySQL / Aiven Cloud' : 'Listo para Conectar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {mysqlStatus?.connected 
                      ? `Conexión activa con ${mysqlStatus.host}:${mysqlStatus.port} (BD: ${mysqlStatus.database})` 
                      : 'Listo para sincronizar.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Probar</span>
                </button>
              </div>
            </div>

            {/* MySQL Workbench Setup Parameters */}
            <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Parámetros para tu conexión en MySQL Workbench
              </h4>
              <p className="text-xs text-slate-300">
                En tu aplicación <strong>MySQL Workbench</strong> (PC o Mac), crea una nueva conexión con los siguientes datos:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Connection Name:</span>
                  <span className="text-white font-bold text-sm">Rally Aiven 2026</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Hostname / IP:</span>
                  <span className="text-cyan-300 font-bold text-xs break-all">{customHost}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Port:</span>
                  <span className="text-white font-bold text-sm">{customPort}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Username:</span>
                  <span className="text-amber-300 font-bold text-sm">{customUser}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block uppercase">Default Schema:</span>
                  <span className="text-purple-300 font-bold text-sm">{customDbName}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: SQL Schema Script */}
        {activeTab === 'schema' && (
          <div className="space-y-3 py-4 overflow-y-auto pr-1 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Archivo SQL: schema_rally_datos_2026.sql
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Crea las 8 tablas, las claves foráneas, las 3 vistas y los 25 pases iniciales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>

                <button
                  onClick={handleDownloadSql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .sql</span>
                </button>
              </div>
            </div>

            {/* Instruction on how to run in Workbench */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-slate-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong>¿Cómo ejecutar en MySQL Workbench o Aiven?</strong> Abre una pestaña de consulta SQL (<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">Ctrl + T</kbd>), pega el contenido de abajo y presiona el ícono del rayo ⚡ (<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-mono">Ctrl + Shift + Enter</kbd>).
              </div>
            </div>

            {/* SQL Preview Box */}
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                {sqlContent || (loadingSql ? 'Cargando script SQL...' : '-- No se pudo cargar el script')}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Useful Queries & Views */}
        {activeTab === 'consultas' && (
          <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
            <p className="text-xs text-slate-300">
              Consultas SQL preparadas para ejecutar en <strong>MySQL Workbench</strong> o la consola de <strong>Aiven</strong> durante el evento:
            </p>

            {/* Query 1 */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="text-amber-400">🏆</span> 1. Tabla de Posiciones y Ranking en Vivo
                </span>
                <button
                  onClick={() => handleCopyQuery('SELECT * FROM v_ranking_en_vivo;', 'q1')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedQuery === 'q1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery === 'q1' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-cyan-300 border border-slate-800">
SELECT * FROM v_ranking_en_vivo;
              </pre>
            </div>

            {/* Query 2 */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="text-cyan-400">📋</span> 2. Control y Auditoría de Sellos por Estación
                </span>
                <button
                  onClick={() => handleCopyQuery('SELECT * FROM v_auditoria_estaciones ORDER BY hora_llegada DESC LIMIT 20;', 'q2')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedQuery === 'q2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery === 'q2' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-cyan-300 border border-slate-800">
SELECT * FROM v_auditoria_estaciones ORDER BY hora_llegada DESC LIMIT 20;
              </pre>
            </div>

            {/* Query 3 */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="text-purple-400">🎫</span> 3. Estado de los 25 Pases de Logística (Disponibles vs Usados)
                </span>
                <button
                  onClick={() => handleCopyQuery('SELECT ruta_id, estado, COUNT(*) AS total FROM v_resumen_pases_logistica GROUP BY ruta_id, estado;', 'q3')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedQuery === 'q3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuery === 'q3' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 p-2.5 rounded-xl text-[11px] font-mono text-cyan-300 border border-slate-800">
SELECT ruta_id, estado, COUNT(*) AS total 
FROM v_resumen_pases_logistica 
GROUP BY ruta_id, estado;
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <span className={`w-2 h-2 rounded-full ${mysqlStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              {mysqlStatus?.connected ? 'Aiven Cloud MySQL: Conectado' : 'Aiven Cloud: Configurando'} • 
              BD: <strong className="text-white">{mysqlStatus?.database || 'rally_datos_2026'}</strong> • 
              Host: <strong className="text-white">{mysqlStatus?.host || 'aivencloud.com'}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
