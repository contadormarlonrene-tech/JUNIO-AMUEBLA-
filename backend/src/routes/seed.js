const router = require('express').Router();
const db = require('../db');

// ── helpers ──────────────────────────────────────────────────────────────────

async function findOrInsertTercero(nombre, tipo) {
  const { rows } = await db.query(
    'SELECT id FROM terceros WHERE nombre = $1 LIMIT 1', [nombre]
  );
  if (rows.length) return rows[0].id;
  const r = await db.query(
    'INSERT INTO terceros (nombre, tipo) VALUES ($1, $2) RETURNING id',
    [nombre, tipo]
  );
  return r.rows[0].id;
}

async function findOrInsertProyecto(nombre, clienteId, valorTotal, estado) {
  const { rows } = await db.query(
    'SELECT id FROM proyectos WHERE nombre = $1 LIMIT 1', [nombre]
  );
  if (rows.length) return rows[0].id;
  const r = await db.query(
    `INSERT INTO proyectos (nombre, cliente_id, valor_total, estado, fecha_inicio)
     VALUES ($1, $2, $3, $4, '2026-06-01') RETURNING id`,
    [nombre, clienteId, valorTotal, estado]
  );
  return r.rows[0].id;
}

async function mov(data) {
  await db.query(
    `INSERT INTO movimientos
       (fecha, tipo, subtipo, concepto, valor, metodo_pago,
        tercero_id, proyecto_id, categoria_id,
        tiene_factura, numero_factura, iva, retencion, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      data.fecha, data.tipo, data.subtipo, data.concepto, data.valor, data.metodo,
      data.tercero || null, data.proyecto || null, data.cat || null,
      data.factura || false, data.nroFac || null,
      data.iva || 0, data.ret || 0, data.notas || null
    ]
  );
}

// ── POST /api/seed-junio ──────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    // Idempotencia: si ya hay movimientos de junio 2026, no duplicar
    const check = await db.query(
      "SELECT COUNT(*) FROM movimientos WHERE TO_CHAR(fecha,'YYYY-MM') = '2026-06'"
    );
    const existentes = parseInt(check.rows[0].count);
    if (existentes > 0 && !req.query.force) {
      return res.json({
        ok: false,
        msg: `Ya existen ${existentes} movimientos de junio 2026. Agrega ?force=1 para re-sembrar.`
      });
    }
    if (req.query.force) {
      await db.query("DELETE FROM facturas_dian WHERE TO_CHAR(fecha,'YYYY-MM') = '2026-06'");
      await db.query("DELETE FROM nomina_detalle WHERE periodo_id IN (SELECT id FROM nomina_periodos WHERE periodo = '2026-06-S1')");
      await db.query("DELETE FROM nomina_periodos WHERE periodo = '2026-06-S1'");
      await db.query("DELETE FROM movimientos WHERE TO_CHAR(fecha,'YYYY-MM') = '2026-06'");
    }

    // ── 1. CATEGORÍAS ─────────────────────────────────────────────────────────
    const { rows: catRows } = await db.query('SELECT id, nombre FROM categorias');
    const C = {};
    for (const c of catRows) C[c.nombre] = c.id;

    const VENTAS  = C['Ventas / Cobro proyecto'];
    const PREST   = C['Préstamo recibido'];
    const OTRO_IN = C['Otro ingreso'];
    const MATER   = C['Materia prima / Materiales'];
    const HERRA   = C['Herrajes y accesorios'];
    const TRANSP  = C['Transporte / Flete'];
    const NOMINA  = C['Nómina empleados'];
    const HONORAR = C['Honorarios Marlon'];
    const SERV    = C['Servicios públicos'];
    const GASGIO  = C['Gastos Giovanny'];
    const PAGPRO  = C['Pago a proveedor'];
    const GASVR   = C['Gastos varios / Operativos'];
    const POLLOS  = C['Pollos / Alimentación'];

    // ── 2. TERCEROS ───────────────────────────────────────────────────────────
    const T = {};
    const lista = [
      ['Franklin',                    'empleado'],
      ['Alejandro',                   'empleado'],
      ['Wilson',                      'empleado'],
      ['Giovanny',                    'socio'],
      ['Yeritte Maibeline Melo Sandoval', 'cliente'],
      ['Herrajes Sebastian',          'proveedor'],
      ['Magaly',                      'proveedor'],
      ['Claudia',                     'cliente'],
      ['Marcela',                     'cliente'],
      ['Oswaldo Duarte',              'cliente'],
      ['Keidy Nicolay',               'cliente'],
      ['Samuel Aragon',               'cliente'],
      ['Heidy Navas',                 'cliente'],
      ['Blanca',                      'cliente'],
      ['Maibeline',                   'proveedor'],
      ['Wendy Rueda',                 'cliente'],
      ['Dora',                        'cliente'],
      ['Yair',                        'cliente'],
      ['Oscar Saga',                  'cliente'],
      ['Stefanny',                    'cliente'],
      ['Marlon Hernandez',            'proveedor'],
      ['MADEFRONT COLOMBIA SAS',      'proveedor'],
      ['DECOTRIPLEX S.A.S.',          'proveedor'],
      ['GRUPO MONDRAGON',             'proveedor'],
      ['CARMEN LUCIA VEGA MENDEZ',    'proveedor'],
      ['KEVIN ANDRES CACERES GARCIA', 'proveedor'],
    ];
    for (const [nombre, tipo] of lista) {
      T[nombre] = await findOrInsertTercero(nombre, tipo);
    }

    // ── 3. PROYECTOS ──────────────────────────────────────────────────────────
    const P = {};
    P['Marcela']       = await findOrInsertProyecto('Marcela',       T['Marcela'],       4200000, 'activo');
    P['Oswaldo Duarte']= await findOrInsertProyecto('Oswaldo Duarte',T['Oswaldo Duarte'],3200000, 'activo');
    P['Keidy Nicolay'] = await findOrInsertProyecto('Keidy Nicolay', T['Keidy Nicolay'],  580000, 'activo');
    P['Samuel Aragon'] = await findOrInsertProyecto('Samuel Aragon', T['Samuel Aragon'], 3500000, 'activo');
    P['Claudia']       = await findOrInsertProyecto('Claudia',       T['Claudia'],       2800000, 'finalizado');
    P['Oscar Saga']    = await findOrInsertProyecto('Oscar Saga',    T['Oscar Saga'],     709190, 'activo');

    // ── 4. MOVIMIENTOS ────────────────────────────────────────────────────────

    // ===== LUNES 01 DE JUNIO =====
    await mov({ fecha:'2026-06-01', tipo:'ingreso', subtipo:'prestamo',
      concepto:'Préstamo recibido caja', valor:112000, metodo:'efectivo',
      cat:PREST });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Mundo Cortes', valor:8500, metodo:'efectivo',
      tercero:T['KEVIN ANDRES CACERES GARCIA'], proyecto:P['Claudia'],
      cat:MATER, factura:true, nroFac:'KCG-27071', iva:1357 });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Gaseosas', valor:15000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Canto flexible', valor:13500, metodo:'efectivo',
      proyecto:P['Claudia'], cat:HERRA });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Lavadora', valor:10000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Talco', valor:15000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos perros — Purina', valor:3000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Hayacas', valor:12000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Material platera', valor:91000, metodo:'bancolombia',
      proyecto:P['Claudia'], cat:MATER });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Yair — Madefront FE-182508', valor:393690, metodo:'bancolombia',
      tercero:T['MADEFRONT COLOMBIA SAS'], tercero2:T['Yair'],
      cat:MATER, factura:true, nroFac:'FE-182508', iva:62858 });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida Nequi', valor:52700, metodo:'nequi',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Claudia — Indrive + transporte', valor:87000, metodo:'bancolombia',
      proyecto:P['Claudia'], cat:TRANSP });
    await mov({ fecha:'2026-06-01', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — 4x1000', valor:2498, metodo:'bancolombia',
      cat:GASVR });

    // ===== MARTES 02 DE JUNIO =====
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Gaseosas', valor:15000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Diferencia', valor:9000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Transporte — Cuenta por cobrar', valor:30000, metodo:'bancolombia',
      cat:TRANSP });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — TC Master Pesos', valor:50952, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — 4x1000', valor:905, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Claudia — Almuerzos', valor:48000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida Nequi', valor:23400, metodo:'nequi',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-02', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Claudia — Transporte', valor:74000, metodo:'bancolombia',
      cat:TRANSP });
    await mov({ fecha:'2026-06-02', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso bancario — Intereses ahorros', valor:3, metodo:'bancolombia',
      cat:OTRO_IN });

    // ===== MIÉRCOLES 03 DE JUNIO =====
    await mov({ fecha:'2026-06-03', tipo:'ingreso', subtipo:'prestamo',
      concepto:'Préstamo recibido caja', valor:32000, metodo:'efectivo',
      cat:PREST });
    await mov({ fecha:'2026-06-03', tipo:'ingreso', subtipo:'venta',
      concepto:'Ingreso pollos — Blanca', valor:42000, metodo:'efectivo',
      tercero:T['Blanca'], cat:POLLOS });
    await mov({ fecha:'2026-06-03', tipo:'ingreso', subtipo:'venta',
      concepto:'Ingreso — Heidy Navas', valor:50000, metodo:'efectivo',
      tercero:T['Heidy Navas'], cat:VENTAS });
    // Abono Marcela banco (primer pago del proyecto)
    await mov({ fecha:'2026-06-03', tipo:'ingreso', subtipo:'abono_proyecto',
      concepto:'Abono Marcela — Bancolombia', valor:2100000, metodo:'bancolombia',
      tercero:T['Marcela'], proyecto:P['Marcela'], cat:VENTAS });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Café', valor:2500, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Papel higiénico', valor:2500, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos perros — Purina', valor:6000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos taller — Hueso duro', valor:15000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Gastos taller — Masilla', valor:22000, metodo:'efectivo',
      cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Claudia — Almuerzos', valor:24000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Cifon', valor:4000, metodo:'efectivo',
      proyecto:P['Claudia'], cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Varsol', valor:3000, metodo:'efectivo',
      proyecto:P['Claudia'], cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida, gaseosa, esperanza', valor:35000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Dora — Material banco', valor:20000, metodo:'bancolombia',
      tercero:T['Dora'], cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Marcela — Material banco', valor:100000, metodo:'bancolombia',
      tercero:T['Marcela'], proyecto:P['Marcela'], cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — Materiales x5', valor:23500, metodo:'bancolombia',
      proyecto:P['Claudia'], cat:MATER });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos taller — banco', valor:15000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'prestamo',
      concepto:'Préstamo a Franklin', valor:20000, metodo:'bancolombia',
      tercero:T['Franklin'], cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'otro',
      concepto:'Devolución banco — Saldo a favor', valor:20000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Niko + comida Nequi', valor:43300, metodo:'nequi',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-03', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — 4x1000', valor:967, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-03', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso bancario — Intereses ahorros', valor:6, metodo:'bancolombia',
      cat:OTRO_IN });

    // ===== JUEVES 04 DE JUNIO =====
    await mov({ fecha:'2026-06-04', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso — Devolución caja', valor:6500, metodo:'efectivo',
      cat:OTRO_IN });
    await mov({ fecha:'2026-06-04', tipo:'ingreso', subtipo:'abono_proyecto',
      concepto:'Ingreso Claudia — Cobro proyecto', valor:2800000, metodo:'efectivo',
      tercero:T['Claudia'], proyecto:P['Claudia'], cat:VENTAS });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gasto — Gaveta', valor:6500, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Claudia — varios', valor:7000, metodo:'efectivo',
      proyecto:P['Claudia'], cat:MATER });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'pago_proveedor',
      concepto:'Pago Maibeline — proveedor', valor:811500, metodo:'efectivo',
      tercero:T['Maibeline'], cat:PAGPRO });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Dojan — caja', valor:15600, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida', valor:8000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos perros — Purina', valor:6000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos pollos — Purina', valor:4000, metodo:'efectivo',
      cat:POLLOS });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Gaseosa', valor:6000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida Nequi', valor:27900, metodo:'nequi',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos Dojan — banco (Grupo Mondragon GMFE-195602)', valor:127600, metodo:'bancolombia',
      tercero:T['GRUPO MONDRAGON'], cat:GASVR,
      factura:true, nroFac:'GMFE-195602', iva:20373 });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — ARA Tiendas', valor:15600, metodo:'bancolombia',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-04', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — 4x1000', valor:684, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-04', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso bancario — Intereses ahorros', valor:5, metodo:'bancolombia',
      cat:OTRO_IN });

    // ===== VIERNES 05 DE JUNIO =====
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Jabón', valor:32000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Fresas', valor:9000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos perros — Purina caja', valor:5500, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos pollos — Purina x2 caja', valor:5600, metodo:'efectivo',
      cat:POLLOS });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gasto — Purina fina caja', valor:3000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida caja', valor:10000, metodo:'efectivo',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Marcela — Grupo Mondragon GMFE-195833', valor:61800, metodo:'bancolombia',
      tercero:T['GRUPO MONDRAGON'], proyecto:P['Marcela'],
      cat:MATER, factura:true, nroFac:'GMFE-195833', iva:20086 });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Marcela — Material Madefront FE-183103', valor:576500, metodo:'bancolombia',
      tercero:T['MADEFRONT COLOMBIA SAS'], proyecto:P['Marcela'],
      cat:MATER, factura:true, nroFac:'FE-183103', iva:0,
      notas:'Pago parcial. Total factura $1,705,190 — saldo en crédito' });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos moto — Pulsar', valor:260000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Comida Nequi', valor:35700, metodo:'nequi',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — PC', valor:14000, metodo:'bancolombia',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos — ARL + comisiones', valor:64000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos bancarios — 4x1000', valor:4516, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos perros — Purina banco', valor:53000, metodo:'bancolombia',
      cat:GASVR });
    await mov({ fecha:'2026-06-05', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Gastos pollos — Purina banco', valor:50000, metodo:'bancolombia',
      cat:POLLOS });
    await mov({ fecha:'2026-06-05', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso bancario — Intereses ahorros', valor:5, metodo:'bancolombia',
      cat:OTRO_IN });

    // ===== SÁBADO 06 DE JUNIO =====
    await mov({ fecha:'2026-06-06', tipo:'ingreso', subtipo:'abono_proyecto',
      concepto:'Abono Oswaldo Duarte — Shirley caja', valor:600000, metodo:'efectivo',
      tercero:T['Oswaldo Duarte'], proyecto:P['Oswaldo Duarte'], cat:VENTAS });
    await mov({ fecha:'2026-06-06', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso taller — caja', valor:5000, metodo:'efectivo',
      cat:OTRO_IN });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'nomina',
      concepto:'Nómina Alejandro', valor:200000, metodo:'efectivo',
      tercero:T['Alejandro'], cat:NOMINA });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'nomina',
      concepto:'Nómina Franklin (descontado préstamo $95,000)', valor:205000, metodo:'efectivo',
      tercero:T['Franklin'], cat:NOMINA,
      notas:'Salario base $300,000 - Préstamo $95,000 = $205,000 neto' });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'nomina',
      concepto:'Nómina Wilson', valor:400000, metodo:'efectivo',
      tercero:T['Wilson'], cat:NOMINA });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Honorarios Marlon Hernández — caja', valor:80000, metodo:'efectivo',
      tercero:T['Marlon Hernandez'], cat:HONORAR });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Luz — Casa', valor:250000, metodo:'efectivo',
      cat:SERV });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Luz — Taller', valor:100000, metodo:'efectivo',
      cat:SERV });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Garantía', valor:3000, metodo:'efectivo',
      cat:GASVR });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Dora — Fleje caja', valor:6300, metodo:'efectivo',
      tercero:T['Dora'], cat:MATER });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'costo_proyecto',
      concepto:'Costo Oswaldo — DECOTRIPLEX DEC-310699', valor:231500, metodo:'bancolombia',
      tercero:T['DECOTRIPLEX S.A.S.'], proyecto:P['Oswaldo Duarte'],
      cat:MATER, factura:true, nroFac:'DEC-310699', iva:36962 });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — Transferencia banco', valor:28000, metodo:'bancolombia',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_giovanny',
      concepto:'Giovanny — ARA Tiendas banco', valor:15600, metodo:'bancolombia',
      tercero:T['Giovanny'], cat:GASGIO });
    await mov({ fecha:'2026-06-06', tipo:'egreso', subtipo:'gasto_operativo',
      concepto:'Honorarios Marlon Hernández — banco', valor:120000, metodo:'bancolombia',
      tercero:T['Marlon Hernandez'], cat:HONORAR });
    await mov({ fecha:'2026-06-06', tipo:'ingreso', subtipo:'otro',
      concepto:'Wendy Rueda — Transferencia Nequi', valor:30000, metodo:'bancolombia',
      tercero:T['Wendy Rueda'], cat:OTRO_IN });
    await mov({ fecha:'2026-06-06', tipo:'ingreso', subtipo:'otro',
      concepto:'Ingreso bancario — Intereses ahorros', valor:5, metodo:'bancolombia',
      cat:OTRO_IN });

    // ── 5. NÓMINA ─────────────────────────────────────────────────────────────
    let periodoId;
    const existePeriodo = await db.query(
      "SELECT id FROM nomina_periodos WHERE periodo = '2026-06-S1' LIMIT 1"
    );
    if (existePeriodo.rows.length) {
      periodoId = existePeriodo.rows[0].id;
    } else {
      const rp = await db.query(
        `INSERT INTO nomina_periodos (periodo, fecha_inicio, fecha_fin)
         VALUES ('2026-06-S1', '2026-06-01', '2026-06-06') RETURNING id`
      );
      periodoId = rp.rows[0].id;
    }

    const nominaDetalle = [
      { emp:'Franklin',  base:300000, prestamos:95000,  neto:205000 },
      { emp:'Alejandro', base:200000, prestamos:0,      neto:200000 },
      { emp:'Wilson',    base:400000, prestamos:0,      neto:400000 },
    ];
    for (const n of nominaDetalle) {
      const existe = await db.query(
        'SELECT id FROM nomina_detalle WHERE periodo_id=$1 AND empleado_id=$2',
        [periodoId, T[n.emp]]
      );
      if (!existe.rows.length) {
        await db.query(
          `INSERT INTO nomina_detalle
             (periodo_id, empleado_id, salario_base, prestamos, neto_pagado, metodo_pago)
           VALUES ($1, $2, $3, $4, $5, 'efectivo')`,
          [periodoId, T[n.emp], n.base, n.prestamos, n.neto]
        );
      }
    }

    // ── 6. FACTURAS DIAN ─────────────────────────────────────────────────────
    const facturas = [
      // fecha, numero, proveedor_key, bruto, iva, tipo_nota
      ['2026-06-06','C00711769','MADEFRONT COLOMBIA SAS',  1705190, 272257, 'Nota Crédito — posible devolución o corrección de FE-183103'],
      ['2026-06-06','DEC-310699','DECOTRIPLEX S.A.S.',       231500,  36962, 'Contado'],
      ['2026-06-06','FE-183167','MADEFRONT COLOMBIA SAS',    876500, 139945, 'Crédito'],
      ['2026-06-05','FE-183103','MADEFRONT COLOMBIA SAS',  1705190, 272257, 'Crédito — pago parcial $576,500 registrado'],
      ['2026-06-05','GMFE-195833','GRUPO MONDRAGON',         125800,  20086, 'Contado'],
      ['2026-06-05','DHSE-6171','CARMEN LUCIA VEGA MENDEZ',  14000,      0, 'Contado'],
      ['2026-06-04','GMFE-195602','GRUPO MONDRAGON',         127600,  20373, 'Contado'],
      ['2026-06-03','FE-182866','MADEFRONT COLOMBIA SAS',       800,    128, 'Contado'],
      ['2026-06-03','DHSE-6150','CARMEN LUCIA VEGA MENDEZ', 178500,      0, 'Contado'],
      ['2026-06-01','KCG-27071','KEVIN ANDRES CACERES GARCIA',8500,   1357, 'Contado'],
      ['2026-06-01','DHSE-6131','CARMEN LUCIA VEGA MENDEZ',  50000,      0, 'Contado'],
      ['2026-06-01','FE-182508','MADEFRONT COLOMBIA SAS',   393690,  62858, 'Crédito'],
      ['2026-06-01','DHSE-6128','CARMEN LUCIA VEGA MENDEZ',  41000,      0, 'Contado'],
    ];

    for (const [fecha, numero, provKey, bruto, iva, notas] of facturas) {
      const existe = await db.query(
        'SELECT id FROM facturas_dian WHERE numero_factura = $1 LIMIT 1', [numero]
      );
      if (!existe.rows.length) {
        const neto = bruto - iva;
        await db.query(
          `INSERT INTO facturas_dian
             (numero_factura, proveedor_id, fecha, valor_bruto, iva, retencion, valor_neto, notas)
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
          [numero, T[provKey], fecha, bruto, iva, neto, notas]
        );
      }
    }

    // ── RESUMEN ───────────────────────────────────────────────────────────────
    const total = await db.query(
      "SELECT COUNT(*) FROM movimientos WHERE TO_CHAR(fecha,'YYYY-MM')='2026-06'"
    );
    const totFact = await db.query(
      "SELECT COUNT(*) FROM facturas_dian WHERE TO_CHAR(fecha,'YYYY-MM')='2026-06'"
    );

    res.json({
      ok: true,
      movimientos_junio: parseInt(total.rows[0].count),
      facturas_dian:     parseInt(totFact.rows[0].count),
      proyectos: Object.keys(P).length,
      terceros:  Object.keys(T).length,
      msg: '✅ Datos de Junio 2026 cargados correctamente'
    });

  } catch (e) {
    console.error('Seed error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
