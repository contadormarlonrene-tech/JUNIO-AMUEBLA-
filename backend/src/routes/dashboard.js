const router = require('express').Router();
const db = require('../db');

// GET /api/dashboard/resumen?mes=2026-06
// Devuelve todos los datos que necesita el frontend para pintar el dashboard
router.get('/resumen', async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Parámetro mes requerido (YYYY-MM)' });

    const [totales, porDia, porMetodo, porCategoria, proyectos, giovanny, cartera] = await Promise.all([

      // Totales del mes
      db.query(`
        SELECT
          SUM(CASE WHEN tipo='ingreso' THEN valor ELSE 0 END) AS total_ingresos,
          SUM(CASE WHEN tipo='egreso'  THEN valor ELSE 0 END) AS total_egresos,
          SUM(CASE WHEN tipo='ingreso' THEN valor ELSE -valor END) AS saldo_neto,
          SUM(CASE WHEN tipo='ingreso' AND metodo_pago='efectivo' THEN valor ELSE 0 END) AS ingresos_caja,
          SUM(CASE WHEN tipo='ingreso' AND metodo_pago!='efectivo' THEN valor ELSE 0 END) AS ingresos_banco,
          SUM(CASE WHEN tipo='egreso'  AND metodo_pago='efectivo' THEN valor ELSE 0 END) AS egresos_caja,
          SUM(CASE WHEN tipo='egreso'  AND metodo_pago!='efectivo' THEN valor ELSE 0 END) AS egresos_banco
        FROM movimientos
        WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
      `, [mes]),

      // Ingresos y egresos por día
      db.query(`
        SELECT
          fecha,
          SUM(CASE WHEN tipo='ingreso' THEN valor ELSE 0 END) AS ingresos,
          SUM(CASE WHEN tipo='egreso'  THEN valor ELSE 0 END) AS egresos
        FROM movimientos
        WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
        GROUP BY fecha ORDER BY fecha
      `, [mes]),

      // Totales por método de pago
      db.query(`
        SELECT metodo_pago,
          SUM(CASE WHEN tipo='ingreso' THEN valor ELSE 0 END) AS ingresos,
          SUM(CASE WHEN tipo='egreso'  THEN valor ELSE 0 END) AS egresos
        FROM movimientos
        WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
        GROUP BY metodo_pago
      `, [mes]),

      // Egresos por categoría (top 8)
      db.query(`
        SELECT c.nombre, c.color, SUM(m.valor) AS total
        FROM movimientos m
        JOIN categorias c ON m.categoria_id = c.id
        WHERE m.tipo = 'egreso' AND TO_CHAR(m.fecha, 'YYYY-MM') = $1
        GROUP BY c.id, c.nombre, c.color
        ORDER BY total DESC LIMIT 8
      `, [mes]),

      // Proyectos activos con rentabilidad
      db.query(`
        SELECT
          p.id, p.nombre, p.valor_total, p.estado,
          t.nombre AS cliente,
          COALESCE(SUM(CASE WHEN m.subtipo='abono_proyecto' THEN m.valor ELSE 0 END),0) AS abonos,
          COALESCE(SUM(CASE WHEN m.subtipo IN ('costo_proyecto','gasto_proyecto') THEN m.valor ELSE 0 END),0) AS costos
        FROM proyectos p
        LEFT JOIN terceros t ON p.cliente_id = t.id
        LEFT JOIN movimientos m ON m.proyecto_id = p.id
        WHERE p.estado = 'activo'
        GROUP BY p.id, t.nombre
        ORDER BY p.fecha_inicio DESC
      `, []),

      // Giovanny del mes
      db.query(`
        SELECT
          SUM(CASE WHEN metodo_pago='efectivo' THEN valor ELSE 0 END) AS caja,
          SUM(CASE WHEN metodo_pago!='efectivo' THEN valor ELSE 0 END) AS banco,
          SUM(valor) AS total
        FROM movimientos
        WHERE subtipo='gasto_giovanny' AND TO_CHAR(fecha,'YYYY-MM')=$1
      `, [mes]),

      // Cuentas por cobrar (proyectos con saldo pendiente)
      db.query(`
        SELECT
          p.nombre, p.valor_total,
          t.nombre AS cliente,
          COALESCE(SUM(CASE WHEN m.subtipo='abono_proyecto' THEN m.valor ELSE 0 END),0) AS abonado,
          p.valor_total - COALESCE(SUM(CASE WHEN m.subtipo='abono_proyecto' THEN m.valor ELSE 0 END),0) AS saldo
        FROM proyectos p
        LEFT JOIN terceros t ON p.cliente_id = t.id
        LEFT JOIN movimientos m ON m.proyecto_id = p.id
        WHERE p.estado != 'eliminado'
        GROUP BY p.id, t.nombre
        HAVING p.valor_total - COALESCE(SUM(CASE WHEN m.subtipo='abono_proyecto' THEN m.valor ELSE 0 END),0) > 0
        ORDER BY saldo DESC
      `, [])
    ]);

    res.json({
      mes,
      totales:       totales.rows[0],
      por_dia:       porDia.rows,
      por_metodo:    porMetodo.rows,
      por_categoria: porCategoria.rows,
      proyectos:     proyectos.rows,
      giovanny:      giovanny.rows[0],
      cartera:       cartera.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
