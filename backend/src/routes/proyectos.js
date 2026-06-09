const router = require('express').Router();
const db = require('../db');

// GET todos con resumen financiero calculado
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        t.nombre AS cliente_nombre,
        COALESCE(SUM(CASE WHEN m.subtipo = 'abono_proyecto' THEN m.valor ELSE 0 END), 0) AS total_abonos,
        COALESCE(SUM(CASE WHEN m.subtipo IN ('costo_proyecto','gasto_proyecto') THEN m.valor ELSE 0 END), 0) AS total_costos,
        p.valor_total - COALESCE(SUM(CASE WHEN m.subtipo = 'abono_proyecto' THEN m.valor ELSE 0 END), 0) AS saldo_por_cobrar
      FROM proyectos p
      LEFT JOIN terceros t ON p.cliente_id = t.id
      LEFT JOIN movimientos m ON m.proyecto_id = p.id
      WHERE p.estado != 'eliminado'
      GROUP BY p.id, t.nombre
      ORDER BY p.fecha_inicio DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET uno con movimientos detallados
router.get('/:id', async (req, res) => {
  try {
    const proyecto = await db.query(`
      SELECT p.*, t.nombre AS cliente_nombre
      FROM proyectos p
      LEFT JOIN terceros t ON p.cliente_id = t.id
      WHERE p.id = $1`, [req.params.id]);

    if (!proyecto.rows.length) return res.status(404).json({ error: 'No encontrado' });

    const movimientos = await db.query(`
      SELECT m.*, c.nombre AS categoria_nombre, t.nombre AS tercero_nombre
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      LEFT JOIN terceros t ON m.tercero_id = t.id
      WHERE m.proyecto_id = $1
      ORDER BY m.fecha DESC`, [req.params.id]);

    res.json({ ...proyecto.rows[0], movimientos: movimientos.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST crear
router.post('/', async (req, res) => {
  try {
    const { nombre, cliente_id, valor_total, estado, fecha_inicio, fecha_fin, notas } = req.body;
    const result = await db.query(
      `INSERT INTO proyectos (nombre, cliente_id, valor_total, estado, fecha_inicio, fecha_fin, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nombre, cliente_id, valor_total, estado || 'activo', fecha_inicio, fecha_fin, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT actualizar
router.put('/:id', async (req, res) => {
  try {
    const { nombre, cliente_id, valor_total, estado, fecha_inicio, fecha_fin, notas } = req.body;
    const result = await db.query(
      `UPDATE proyectos SET nombre=$1, cliente_id=$2, valor_total=$3, estado=$4,
       fecha_inicio=$5, fecha_fin=$6, notas=$7 WHERE id=$8 RETURNING *`,
      [nombre, cliente_id, valor_total, estado, fecha_inicio, fecha_fin, notas, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
