const router = require('express').Router();
const db = require('../db');

// GET con filtros opcionales: ?mes=2026-06 | ?proyecto_id=1 | ?subtipo=gasto_giovanny
router.get('/', async (req, res) => {
  try {
    const { mes, proyecto_id, subtipo, tipo, tercero_id } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (mes) {
      conditions.push(`TO_CHAR(m.fecha, 'YYYY-MM') = $${i++}`);
      params.push(mes);
    }
    if (proyecto_id) { conditions.push(`m.proyecto_id = $${i++}`); params.push(proyecto_id); }
    if (subtipo)     { conditions.push(`m.subtipo = $${i++}`);     params.push(subtipo); }
    if (tipo)        { conditions.push(`m.tipo = $${i++}`);        params.push(tipo); }
    if (tercero_id)  { conditions.push(`m.tercero_id = $${i++}`);  params.push(tercero_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT
        m.*,
        c.nombre  AS categoria_nombre,
        c.color   AS categoria_color,
        t.nombre  AS tercero_nombre,
        p.nombre  AS proyecto_nombre
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      LEFT JOIN terceros   t ON m.tercero_id   = t.id
      LEFT JOIN proyectos  p ON m.proyecto_id  = p.id
      ${where}
      ORDER BY m.fecha DESC, m.creado_en DESC
    `, params);

    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET resumen por día para un mes
router.get('/resumen-diario', async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Parámetro mes requerido (YYYY-MM)' });

    const result = await db.query(`
      SELECT
        fecha,
        SUM(CASE WHEN tipo = 'ingreso' THEN valor ELSE 0 END) AS ingresos,
        SUM(CASE WHEN tipo = 'egreso'  THEN valor ELSE 0 END) AS egresos,
        SUM(CASE WHEN tipo = 'ingreso' THEN valor ELSE -valor END) AS neto
      FROM movimientos
      WHERE TO_CHAR(fecha, 'YYYY-MM') = $1
      GROUP BY fecha
      ORDER BY fecha
    `, [mes]);

    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST crear
router.post('/', async (req, res) => {
  try {
    const {
      fecha, tipo, subtipo, concepto, valor,
      metodo_pago, tercero_id, proyecto_id,
      categoria_id, tiene_factura, numero_factura,
      iva, retencion, notas
    } = req.body;

    const result = await db.query(`
      INSERT INTO movimientos
        (fecha, tipo, subtipo, concepto, valor, metodo_pago,
         tercero_id, proyecto_id, categoria_id, tiene_factura,
         numero_factura, iva, retencion, notas)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        fecha, tipo, subtipo, concepto, valor, metodo_pago,
        tercero_id || null, proyecto_id || null, categoria_id || null,
        tiene_factura || false, numero_factura || null,
        iva || 0, retencion || 0, notas || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT actualizar
router.put('/:id', async (req, res) => {
  try {
    const {
      fecha, tipo, subtipo, concepto, valor,
      metodo_pago, tercero_id, proyecto_id,
      categoria_id, tiene_factura, numero_factura,
      iva, retencion, notas
    } = req.body;

    const result = await db.query(`
      UPDATE movimientos SET
        fecha=$1, tipo=$2, subtipo=$3, concepto=$4, valor=$5,
        metodo_pago=$6, tercero_id=$7, proyecto_id=$8,
        categoria_id=$9, tiene_factura=$10, numero_factura=$11,
        iva=$12, retencion=$13, notas=$14
      WHERE id=$15 RETURNING *`,
      [
        fecha, tipo, subtipo, concepto, valor, metodo_pago,
        tercero_id || null, proyecto_id || null, categoria_id || null,
        tiene_factura, numero_factura || null,
        iva || 0, retencion || 0, notas || null,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM movimientos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
