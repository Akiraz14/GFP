# Mejora del módulo de recomendaciones (HU10)

**Fecha:** 2026-11-07  
**Base:** `main` en `1d1925f`, encima de los ajustes AJ-01 a AJ-05 sin confirmar (sin commits,
sin push).  
**Fuente:** documento del responsable «Mejora del módulo de recomendaciones financieras –
Implementación final» (decisiones de negocio aprobadas).  
**Estado:** finalizado. Verificado con Jest y aprobado por el responsable con las pruebas
manuales REC-V1 a REC-V12 en Android 10 (2026-11-07). Cierre en `cierre-proyecto.md`.

## 1. Íconos y colores

Los emojis de las tarjetas (🔺 ⚠️ ℹ️) se sustituyen por íconos de `Icon.tsx` (E-COR-D4). El color de
cada regla se aplica al ícono y al borde izquierdo de la tarjeta (`RULE_APPEARANCE` en
`RecommendationsScreen.tsx`). Los íconos nuevos (`activity`, `award`, `clock`, `flame` y
`lightbulb`) se dibujan con `react-native-svg` sobre la geometría de Lucide (licencia ISC), sin
dependencias nuevas.

| Regla | Id de la tarjeta | Ícono | Color | Severidad |
|---|---|---|---|---|
| R1 Balance Negativo | `negative-balance` | `activity` | `#B3261E` | crítica |
| R2 Categoría Crítica | `critical-category-<categoría>` | `flame` | `#B3261E` | crítica |
| R3 ¡Alerta de Gastos Altos! | `unusual-increase-<categoría>` | `trendingUp` | `#B3261E` | crítica |
| R4 Gasto reducido | `spending-reduced` | `trendingDown` | `#1B6E3A` | informativa |
| R5 Hábito estable | `stable-habit` | `award` | `#1B6E3A` | informativa |
| R6 Alerta temprana de gasto | `early-spending-alert` | `clock` | `#E08A1E` | advertencia |
| R7 Ingresos menores que el mes anterior | `lower-income` | `arrowDownLeft` | `#E08A1E` | advertencia |
| R8 Sin ingresos registrados | `no-income` | `info` | `#E08A1E` | advertencia |
| Consejo de Ahorro | `savings-tip` | `lightbulb` | `#1B6E3A` | informativa |

## 2. Reglas y condiciones

Los umbrales se comparan con aritmética entera sobre centavos (sin divisiones), así que no hay
división por cero ni errores de redondeo en los límites.

| Regla | Período | Condición | Acción del historial |
|---|---|---|---|
| R1 | Mes actual | Hay ingresos y gastos ≥ ingresos | Ingresos y gastos del mes |
| R2 | Mes actual | Sin cambios: una categoría > 50 % de los gastos | Gastos de la categoría en el mes |
| R3 | Mes actual frente al mes anterior completo | Sin cambios: gasto de la categoría > 130 % del mes anterior | Gastos de la categoría en el mes |
| R4 | Períodos equivalentes | Gasto anterior > 0 y reducción > 30 %; el período actual debe tener algún gasto | Gastos de la categoría destacada; «Ver otras categorías (n)» |
| R5 | Períodos equivalentes | Gasto > 0 en los dos períodos y variación ≤ 10 % | Gastos de la categoría destacada; «Ver otras categorías (n)» |
| R6 | Mes actual | Ingresos > 0 y 80 % ≤ gastos / ingresos < 100 % | Gastos del mes |
| R7 | Períodos equivalentes | Ingresos anteriores > 0 y disminución > 20 % | «Ver ingresos de este mes» y «Ver ingresos del mes anterior» |
| R8 | Mes actual | Ingresos = 0 y gastos > 0 | Ingresos y gastos del mes |
| Consejo de Ahorro | Mes actual | Ingresos > 0, balance > 0 y no aplica R6 (gastos < 80 % de los ingresos) | Ingresos y gastos del mes |

**Períodos equivalentes** (`comparablePeriods` en `financialAnalysis.ts`, junto a `monthRange`):
del día 1 a hoy en el mes actual, y del día 1 al mismo día en el mes anterior, o a su último día si
ese mes es más corto. Ejemplos: el 10 de noviembre se compara con el 1–10 de octubre; el 31 de
diciembre, con el 1–30 de noviembre; el 31 de marzo de 2026, con el 1–28 de febrero; y el 31 de
marzo de 2028, con el 1–29 de febrero. La fuente de la tarjeta lo indica («Días 1 al 4 de cada mes»
o «Días 1 al 31 (mes anterior: 1 al 30)»).

**Varias categorías** (R4, R5): una sola tarjeta por regla. R4 destaca la mayor reducción
porcentual y R5 la menor variación; en caso de empate, la de mayor monto. Las demás aparecen al
pulsar «Ver otras categorías (n)», cada una con su porcentaje, y abren el historial filtrado por
esa categoría. No hay pantallas nuevas: todas las acciones usan el historial y sus filtros.

## 3. Prioridad y convivencia

| Situación | Resultado |
|---|---|
| Sin ingresos y con gastos | R8; no R1 (R1 exige ingresos) |
| Gastos ≥ ingresos | R1; no R6 ni Consejo de Ahorro |
| 80 % ≤ gastos < 100 % de los ingresos | R6; no Consejo de Ahorro |
| Balance positivo y gastos < 80 % de los ingresos | Consejo de Ahorro |
| R4 y R5 | Pueden mostrarse juntas |
| R7 y R1 | Pueden mostrarse juntas |
| R2, R3 y las demás | Sin exclusiones nuevas |

El descarte por sesión de AJ-05 se aplica igual a todas las reglas, nuevas y existentes.

## 4. Criterios de implementación

Son interpretaciones mínimas de puntos que el documento no detalla. No cambian ninguna regla
aprobada. El responsable las aceptó al aprobar las pruebas REC-V1 a REC-V12 (2026-11-07).

| ID | Punto | Criterio aplicado |
|---|---|---|
| E-REC-C1 | R3: el documento pide no alterar su umbral ni su comportamiento, y también comparar períodos equivalentes en las reglas entre meses | Prevalece la indicación específica de R3: sigue comparando el mes actual con el anterior completo. R3 y R4 no pueden contradecirse: si el gasto actual supera el 130 % del mes anterior completo, también supera el del período equivalente |
| E-REC-C2 | R4 cuando una categoría no tiene gastos en el período actual | Cuenta como una reducción del 100 % solo si el período actual ya tiene algún gasto. Sin ningún gasto en el período actual no hay información suficiente y no se compara, para no anunciar reducciones el primer día del mes |
| E-REC-C3 | Porcentajes de las reglas nuevas | Se muestran con un decimal, redondeados hacia el lado del umbral que cumple la regla. Así, una reducción de 30,01 % aparece como «30,1%» y no como «30%». R2 y R3 conservan sus enteros |
| E-REC-C4 | R1 con gastos iguales a los ingresos | La descripción dice «igualan» en lugar de «superan», para no afirmar algo que los datos no respaldan |
| E-REC-C5 | R7 con ingresos actuales en cero | Se activa (disminución del 100 %) y puede convivir con R8, que informa de otra cosa (gastos sin ingresos) |
| E-REC-C6 | Rango del historial de R4, R5 y R7 | El período equivalente actual (día 1 a hoy); R7 añade un segundo botón con el período equivalente anterior |

## 5. Pruebas automatizadas

| Ámbito | Archivo | Casos |
|---|---|---|
| Períodos equivalentes | `financialAnalysis.test.ts` «HU10 equivalent periods» | Mismo día, meses de 30 y 31 días, febrero normal y bisiesto, 29 de febrero, cambio de año |
| R4 a R8, prioridades y períodos | `recommendations.test.ts` «extended recommendation rules» | Los límites del documento (29/30/>30 %, 9/10/>10 %, 79/80/99/100 %, 19/20/>20 %), sin datos anteriores, varias categorías, las seis reglas de convivencia, días posteriores del mes anterior excluidos, 31 frente a 30, febrero de 2026 y 2028, enero frente a diciembre |
| Reglas existentes | `recommendations.test.ts` «HU10 rules» | R1 ahora en rojo y con gastos iguales a los ingresos; R2, R3 y el consejo sin cambios |
| Pantalla | `AnalysisAndRecommendations.test.tsx` «Extended recommendations on the screen» | Ícono y color de trazo y de borde de las nueve tarjetas, sin emojis, filtros de cada acción, los dos botones de R7, lista desplegable de otras categorías y descarte de una regla nueva |
| Servicio | `recommendationService.test.ts`, `App.test.tsx` | Con solo gastos la tarjeta es ahora `no-income` (R8) en lugar de `negative-balance` |

## 6. Validación manual (Android 10, AVD `Pixel_4_Android_10`)

Pruebas manuales ejecutadas por el responsable (usuario) en el emulador Pixel 4 con Android 10,
con el APK Debug del 2026-11-07 (`1d1925f` con estos cambios sin confirmar, SHA-256
`1592C4151B479B0BBA2E363E201EDA8C27E46EAC7E9821CD7ABC6EA1F78D9795`). Claude no ejecutó estas
pruebas: registra la aprobación del responsable y organiza sus capturas.

Las fechas de los datos son relativas al día de la prueba: D es el día del mes de hoy y «del mes
anterior» significa con fecha del día 1 al día D del mes pasado. Cada bloque que dice «usuario
nuevo» empieza con una cuenta sin movimientos (o tras borrar los anteriores).

| Paso | Datos | Resultado esperado | Resultado | Tipo | Responsable | Fecha |
|---|---|---|---|---|---|---|
| REC-V1 | Usuario nuevo, solo un gasto de 100.000 hoy | «Sin ingresos registrados», ícono `info` naranja; no aparece «Regla de Balance Negativo». «Ver movimientos asociados» abre el historial del mes | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V2 | Añadir un ingreso de 100.000 hoy | «Regla de Balance Negativo» con ícono `activity` rojo y «igualan»; sin alerta temprana ni consejo | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V3 | Cambiar el ingreso a 120.000 (gastos ≈ 83 %) | «Alerta temprana de gasto», `clock` naranja, «consumen el 83,3%»; sin «Consejo de Ahorro» | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V4 | Cambiar el ingreso a 200.000 (50 %) | «Consejo de Ahorro», `lightbulb` verde; sin alerta temprana | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V5 | Con REC-V4, ver «Categoría Crítica» de la categoría del gasto | `flame` rojo | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V6 | Usuario nuevo con un ingreso de 1.000.000 hoy. Gastos del mes anterior: Alimentación 100.000, Transporte 100.000, Vivienda 100.000. Gastos de hoy: Alimentación 60.000, Transporte 20.000, Vivienda 102.000 | Una sola tarjeta «Gasto reducido» (`trendingDown` verde) con Transporte, «bajaron un 80%»; «Ver otras categorías (1)» muestra Alimentación «bajó 40%» y abre su historial. «Hábito estable» (`award` verde) con Vivienda, «variaron un 2%». Las dos conviven | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V7 | Con REC-V6, un gasto de Transporte de 500.000 con fecha posterior al día D del mes pasado (solo si D es menor que el último día de ese mes) | No cambia los porcentajes de REC-V6 | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V8 | Usuario nuevo: ingreso del mes anterior de 100.000 e ingreso de hoy de 70.000 | «Ingresos menores que el mes anterior», `arrowDownLeft` naranja, «bajaron un 30%»; «Ver ingresos de este mes» y «Ver ingresos del mes anterior» abren el historial con tipo Ingreso y cada período | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V9 | Con REC-V8, un gasto de 80.000 hoy | «Ingresos menores» y «Balance Negativo» a la vez | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V10 | Usuario nuevo con un ingreso de 1.000.000 hoy; gasto de Alimentación del mes anterior de 100.000 y de hoy de 150.000 | «¡Alerta de Gastos Altos!» con `trendingUp` rojo | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V11 | Pulsar la X de una regla nueva, cambiar de pestaña y volver | Sigue oculta en la sesión | APROBADO | Manual | Usuario | 2026-11-07 |
| REC-V12 | `am force-stop`, abrir e iniciar sesión | La tarjeta descartada vuelve si su condición se cumple | APROBADO | Manual | Usuario | 2026-11-07 |

Entorno de todas las pruebas: Android 10 (API 29), emulador Pixel 4 (AVD `Pixel_4_Android_10`).

### Evidencias

Carpeta: `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\recomendaciones\` (33 capturas,
con sus SHA-256 en `SHA256SUMS.txt`). Patrón: `REC-Vn-<escenario>.png` para la captura principal y
`REC-Vn-<escenario>-<detalle>.png` para los pasos y los historiales del mismo escenario. Cada
captura se asoció por su contenido y su hora; no hay capturas sin clasificar ni duplicadas.

| Paso | Capturas |
|---|---|
| REC-V1 | `REC-V1-sin-ingresos-estado-inicial.png` (cuenta sin movimientos: estado vacío), `REC-V1-sin-ingresos.png`, `REC-V1-sin-ingresos-historial.png` |
| REC-V2 | `REC-V2-balance-negativo.png`, `REC-V2-balance-negativo-historial.png` |
| REC-V3 | `REC-V3-alerta-temprana.png`, `REC-V3-alerta-temprana-historial.png` |
| REC-V4 | `REC-V4-consejo.png`, `REC-V4-consejo-historial.png` |
| REC-V5 | `REC-V5-categoria-critica.png` |
| REC-V6 | `REC-V6-reducido-estable.png`, `REC-V6-reducido-estable-otras-categorias.png` (lista desplegada), `REC-V6-reducido-estable-habito.png`, `REC-V6-reducido-estable-historial-transporte.png` y `REC-V6-reducido-estable-historial-vivienda.png` (historial filtrado desde las tarjetas), `REC-V6-reducido-estable-historial-1.png` a `-4.png` (datos cargados) |
| REC-V7 | `REC-V7-periodo-equivalente.png`, `REC-V7-periodo-equivalente-historial.png` (gasto de 500.000 del 16/10/2026) |
| REC-V8 | `REC-V8-ingresos-menores.png`, `REC-V8-ingresos-menores-historial.png` (datos), `REC-V8-ingresos-menores-historial-mes-actual.png` y `REC-V8-ingresos-menores-historial-mes-anterior.png` (los dos botones) |
| REC-V9 | `REC-V9-convivencia.png`, `REC-V9-convivencia-historial.png` |
| REC-V10 | `REC-V10-gastos-altos.png`, `REC-V10-gastos-altos-historial.png` |
| REC-V11 | `REC-V11-descartada.png`, `REC-V11-descartada-otra-pestana.png`, `REC-V11-descartada-volver.png` (difiere de la primera solo en el resaltado del botón X: es el paso de volver, no un duplicado) |
| REC-V12 | `REC-V12-reaparece.png` |

Nombres originales que se cambiaron (contenido intacto): `REC-sin-movimientos-sin-recomendaciones`
→ `REC-V1-sin-ingresos-estado-inicial`; `REC-V4-consejo-ahorro[-historial]` → `REC-V4-consejo[-historial]`;
`REC-V6-gastos-reducidos` → `REC-V6-reducido-estable`, `-1` → `-otras-categorias`, `-2` →
`-historial-transporte`, `-3` → `-habito`, `-4` → `-historial-vivienda`, `-historial`, `-historial-1`,
`-2` y `-3` → `-historial-1` a `-4`; `REC-V7-gastos-reducidos-porcentaje[-historial]` →
`REC-V7-periodo-equivalente[-historial]`; `REC-V8-ingresos-menores-1-mes-actual` y
`-2-mes-anterior` → `-historial-mes-actual` y `-historial-mes-anterior`;
`REC-V9-ingresos-menores[-historial]` → `REC-V9-convivencia[-historial]`;
`REC-V11-tarjeta-oculta`, `-historial` y `-sigue-oculta` → `REC-V11-descartada`, `-otra-pestana` y
`-volver`; `REC-V12-tarjeta-mostrada` → `REC-V12-reaparece`.

En `build\` quedan los registros de la compilación Debug (`hu2-build-windows-20261107-102227`,
4 PASS), de Jest en Windows (`jest.log`: 39 suites, 705 pruebas aprobadas) y de logcat.
