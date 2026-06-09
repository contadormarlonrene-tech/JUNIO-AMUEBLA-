const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { tipo } = req.query;
    const query = tipo
      ? 'SELECT * FROM categorias WHERE tipo = $1 ORDER BY nombre'
      : 'SELECT * FROM categorias ORDER BY tipo, nombre';
    const result = await db.query(query, tipo ? [tipo] : []);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, tipo, color, icono } = req.body;
    const result = await db.query(
      'INSERT INTO categorias (nombre, tipo, color, icono) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, tipo, color, icono]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, tipo, color, icono } = req.body;
    const result = await db.query(
      'UPDATE categorias SET nombre=$1, tipo=$2, color=$3, icono=$4 WHERE id=$5 RETURNING *',
      [nombre, tipo, color, icono, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
