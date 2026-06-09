const router = require('express').Router();
const db = require('../db');

// GET todos
router.get('/', async (req, res) => {
  try {
    const { tipo } = req.query;
    const query = tipo
      ? 'SELECT * FROM terceros WHERE tipo = $1 AND activo = true ORDER BY nombre'
      : 'SELECT * FROM terceros WHERE activo = true ORDER BY nombre';
    const params = tipo ? [tipo] : [];
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET uno
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM terceros WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST crear
router.post('/', async (req, res) => {
  try {
    const { nombre, tipo, documento, telefono, email, notas } = req.body;
    const result = await db.query(
      `INSERT INTO terceros (nombre, tipo, documento, telefono, email, notas)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, tipo, documento, telefono, email, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT actualizar
router.put('/:id', async (req, res) => {
  try {
    const { nombre, tipo, documento, telefono, email, notas, activo } = req.body;
    const result = await db.query(
      `UPDATE terceros SET nombre=$1, tipo=$2, documento=$3, telefono=$4,
       email=$5, notas=$6, activo=$7 WHERE id=$8 RETURNING *`,
      [nombre, tipo, documento, telefono, email, notas, activo, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE terceros SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
