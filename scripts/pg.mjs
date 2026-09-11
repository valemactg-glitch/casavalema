// Ciclo de vida del PostgreSQL local embebido para desarrollo.
// Producción usa Supabase; esto sólo reemplaza la necesidad de Docker en local.
//
//   node scripts/pg.mjs start   → inicia (inicializa la primera vez) y deja corriendo
//   node scripts/pg.mjs stop    → detiene
//   node scripts/pg.mjs status  → estado
//   node scripts/pg.mjs nuke    → detiene y borra los datos
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, ".pgdata");
const PORT = 54329;
const USER = "valema";
const PASSWORD = "valema";
const DB = "valema";

function instance() {
  return new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });
}

async function isUp() {
  const client = new Client({
    host: "127.0.0.1",
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DB,
    connectionTimeoutMillis: 1200,
  });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

let running = null;

async function start() {
  if (await isUp()) {
    console.log(`✔ PostgreSQL ya está arriba en 127.0.0.1:${PORT} — este proceso queda a la espera`);
  } else {
    const pg = instance();
    if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
      console.log("· Inicializando cluster local…");
      await pg.initialise();
    }
    await pg.start();
    try {
      await pg.createDatabase(DB);
      console.log(`· Base de datos "${DB}" creada`);
    } catch {
      /* ya existía */
    }
    running = pg;
    console.log(`✔ PostgreSQL arriba en postgresql://${USER}:***@127.0.0.1:${PORT}/${DB}`);
  }

  // El servidor de embedded-postgres muere si su proceso lanzador termina:
  // este proceso debe seguir vivo. Ctrl+C lo detiene ordenadamente.
  const shutdown = async () => {
    if (running) {
      console.log("\n· Deteniendo PostgreSQL…");
      await running.stop().catch(() => {});
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

async function stop() {
  if (!(await isUp())) {
    console.log("· PostgreSQL no estaba corriendo");
    return;
  }
  await instance().stop();
  console.log("✔ PostgreSQL detenido");
}

async function status() {
  console.log((await isUp()) ? `✔ arriba (127.0.0.1:${PORT})` : "· abajo");
}

async function nuke() {
  await stop().catch(() => {});
  await rm(DATA_DIR, { recursive: true, force: true });
  console.log("✔ Datos locales borrados");
}

const cmd = process.argv[2] ?? "status";
const actions = { start, stop, status, nuke };
if (!actions[cmd]) {
  console.error(`Comando desconocido: ${cmd}. Usa start | stop | status | nuke`);
  process.exit(1);
}
await actions[cmd]();
if (cmd !== "start") process.exit(0);
