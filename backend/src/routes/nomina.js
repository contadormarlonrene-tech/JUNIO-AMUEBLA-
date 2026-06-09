const router = require('express').Router();
const db = require('../db');

// GET periodos con totales
router.get('/periodos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT np.*, SUM(nd.neto_pagado) AS total_pagado
      FROM nomina_periodos np
      LEFT JOIN nomina_detalle nd ON nd.periodo_id = np.id
      GROUP BY np.id
      ORDER BY np.fecha_inicio DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET detalle de un periodo
router.get('/periodos/:id', async (req, res) => {
  try {
    const periodo = await db.query('SELECT * FROM nomina_periodos WHERE id = $1', [req.params.id]);
    const detalle = await db.query(`
      SELECT nd.*, t.nombre AS empleado_nombre
      FROM nomina_detalle nd
      JOIN terceros t ON nd.empleado_id = t.id
      WHERE nd.periodo_id = $1
    `, [req.params.id]);
    res.json({ ...periodo.rows[0], detalle: detalle.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST crear periodo con detalle
router.post('/periodos', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { periodo, fecha_inicio, fecha_fin, detalle } = req.body;

    const p = await client.query(
      'INSERT INTO nomina_periodos (periodo, fecha_inicio, fecha_fin) VALUES ($1,$2,$3) RETURNING *',
      [periodo, fecha_inicio, fecha_fin]
    );
    const periodo_id = p.rows[0].id;

    for (const d of detalle) {
      const neto = d.salario_base - (d.prestamos || 0) - (d.otras_deducciones || 0);
      await client.query(
        `INSERT INTO nomina_detalle
          (periodo_id, empleado_id, salario_base, prestamos, otras_deducciones, neto_pagado, metodo_pago)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [periodo_id, d.empleado_id, d.salario_base, d.prestamos || 0, d.otras_deducciones || 0, neto, d.metodo_pago || 'efectivo']
      );
      // Registrar como movimiento automáticamente
      await client.query(
        `INSERT INTO movimientos (fecha, tipo, subtipo, concepto, valor, metodo_pago, tercero_id)
         VALUES ($1,'egreso','nomina',$2,$3,$4,$5)`,
        [fecha_fin, `Nómina ${d.nombre_empleado || ''}`, neto, d.metodo_pago || 'efectivo', d.empleado_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ periodo_id, ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
