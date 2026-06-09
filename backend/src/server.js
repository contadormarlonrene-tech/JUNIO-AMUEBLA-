const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
