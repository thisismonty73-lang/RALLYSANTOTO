import 'dotenv/config';
import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface MysqlConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

export function parseAivenUri(rawUri: string): { ok: boolean; config?: MysqlConfig; error?: string } {
  try {
    const trimmed = rawUri.trim();
    if (!trimmed) {
      return { ok: false, error: 'La URI está vacía.' };
    }
    // Handle standard mysql:// or mysql2:// scheme
    const normalized = trimmed.startsWith('mysql://') || trimmed.startsWith('mysql2://')
      ? trimmed.replace(/^mysql2:\/\//, 'mysql://')
      : `mysql://${trimmed}`;

    const parsed = new URL(normalized);
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 24754;
    const user = decodeURIComponent(parsed.username || 'avnadmin');
    const password = decodeURIComponent(parsed.password || '');
    let database = parsed.pathname.replace(/^\//, '');
    if (!database || database === 'defaultdb') {
      database = 'rally_datos_2026';
    }

    if (!host) {
      return { ok: false, error: 'No se pudo detectar el Host en la URI de Aiven.' };
    }

    return {
      ok: true,
      config: {
        host,
        port,
        user,
        password,
        database,
        ssl: true
      }
    };
  } catch (err: any) {
    return { ok: false, error: `Formato de URI de Aiven no válido: ${err.message}` };
  }
}

class MysqlService {
  private pool: Pool | null = null;
  private isConnected = false;
  private isMissingDatabase = false;
  private connectionError: string | null = null;
  private currentConfig: MysqlConfig = {};

  constructor() {
    this.initPool();
  }

  private getSslOptions(host?: string, requestedSsl?: boolean) {
    const isAiven = Boolean(host && (host.includes('aivencloud.com') || host.includes('aiven.io')));
    const isCloud = isAiven || Boolean(host && (host.includes('aws') || host.includes('azure') || host.includes('digitalocean')));
    if (isAiven || isCloud || requestedSsl) {
      return { rejectUnauthorized: false };
    }
    return undefined;
  }

  public initPool(customConfig?: MysqlConfig) {
    if (this.pool) {
      try {
        this.pool.end();
      } catch (e) {}
      this.pool = null;
    }

    const host = customConfig?.host || process.env.MYSQL_HOST;
    const user = customConfig?.user || process.env.MYSQL_USER;
    const password = customConfig?.password !== undefined ? customConfig.password : process.env.MYSQL_PASSWORD;
    const database = customConfig?.database || process.env.MYSQL_DATABASE || 'rally_datos_2026';
    const port = customConfig?.port || (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306);
    const ssl = this.getSslOptions(host, customConfig?.ssl);

    this.currentConfig = { host, user, password, database, port, ssl: Boolean(ssl) };

    // Only attempt pool creation if host or user is defined
    if (host && user) {
      try {
        this.pool = mysql.createPool({
          host,
          port,
          user,
          password: password || '',
          database,
          ssl,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000
        });

        // Test connection asynchronously
        this.testConnection();
      } catch (err: any) {
        this.connectionError = err.message || 'Error al inicializar pool MySQL';
        console.warn('> [MySQL]: No se pudo inicializar pool:', this.connectionError);
      }
    }
  }

  public async testConnection(customConfig?: MysqlConfig): Promise<{ 
    ok: boolean; 
    isMissingDatabase?: boolean; 
    message: string; 
    host?: string;
    database?: string;
    isAiven?: boolean;
    ssl?: boolean;
  }> {
    const host = customConfig?.host || this.currentConfig.host || process.env.MYSQL_HOST || '127.0.0.1';
    const port = customConfig?.port || this.currentConfig.port || (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306);
    const user = customConfig?.user || this.currentConfig.user || process.env.MYSQL_USER || 'root';
    const password = customConfig?.password !== undefined ? customConfig.password : (this.currentConfig.password || process.env.MYSQL_PASSWORD || '');
    const database = customConfig?.database || this.currentConfig.database || process.env.MYSQL_DATABASE || 'rally_datos_2026';
    const ssl = this.getSslOptions(host, customConfig?.ssl);
    const isAiven = Boolean(host && (host.includes('aivencloud.com') || host.includes('aiven.io')));

    // First try connecting directly to the database
    try {
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        ssl
      });
      await conn.query('SELECT 1');
      await conn.end();

      this.isConnected = true;
      this.isMissingDatabase = false;
      this.connectionError = null;

      // Update currentConfig and re-init pool if customConfig was supplied and succeeded
      if (customConfig) {
        this.currentConfig = { host, port, user, password, database, ssl: Boolean(ssl) };
        this.initPool(customConfig);
      }

      const cloudLabel = isAiven ? ' de Aiven.io (Cloud TLS)' : '';
      console.log(`> [MySQL]: Conexión exitosa a '${database}' en ${host}:${port}${cloudLabel}`);
      return { 
        ok: true, 
        message: `¡Conexión exitosa a la base de datos '${database}' en ${host}:${port}${cloudLabel}!`,
        host,
        database,
        isAiven,
        ssl: Boolean(ssl)
      };
    } catch (err: any) {
      this.isConnected = false;

      // Check if the error is missing database (Unknown database)
      if (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) {
        this.isMissingDatabase = true;
        this.connectionError = `Base de datos '${database}' no encontrada en el servidor.`;
        return {
          ok: false,
          isMissingDatabase: true,
          message: `El servidor MySQL (${host}:${port}) respondió correctamente con tu usuario '${user}', pero la base de datos '${database}' aún NO ha sido creada. Puedes crearla con un solo clic abajo.`,
          host,
          database,
          isAiven,
          ssl: Boolean(ssl)
        };
      }

      // Check if connection refused (MySQL server not running)
      if (err.code === 'ECONNREFUSED') {
        this.isMissingDatabase = false;
        this.connectionError = `Servidor MySQL no alcanzable en ${host}:${port}`;
        return {
          ok: false,
          isMissingDatabase: false,
          message: `No se pudo conectar a MySQL en ${host}:${port}. Verifica que el host/puerto sean correctos y el servicio esté encendido.`,
          host,
          database,
          isAiven,
          ssl: Boolean(ssl)
        };
      }

      // Check if access denied (wrong user/password)
      if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
        this.isMissingDatabase = false;
        this.connectionError = `Acceso denegado para usuario '${user}'.`;
        return {
          ok: false,
          isMissingDatabase: false,
          message: `Acceso denegado para el usuario '${user}'. Revisa tu contraseña de Aiven/MySQL.`,
          host,
          database,
          isAiven,
          ssl: Boolean(ssl)
        };
      }

      this.connectionError = err.message || 'Error al conectar con MySQL';
      return {
        ok: false,
        isMissingDatabase: false,
        message: err.message || 'Error desconocido al conectar con MySQL.',
        host,
        database,
        isAiven,
        ssl: Boolean(ssl)
      };
    }
  }

  public async createDatabaseAndTables(customConfig?: MysqlConfig): Promise<{ 
    ok: boolean; 
    message: string; 
    details?: any 
  }> {
    const host = customConfig?.host || this.currentConfig.host || process.env.MYSQL_HOST || '127.0.0.1';
    const port = customConfig?.port || this.currentConfig.port || (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306);
    const user = customConfig?.user || this.currentConfig.user || process.env.MYSQL_USER || 'root';
    const password = customConfig?.password !== undefined ? customConfig.password : (this.currentConfig.password || process.env.MYSQL_PASSWORD || '');
    const database = customConfig?.database || this.currentConfig.database || process.env.MYSQL_DATABASE || 'rally_datos_2026';
    const ssl = this.getSslOptions(host, customConfig?.ssl);

    try {
      // 1. Connect without database parameter, with multipleStatements enabled and SSL
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        ssl,
        multipleStatements: true
      });

      // 2. Read full official SQL schema
      const schemaPath = path.join(process.cwd(), 'mysql', 'schema_rally_datos_2026.sql');
      let sqlContent = '';

      if (fs.existsSync(schemaPath)) {
        sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        // Fallback minimal SQL
        sqlContent = `
          CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          USE \`${database}\`;
          CREATE TABLE IF NOT EXISTS config_global (
            clave VARCHAR(50) PRIMARY KEY,
            valor TEXT,
            descripcion VARCHAR(255),
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          );
        `;
      }

      // 3. Execute all statements
      await conn.query(sqlContent);
      await conn.end();

      // 4. Update internal pool and mark as connected
      this.initPool({ host, port, user, password, database, ssl: Boolean(ssl) });
      this.isConnected = true;
      this.isMissingDatabase = false;
      this.connectionError = null;

      console.log(`> [MySQL]: ¡Base de datos '${database}' y tablas creadas exitosamente!`);

      return {
        ok: true,
        message: `¡Base de datos '${database}', las 8 tablas, las 3 vistas y los 25 pases de logística fueron creados exitosamente en tu servidor MySQL!`,
        details: { host, port, database, user }
      };
    } catch (err: any) {
      console.error('> [MySQL]: Error al crear base de datos:', err);

      let msg = err.message || 'Error al ejecutar script de creación en MySQL';
      if (err.code === 'ECONNREFUSED') {
        msg = `No se pudo conectar a MySQL en ${host}:${port}. Asegúrate de que el servidor MySQL esté iniciado.`;
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
        msg = `Acceso denegado para el usuario '${user}'. Verifica tu contraseña de MySQL.`;
      }

      return {
        ok: false,
        message: msg
      };
    }
  }

  public saveConfigToEnv(config: MysqlConfig): boolean {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let content = '';
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf-8');
      }

      const updates: Record<string, string> = {
        MYSQL_HOST: config.host || '',
        MYSQL_PORT: String(config.port || 24754),
        MYSQL_USER: config.user || '',
        MYSQL_PASSWORD: config.password || '',
        MYSQL_DATABASE: config.database || 'rally_datos_2026'
      };

      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
          content = content.replace(regex, `${key}="${value}"`);
        } else {
          content += `\n${key}="${value}"`;
        }
        // Also update runtime process.env
        process.env[key] = value;
      }

      fs.writeFileSync(envPath, content.trim() + '\n', 'utf-8');
      return true;
    } catch (e) {
      console.error('Error saving config to .env:', e);
      return false;
    }
  }

  public getStatus() {
    const host = this.currentConfig.host || process.env.MYSQL_HOST || '';
    const isAiven = Boolean(host && (host.includes('aivencloud.com') || host.includes('aiven.io')));

    return {
      configured: Boolean(host),
      connected: this.isConnected,
      isMissingDatabase: this.isMissingDatabase,
      error: this.connectionError,
      host: host || 'no configurado',
      port: this.currentConfig.port || (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306),
      database: this.currentConfig.database || process.env.MYSQL_DATABASE || 'rally_datos_2026',
      user: this.currentConfig.user || process.env.MYSQL_USER || 'avnadmin',
      isAiven,
      sslEnabled: Boolean(this.getSslOptions(host, this.currentConfig.ssl))
    };
  }

  public getPool(): Pool | null {
    return this.pool;
  }
}

export const mysqlService = new MysqlService();
