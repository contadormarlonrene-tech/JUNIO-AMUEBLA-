const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const db = require('./db');

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/terceros',    require('./routes/terceros'));
app.use('/api/categorias',  require('./routes/categorias'));
app.use('/api/proyectos',   require('./routes/proyectos'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/nomina',      require('./routes/nomina'));
app.use('/api/facturas',    require('./routes/facturas'));
app.use('/api/giovanny',    require('./routes/giovanny'));
app.use('/api/dashboard',   require('./routes/dashboard'));

app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Amuebla Tu Hogar API', version: '1.0.0' });
});

// Endpoint de inicialización — ejecuta cada sentencia SQL por separado
app.post('/api/setup', async (req, res) => {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Divide por ; y elimina solo bloques sin SQL real (solo comentarios o vacíos)
  const sentencias = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Quitar líneas de comentario para verificar si queda algo ejecutable
      const sinComentarios = s.split('\n')
        .filter(l => !l.trim().startsWith('--'))
        .join('\n')
        .trim();
      return sinComentarios.length > 0;
    })
    .map(s => {
      // Ejecutar solo las líneas que no son comentarios puras de bloque
      return s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim();
    })
    .filter(s => s.length > 0);

  const resultados = [];
  for (const sentencia of sentencias) {
    try {
      await db.query(sentencia);
      resultados.push({ ok: true, sql: sentencia.substring(0, 60) });
    } catch (e) {
      resultados.push({ ok: false, error: e.message, sql: sentencia.substring(0, 60) });
    }
  }

  const errores = resultados.filter(r => !r.ok);
  res.json({
    ok: errores.length === 0,
    total: sentencias.length,
    exitosas: resultados.filter(r => r.ok).length,
    errores: errores.length,
    detalle: errores
  });
});

// Limpieza de duplicados — solo se usa una vez
app.post('/api/cleanup', async (req, res) => {
  try {
    // Eliminar categorías duplicadas dejando solo la de menor id por nombre
    await db.query(`
      DELETE FROM categorias WHERE id NOT IN (
        SELECT MIN(id) FROM categorias GROUP BY nombre
      )
    `);
    // Agregar restricción UNIQUE si no existe
    await db.query(`
      ALTER TABLE categorias ADD CONSTRAINT categorias_nombre_unique UNIQUE (nombre)
    `).catch(() => {}); // ignora si ya existe
    const { rows } = await db.query('SELECT COUNT(*) FROM categorias');
    res.json({ ok: true, categorias_restantes: rows[0].count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function initDB() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const sentencias = sql
    .split(';')
    .map(s => s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim())
    .filter(s => s.length > 0);

  let ok = 0, err = 0;
  for (const s of sentencias) {
    try { await db.query(s); ok++; } catch (e) {
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        console.error('SQL error:', e.message.substring(0, 80));
        err++;
      } else { ok++; }
    }
  }
  console.log(`Base de datos inicializada: ${ok} OK, ${err} errores`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  await initDB();
});
