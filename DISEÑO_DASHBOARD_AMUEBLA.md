# Documento de Diseño — Dashboard Financiero
## Amuebla Tu Hogar · Análisis de Ingresos y Gastos

> **Propósito de este documento:** Traspasar a un nuevo chat de Claude toda la información necesaria para continuar el desarrollo del sitio web financiero del taller de muebles "Amuebla Tu Hogar", manteniendo coherencia visual, estructura de datos y estilo de trabajo.

---

## 1. Contexto del proyecto

| Campo | Detalle |
|---|---|
| **Empresa** | Amuebla Tu Hogar (taller de tapicería y muebles) |
| **Propietaria** | Yeritte Maibeline Melo Sandoval |
| **NIT** | 37290459 |
| **Tipo de archivo** | HTML single-file, sin frameworks, sin backend |
| **Hospedaje** | GitHub Pages (repositorio del usuario) |
| **Períodos cubiertos** | Trimestre Mar–May 2025 · Junio 2026 (en curso) |
| **Fuentes de datos** | Archivos Excel (.xlsx) subidos manualmente en cada actualización |

---

## 2. Stack tecnológico

```
HTML5 + CSS3 vanilla (sin frameworks)
Chart.js 4.4.1  →  cdnjs.cloudflare.com
Google Fonts    →  DM Sans (cuerpo) + DM Mono (números)
Sin dependencias adicionales. Todo en un único archivo .html.
```

---

## 3. Sistema de diseño (Design System)

### 3.1 Paleta de colores (CSS Custom Properties)

```css
:root {
  /* Fondos */
  --bg:      #f7f5f0;   /* fondo general (crema cálido) */
  --bg2:     #edeae3;   /* fondo secundario / hover */
  --white:   #ffffff;   /* cards y superficies */

  /* Tipografía */
  --text:    #1c1a18;   /* texto principal */
  --text2:   #6b6860;   /* texto secundario */
  --text3:   #a09e9a;   /* labels y placeholders */

  /* Semántica financiera */
  --green:       #1a6b47;   --green-bg:    #e8f5ee;   --green-light: #d1edd9;
  --red:         #b83232;   --red-bg:      #fdf0f0;   --red-light:   #f9d5d5;
  --amber:       #a05c10;   --amber-bg:    #fef8ec;   --amber-light: #fde8c0;
  --blue:        #1a4fa0;   --blue-bg:     #eef4ff;   --blue-light:  #ccddf9;
  --purple:      #6635b8;   --purple-bg:   #f4eeff;   --purple-light:#dccffa;

  /* Estructura */
  --border:  rgba(0,0,0,0.07);
  --shadow:  0 1px 8px rgba(0,0,0,0.08);
  --r:       14px;    /* border-radius cards */
  --r-sm:    8px;     /* border-radius elementos pequeños */
}
```

**Uso semántico de colores:**
- 🟢 `--green` → Ingresos, utilidades positivas, proyectos rentables
- 🔴 `--red` → Egresos, pérdidas, alertas críticas
- 🟡 `--amber` → Advertencias, cartera pendiente, datos actualizados
- 🔵 `--blue` → Información, facturas DIAN, notas contables
- 🟣 `--purple` → Exclusivo para la sección de Giovanny (cuenta por cobrar especial)
- ⬛ `--text` (negro oscuro) → Header, botones activos, secciones principales

### 3.2 Tipografía

```css
font-family: 'DM Sans', sans-serif;     /* Todo el cuerpo */
font-family: 'DM Mono', monospace;      /* Valores monetarios, números */
```

| Elemento | Tamaño | Peso |
|---|---|---|
| Título header | 19–20px | 500 |
| Títulos de card | 13px | 600 + uppercase |
| Section label | 11px | 600 + uppercase + letter-spacing 0.07em |
| Valor métrico principal | 25–28px | 500 (DM Mono) |
| Texto tabla | 13px | 400 |
| Subtexto / labels | 11–12px | 400–500 |

### 3.3 Componentes reutilizables

#### Header global
```html
<div class="header">
  <div>
    <h1>[Título del período]</h1>
    <p>[Subtítulo con rango de fechas y fuentes]</p>
  </div>
  <span class="badge-new">EN CURSO</span>
</div>
```
- Fondo: `--text` (#1c1a18)
- Texto principal: blanco
- Subtítulo: `rgba(255,255,255,0.5)`

#### Barra de navegación (tabs tipo pill)
```html
<nav class="nav">
  <button class="nav-btn active" onclick="show('resumen',this)">📊 Resumen</button>
  <!-- más botones -->
</nav>
```
- Fondo nav: blanco, border-bottom 1px
- Botón normal: borde gris, fondo transparente
- Botón `.active`: fondo `--text`, texto blanco
- Hover: fondo `--bg2`
- Forma: `border-radius: 100px` (pill)

#### Tarjetas de métricas
```html
<div class="metrics"> <!-- CSS Grid auto-fit minmax(165px,1fr) -->
  <div class="metric">
    <div class="lbl">ETIQUETA</div>
    <div class="val val-green">$5.78M</div>
    <div class="sub">Descripción corta</div>
  </div>
</div>
```
Clases de color para `.val`: `val-green`, `val-red`, `val-amber`, `val-blue`, `val-purple`

#### Cards con título
```html
<div class="card">
  <div class="card-title">📊 Título de la sección</div>
  <!-- contenido -->
</div>
```

#### Tablas de datos
```html
<table class="tbl">
  <thead><tr><th>Col</th>...</tr></thead>
  <tbody>
    <tr>
      <td>Texto</td>
      <td class="mono pos">$1,200,000</td>  <!-- verde -->
      <td class="mono neg">($800,000)</td>   <!-- rojo -->
      <td class="mono amberx">$400,000</td>  <!-- ámbar -->
    </tr>
  </tbody>
</table>
```

#### Barras de progreso inline
```html
<div class="bar-row">
  <div class="bar-lbl">Etiqueta</div>
  <div class="bar-track">
    <div class="bar-fill" style="width:65%;background:#1a6b47"></div>
  </div>
  <div class="bar-val">$1,200,000</div>
</div>
```

#### Alertas / Callouts
```html
<div class="alert alert-g"> <!-- alert-r | alert-a | alert-b | alert-p -->
  <div class="alert-icon">✅</div>
  <div class="alert-text">
    <strong>Título del alerta</strong>
    Descripción del hallazgo contable.
  </div>
</div>
```

#### Badges inline
```html
<span class="badge b-green">Aprobado</span>
<span class="badge b-red">Crítico</span>
<span class="badge b-amber">Pendiente</span>
<span class="badge b-purple">Giovanny</span>
```

#### Grid de 2 columnas
```html
<div class="grid2"> <!-- se apila en móvil -->
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

### 3.4 Marcadores visuales de actualización

Cuando un elemento contiene datos nuevos respecto a la versión anterior:
```css
.new-day / .new-gio {
  border-color: var(--amber);
  border-width: 2px;
  position: relative;
}
/* ::after con badge "NUEVO" en amber */
```

---

## 4. Arquitectura de navegación

El sitio es un **SPA de una sola página** con JavaScript puro. Cada "pantalla" es un `<div class="page">` que se muestra/oculta con:

```javascript
function show(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  btn.classList.add('active');
}
```

### Secciones actuales del dashboard de Junio 2026

| ID | Emoji | Nombre | Contenido |
|---|---|---|---|
| `resumen` | 📊 | Resumen | Métricas globales, gráficos principales, alertas |
| `diario` | 📅 | Día a día | Grid de días + tablas detalladas de transacciones |
| `giovanny` | 👤 | Giovanny | Sección exclusiva con análisis de cuenta por cobrar |
| `cartera` | 💼 | Cartera | Proyectos, cuentas por cobrar y por pagar |
| `nomina` | 👥 | Nómina | Tabla semanal de empleados y préstamos |
| `dian` | 🧾 | Facturas DIAN | Registro de facturas electrónicas recibidas |
| `proyectos` | 🏗️ | Proyectos | Rentabilidad por proyecto (Keidy, Oswaldo, Marcela) |

---

## 5. Gráficos (Chart.js)

Todos los gráficos usan:
```javascript
const gc = 'rgba(0,0,0,0.06)';  // color de gridlines
const tc = '#6b6860';            // color de tick labels
```

### Gráficos presentes en Junio 2026

| ID canvas | Tipo | Sección | Descripción |
|---|---|---|---|
| `cBarDia` | bar | Resumen | Ingresos vs Egresos por día |
| `cPieEgr` | doughnut | Resumen | Composición de egresos (cutout 58%) |
| `cLinea` | line | Resumen | Tendencia acumulada (fill: true) |
| `cGioBar` | bar (apilado) | Giovanny | Gastos Giovanny por día: caja vs banco |
| `cGioPie` | doughnut | Giovanny | Caja vs Nequi/Banco (cutout 60%) |
| `cProyectos` | bar | Proyectos | Abono recibido / Saldo / Costo por proyecto |

### Patrón de construcción de gráficos
```javascript
new Chart(document.getElementById('id'), {
  type: 'bar',
  data: {
    labels: [...],
    datasets: [{
      label: '...',
      data: [...],
      backgroundColor: '#1a6b47',
      borderRadius: 5,
      borderSkipped: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: tc }, grid: { color: gc } },
      y: { ticks: { color: tc, callback: v => '$'+(v/1000).toFixed(0)+'K' }, grid: { color: gc } }
    }
  }
});
```

---

## 6. Estructura de datos — Junio 2026

### 6.1 Fuentes de datos (hojas del Excel)

| Hoja Excel | Contenido | Uso en dashboard |
|---|---|---|
| `CAJA JUNIO` | Transacciones diarias en efectivo | Sección Día a Día + Resumen |
| `BANCOS INGRESOS` | Transferencias y abonos Bancolombia | Resumen + Día a Día |
| `BANCOS SALIDA` | Egresos Bancolombia/Nequi | Resumen + Giovanny + Día a Día |
| `DIAN` | Facturas electrónicas recibidas | Sección DIAN |
| `CUENTA POR COBRAR` | Cartera clientes, pollos, por pagar | Sección Cartera |
| `PROYECTOS` | Detalle de proyectos activos | Sección Proyectos |
| `NOMINA` | Empleados, sueldos, préstamos | Sección Nómina |

### 6.2 Cifras consolidadas — al 06 de junio 2026

```
INGRESOS TOTALES:     $5,777,519  (caja $3,647,500 + bancos $2,130,019)
EGRESOS TOTALES:      $5,170,713  (caja $2,389,000 + bancos $2,781,713)
SALDO NETO:             $606,806
DISPONIBLE CAJA:      $1,258,500  (saldo al cierre día 06)

CUENTA GIOVANNY:        $421,600  (caja $181,000 + banco $240,600)
NÓMINA SEMANA:          $805,000  (3 empleados)
HONORARIOS MARLON:      $200,000  (caja $80K + banco $120K)
CARTERA CLIENTES:     $8,364,190  (4 proyectos + finalizados)
CUENTAS POR PAGAR:    $2,259,000  (Magaly + Herrajes Sebastián)
```

### 6.3 Ingresos por día (caja efectivo)

| Día | Ingreso caja | Egreso caja | Nota |
|---|---|---|---|
| 01/06 | $112,000 | $77,000 | Préstamo recibido |
| 02/06 | $0 | $24,000 | Solo Giovanny |
| 03/06 | $124,000 | $114,000 | Pollos + Heidy Navas |
| 04/06 | $2,806,500 | $864,600 | ⭐ Ingreso Claudia $2.8M |
| 05/06 | $0 | $65,100 | Solo gastos |
| 06/06 | $605,000 | $1,244,300 | Oswaldo $600K / Nómina |

### 6.4 Cuenta por cobrar Giovanny — desglose diario

| Día | Caja | Banco/Nequi | Total día |
|---|---|---|---|
| 01/06 | $52,000 | $52,700 | $104,700 |
| 02/06 | $24,000 | $23,400 | $47,400 |
| 03/06 | $40,000 | $43,300 | $83,300 |
| 04/06 | $14,000 | $27,900 | $41,900 |
| 05/06 | $51,000 | $49,700 | $100,700 |
| 06/06 | $0 | $43,600 | $43,600 |
| **TOTAL** | **$181,000** | **$240,600** | **$421,600** |

### 6.5 Proyectos activos

| Proyecto | Valor total | Abono | Saldo | Costo | Utilidad proy. |
|---|---|---|---|---|---|
| Keidy Nicolay | $580,000 | $300,000 | $280,000 | $393,690 | $186,310 |
| Oswaldo Duarte | $3,200,000 | $1,600,000 | $1,600,000 | $231,500 | $2,968,500 |
| Marcela | $4,200,000 | $2,100,000 | $2,100,000 | $738,300 | $3,461,700 |

---

## 7. Historial de versiones del dashboard

### v1 — Trimestre Mar–May 2025
**Archivo:** `ANALISIS_MUEBLA_TRIMESTRE.html`
- Sidebar de navegación fija (230px)
- 7 secciones: Resumen, Mensual, Costos, Ingresos, Cartera, Transacciones, Alertas
- Tabla de transacciones filtrable y paginada (15 registros/página)
- Datos: 6 tiendas (uso interno) → adaptado al taller

### v2 — Junio 2026 (primeros 5 días)
**Archivo:** `junio2026_01-06.html` (archivo original subido)
- Navegación tipo top-bar (pills)
- 6 secciones: Resumen, Día a día, Giovanny, Cartera, Nómina, DIAN
- Grid de días con 5 columnas
- Sección Giovanny con identidad visual propia (purple)

### v3 — Junio 2026 actualizado (6 días)
**Archivo:** `junio2026_actualizado.html` (versión más reciente)
- Mismo diseño v2 + día 06 añadido
- Nueva sección: **Proyectos** (7 secciones en total)
- Grid de días: 6 columnas
- Gráfico Giovanny convertido a barras apiladas (caja vs banco)
- Badge "⟳ ACTUALIZADO 06/Jun" en el header
- Badges "NUEVO" en amarillo sobre elementos del día 06
- Cartera actualizada con proyecto Marcela

---

## 8. Convenciones de desarrollo

### Flujo de trabajo con Claude
1. El usuario sube el archivo Excel actualizado
2. Claude lee todas las hojas con `pandas`
3. Se calculan los totales y subtotales en Python
4. Se genera o actualiza el HTML con los datos hardcodeados como literales
5. Los gráficos usan arrays JavaScript con los valores calculados
6. El archivo se entrega como descarga desde `/mnt/user-data/outputs/`

### Reglas de estilo de código
- **Un solo archivo HTML** — CSS y JS inline, sin archivos externos salvo CDN
- **Sin frameworks JS** (no React, no Vue, no jQuery)
- **Chart.js desde CDN** — `cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`
- **Fuentes desde Google Fonts** — `DM Sans` + `DM Mono`
- Valores monetarios siempre con `font-family: 'DM Mono'`
- Valores negativos mostrados con texto rojo (`var(--red)`), NO con paréntesis ni signo `-`
- Formato de números: `$X,XXX,XXX` en COP (pesos colombianos)
- Abreviatura: `M` = millones, `K` = miles (en gráficos y métricas)

### Convención de elementos nuevos
Cuando se actualiza el archivo con datos de un nuevo período:
- Tarjetas nuevas llevan clase `new-day` o `new-gio`
- El header lleva badge naranja `⟳ ACTUALIZADO [fecha]`
- Filas nuevas en tablas llevan `style="background:var(--amber-bg)"`

---

## 9. Publicación en GitHub Pages

```
Repositorio:   github.com/[usuario]/[repositorio]
URL base:      https://[usuario].github.io/[repositorio]/

Archivos publicados:
  index.html                          → Dashboard trimestre Mar–May 2025
  junio2026_actualizado.html          → Dashboard Junio 2026
  examen_auxiliar_contable.html       → Evaluación estudiantes (uso docente)
```

**Regla:** El archivo raíz del repositorio debe llamarse `index.html` para funcionar en la URL base. Los demás archivos se acceden por nombre directo.

---

## 10. Próximas actualizaciones esperadas

Al recibir un nuevo Excel de Junio 2026, Claude debe:

1. Leer todas las hojas del Excel con pandas
2. Identificar los nuevos días registrados (comparar con el último día conocido: **06/06/2026**)
3. Actualizar las siguientes secciones:
   - **Resumen:** métricas globales y 3 gráficos
   - **Día a día:** agregar nuevas tarjetas de día con clase `new-day`
   - **Giovanny:** actualizar total, tabla completa y gráficos
   - **Cartera:** actualizar saldos de proyectos si hay nuevos abonos
   - **Nómina:** si hay nueva semana de pago
   - **DIAN:** añadir nuevas facturas electrónicas
   - **Proyectos:** actualizar costos acumulados por proyecto
4. Cambiar el badge del header a `⟳ ACTUALIZADO [último día]`
5. Entregar el archivo con nombre `junio2026_actualizado.html`

---

## 11. Alertas contables recurrentes a mantener

Estas alertas deben revisarse y actualizarse en cada versión:

| # | Tipo | Alerta | Estado actual |
|---|---|---|---|
| 1 | 🟣 Purple | Proyección mensual Giovanny | ~$2.1M/mes al ritmo actual |
| 2 | 🟡 Amber | Gastos personales en cuentas empresariales | Pendiente separar |
| 3 | 🔵 Blue | Nota crédito Madefront $1.7M del 06/06 | Verificar si es corrección |
| 4 | 🟡 Amber | Gastos fijos sin registrar | Agua, celular, gas, internet, arriendo |
| 5 | 🔴 Red | Cartera total $8.36M sin cobrar | Oswaldo + Marcela concentran $3.7M |

---

*Documento generado por Claude · Conversación Marlon Hernández · Junio 2026*
