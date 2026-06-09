-- ============================================================
-- AMUEBLA TU HOGAR · Esquema PostgreSQL
-- ============================================================

-- Terceros: clientes, proveedores, empleados, socios
CREATE TABLE IF NOT EXISTS terceros (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  tipo       VARCHAR(20)  NOT NULL CHECK (tipo IN ('cliente','proveedor','empleado','socio')),
  documento  VARCHAR(20),
  telefono   VARCHAR(20),
  email      VARCHAR(100),
  notas      TEXT,
  activo     BOOLEAN DEFAULT true,
  creado_en  TIMESTAMP DEFAULT NOW()
);

-- Categorías de ingresos y egresos
CREATE TABLE IF NOT EXISTS categorias (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL,
  tipo    VARCHAR(10)  NOT NULL CHECK (tipo IN ('ingreso','egreso','ambos')),
  color   VARCHAR(20)  DEFAULT '#6b6860',
  icono   VARCHAR(10)  DEFAULT '📌'
);

-- Proyectos (muebles por cliente)
CREATE TABLE IF NOT EXISTS proyectos (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  cliente_id   INT REFERENCES terceros(id),
  valor_total  NUMERIC(14,2) DEFAULT 0,
  estado       VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo','finalizado','pausado','eliminado')),
  fecha_inicio DATE,
  fecha_fin    DATE,
  notas        TEXT,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- Movimientos: tabla central de toda la contabilidad
CREATE TABLE IF NOT EXISTS movimientos (
  id             SERIAL PRIMARY KEY,
  fecha          DATE NOT NULL,
  tipo           VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso','egreso','traslado')),
  subtipo        VARCHAR(30) NOT NULL CHECK (subtipo IN (
                   'venta',
                   'abono_proyecto',
                   'pago_proveedor',
                   'costo_proyecto',
                   'gasto_proyecto',
                   'gasto_operativo',
                   'gasto_giovanny',
                   'nomina',
                   'prestamo',
                   'traslado_caja_banco',
                   'otro'
                 )),
  concepto       VARCHAR(250) NOT NULL,
  valor          NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
  metodo_pago    VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo','bancolombia','nequi','otro_banco')),
  tercero_id     INT REFERENCES terceros(id),
  proyecto_id    INT REFERENCES proyectos(id),
  categoria_id   INT REFERENCES categorias(id),
  tiene_factura  BOOLEAN DEFAULT false,
  numero_factura VARCHAR(50),
  iva            NUMERIC(14,2) DEFAULT 0,
  retencion      NUMERIC(14,2) DEFAULT 0,
  notas          TEXT,
  creado_en      TIMESTAMP DEFAULT NOW()
);

-- Períodos de nómina (semanas o quincenas)
CREATE TABLE IF NOT EXISTS nomina_periodos (
  id           SERIAL PRIMARY KEY,
  periodo      VARCHAR(20) NOT NULL,   -- ej: '2026-06-S1'
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- Detalle de nómina por empleado
CREATE TABLE IF NOT EXISTS nomina_detalle (
  id                 SERIAL PRIMARY KEY,
  periodo_id         INT NOT NULL REFERENCES nomina_periodos(id) ON DELETE CASCADE,
  empleado_id        INT NOT NULL REFERENCES terceros(id),
  salario_base       NUMERIC(14,2) NOT NULL,
  prestamos          NUMERIC(14,2) DEFAULT 0,
  otras_deducciones  NUMERIC(14,2) DEFAULT 0,
  neto_pagado        NUMERIC(14,2) NOT NULL,
  metodo_pago        VARCHAR(20) DEFAULT 'efectivo'
);

-- Facturas DIAN (electrónicas recibidas)
CREATE TABLE IF NOT EXISTS facturas_dian (
  id              SERIAL PRIMARY KEY,
  numero_factura  VARCHAR(50) NOT NULL,
  proveedor_id    INT REFERENCES terceros(id),
  fecha           DATE NOT NULL,
  valor_bruto     NUMERIC(14,2) NOT NULL,
  iva             NUMERIC(14,2) DEFAULT 0,
  retencion       NUMERIC(14,2) DEFAULT 0,
  valor_neto      NUMERIC(14,2) NOT NULL,
  movimiento_id   INT REFERENCES movimientos(id),
  notas           TEXT,
  creado_en       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES — Categorías base
-- ============================================================
INSERT INTO categorias (nombre, tipo, color, icono) VALUES
  ('Ventas / Cobro proyecto',        'ingreso', '#1a6b47', '💰'),
  ('Préstamo recibido',              'ingreso', '#1a4fa0', '🏦'),
  ('Transferencia bancaria recibida','ingreso', '#1a4fa0', '🏦'),
  ('Otro ingreso',                   'ingreso', '#6b6860', '📥'),
  ('Materia prima / Materiales',     'egreso',  '#b83232', '🪵'),
  ('Herrajes y accesorios',          'egreso',  '#b83232', '🔩'),
  ('Transporte / Flete',             'egreso',  '#a05c10', '🚚'),
  ('Nómina empleados',               'egreso',  '#a05c10', '👷'),
  ('Honorarios Marlon',              'egreso',  '#6635b8', '📋'),
  ('Servicios públicos',             'egreso',  '#a05c10', '💡'),
  ('Arriendo taller',                'egreso',  '#a05c10', '🏭'),
  ('Gastos Giovanny',                'egreso',  '#6635b8', '👤'),
  ('Pago a proveedor',               'egreso',  '#b83232', '🧾'),
  ('Gastos varios / Operativos',     'egreso',  '#6b6860', '📌'),
  ('Pollos / Alimentación',          'egreso',  '#a05c10', '🍗')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÍNDICES para consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mov_fecha       ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_mov_subtipo     ON movimientos(subtipo);
CREATE INDEX IF NOT EXISTS idx_mov_proyecto    ON movimientos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_mov_tercero     ON movimientos(tercero_id);
CREATE INDEX IF NOT EXISTS idx_mov_mes         ON movimientos(TO_CHAR(fecha, 'YYYY-MM'));
