import 'dotenv/config';
import { mysqlService } from '../src/db/mysqlClient.ts';

async function main() {
  console.log('========================================================');
  console.log('  RALLY DE DATOS 2026 — INICIALIZADOR DE BASE DE DATOS  ');
  console.log('========================================================\n');

  console.log('> Configuración detectada:');
  console.log(`  - Host:     ${process.env.MYSQL_HOST || '127.0.0.1'}`);
  console.log(`  - Puerto:   ${process.env.MYSQL_PORT || 3306}`);
  console.log(`  - Usuario:  ${process.env.MYSQL_USER || 'root'}`);
  console.log(`  - Base:     ${process.env.MYSQL_DATABASE || 'rally_datos_2026'}\n`);

  console.log('> Creando base de datos rally_datos_2026 y ejecutando esquema...');
  
  const result = await mysqlService.createDatabaseAndTables();

  if (result.ok) {
    console.log('\n[ÉXITO]:', result.message);
    console.log('\n¡Tu base de datos está lista para abrirse en MySQL Workbench!');
    process.exit(0);
  } else {
    console.error('\n[AVISO]:', result.message);
    console.log('\nRecuerda que si no tienes MySQL activo, la app funciona');
    console.log('al 100% con la base de datos persistente integrada (JSON).');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[ERROR]:', err);
  process.exit(1);
});
