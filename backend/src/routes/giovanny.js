const router = require('express').Router();
const db = require('../db');

// GET resumen mensual Giovanny
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') AS mes,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN valor ELSE 0 END) AS total_caja,
        SUM(CASE WHEN metodo_pago != 'efectivo' THEN valor ELSE 0 END) AS total_banco,
        SUM(valor) AS total_gastos
      FROM movimientos
      WHERE subtipo = 'gasto_giovanny'
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET detalle de un mes con saldo vs salario
router.get('/:mes', async (req, res) => {
  try {
    const { mes } = req.params;

    const gastos = await db.query(`
      SELECT m.*, c.nombre AS categoria_nombre
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE m.subtipo = 'gasto_giovanny'
        AND TO_CHAR(m.fecha, 'YYYY-MM') = $1
      ORDER BY m.fecha DESC
    `, [mes]);

    const resumen = await db.query(`
      SELECT
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN valor ELSE 0 END) AS total_caja,
        SUM(CASE WHEN metodo_pago != 'efectivo' THEN valor ELSE 0 END) AS total_banco,
        SUM(valor) AS total_gastos
      FROM movimientos
      WHERE subtipo = 'gasto_giovanny'
        AND TO_CHAR(fecha, 'YYYY-MM') = $1
    `, [mes]);

    const salario = await db.query(`
      SELECT SUM(nd.neto_pagado) AS salario_total
      FROM nomina_detalle nd
      JOIN nomina_periodos np ON nd.periodo_id = np.id
      JOIN terceros t ON nd.empleado_id = t.id
      WHERE t.tipo = 'socio'
        AND TO_CHAR(np.fecha_fin, 'YYYY-MM') = $1
    `, [mes]);

    const total_gastos = parseFloat(resumen.rows[0]?.total_gastos || 0);
    const salario_mes  = parseFloat(salario.rows[0]?.salario_total || 0);

    res.json({
      mes,
      gastos: gastos.rows,
      total_caja:   parseFloat(resumen.rows[0]?.total_caja  || 0),
      total_banco:  parseFloat(resumen.rows[0]?.total_banco || 0),
      total_gastos,
      salario_mes,
      saldo: salario_mes - total_gastos  // positivo = le sobra, negativo = debe más
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
