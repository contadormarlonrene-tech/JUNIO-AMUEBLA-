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

// Endpoint de inicialización — crea todas las tablas ejecutando schema.sql
app.post('/api/setup', async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await db.query(sql);
    res.json({ ok: true, mensaje: 'Base de datos inicializada correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
