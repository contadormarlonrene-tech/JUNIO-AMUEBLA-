const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { mes } = req.query;
    const query = mes
      ? `SELECT f.*, t.nombre AS proveedor_nombre FROM facturas_dian f
         LEFT JOIN terceros t ON f.proveedor_id = t.id
         WHERE TO_CHAR(f.fecha, 'YYYY-MM') = $1 ORDER BY f.fecha DESC`
      : `SELECT f.*, t.nombre AS proveedor_nombre FROM facturas_dian f
         LEFT JOIN terceros t ON f.proveedor_id = t.id ORDER BY f.fecha DESC`;
    const result = await db.query(query, mes ? [mes] : []);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { numero_factura, proveedor_id, fecha, valor_bruto, iva, retencion, notas } = req.body;
    const valor_neto = valor_bruto - (iva || 0) - (retencion || 0);
    const result = await db.query(
      `INSERT INTO facturas_dian (numero_factura, proveedor_id, fecha, valor_bruto, iva, retencion, valor_neto, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [numero_factura, proveedor_id, fecha, valor_bruto, iva || 0, retencion || 0, valor_neto, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM facturas_dian WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
