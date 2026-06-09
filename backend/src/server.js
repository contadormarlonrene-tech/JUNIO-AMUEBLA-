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

  // Divide por ; ignorando líneas de comentario y vacías
  const sentencias = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
