# Verificación de la Etapa 08 — HU5 Consultar historia de movimientos financieros

**Estado (2026-11-04):** Jest, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama
`e08/hu5-historial-movimientos`, con 32 suites y 519 pruebas. La compilación Android no se pudo
ejecutar en el entorno de Claude; se ejecuta en Windows con la sección 1. La etapa no añade
dependencias ni código nativo.

Conforme a D-07, esta etapa no tiene pruebas manuales. La sección 3 es la parte de HU5 (y de los
criterios de HU4 y HU8 completados aquí) de la guía de la validación manual integral, que el
responsable ejecuta después de la Etapa 13 en Android 10 y 14.

## Evidencias

- Van a `GFP-evidencias\e08\` (G-10), fuera del repositorio. Cada script crea su propia carpeta
  con fecha y hora y no sobrescribe ejecuciones anteriores.
- No se modifica ninguna evidencia anterior. Los scripts no usan cuentas reales ni muestran
  contraseñas.

## 1. Windows: controles estáticos, Jest y APK

Desde el repositorio canónico, en la rama de la etapa y con el árbol limpio.

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
git switch e08/hu5-historial-movimientos
git status --porcelain            # vacío
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\e08"
New-Item -ItemType Directory -Force $Ev | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\tests\Test-ApkBadging.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch e08/hu5-historial-movimientos -ExpectedTests 519 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\Invoke-Hu4ApkCheck.ps1 -EvidenceRoot $Ev
```

| Paso | Resultado esperado |
|---|---|
| `Test-ScriptSyntax.ps1` | `archivos=9 con errores=0` |
| `Test-ApkBadging.ps1` | `RESULTADO pruebas=10 fallos=0` |
| `Invoke-StaticChecks.ps1` | PASS=8 FAIL=0; Jest 519/519 |
| `Invoke-AndroidBuild.ps1` | PASS=4 FAIL=0 |
| `Invoke-Hu4ApkCheck.ps1` | PASS=3 FAIL=0 (sin cambios esperados: la etapa no toca dependencias) |

## 2. Regresión automatizada en emulador (opcional en esta etapa)

Desde esta etapa, tras un inicio de sesión correcto la app abre el historial de HU5. Por eso
`Invoke-Hu2DeviceTests.ps1` e `Invoke-Pbkdf2UpgradeCheck.ps1` esperan ahora el texto
«Movimientos de tus finanzas» en lugar del texto de la pantalla provisional. El procedimiento
es el mismo que en la Etapa 06 (`etapa-06-pruebas-dispositivo.md`, sección 2), con
`-EvidenceRoot $Ev`.

## 3. Guía de la validación final de HU5 (después de la Etapa 13)

Con una cuenta sintética y al menos cuatro movimientos: dos gastos de Alimentación en fechas
distintas, un gasto de Transporte y un ingreso de Salario. Para cada paso se anota PASS, FAIL u
OBSERVACIÓN.

| Paso | Criterio | Acción | Resultado esperado |
|---|---|---|---|
| H01 | — | Iniciar sesión | «Historial», «Movimientos de tus finanzas», filtros, lista y barra inferior con «Movimientos» marcada |
| H02 | HU5-CA01 | Revisar la lista | Del más reciente al más antiguo; cada tarjeta con ícono y categoría, monto con signo y color, descripción, fecha `DD/MM/AAAA` y tipo |
| H03 | HU5-CA02, HU8-CA08 | Crear una categoría en «Categorías», volver y abrir el filtro «Categoría» | «Categoría (Todas)», las del sistema y la recién creada |
| H04 | HU5-CA03 | Cambiar los filtros sin pulsar «Filtrar» | La lista no cambia |
| H05 | HU5-CA03 | Filtrar por rango de fechas, tipo Gasto y Alimentación | Solo los gastos de Alimentación del rango, incluidos los de las fechas extremas |
| H06 | HU5-CA04 | Filtrar por Ingreso y Transporte; luego «Limpiar filtros» | «No se encontraron movimientos» con su subtítulo; después, todo el historial y los filtros vacíos |
| H07 | HU5-CA07, HU4-CA10, CA07, CA08 | Pulsar «Editar» en un gasto, cambiar el monto y pulsar «Actualizar» | El formulario carga todos los datos; «El movimiento fue actualizado exitosamente»; al volver, la tarjeta muestra el monto nuevo |
| H08 | HU4-CA12 | Editar otro movimiento, cambiar el monto y pulsar «Cancelar»; repetir con Atrás y con la pestaña «Movimientos» | Vuelve al historial y el monto no cambia |
| H09 | HU5-CA05 | Pulsar «Eliminar» y luego «Cancelar» | Modal con «¿Está seguro de eliminar este movimiento?», «Esta acción es irreversible y afectará su balance.», «Cancelar» y «Confirmar»; el movimiento sigue |
| H10 | HU5-CA06 | Repetir y pulsar «Confirmar» | «Movimiento eliminado correctamente»; el movimiento desaparece; al reabrir la app sigue eliminado |
| H11 | E08-D3 | Fecha fin anterior a la de inicio; luego una fecha inexistente | Mensaje bajo «Fecha fin» en ambos casos y la lista no cambia |
| H12 | E08-D4, HU2-CA11 | Usar «Análisis» y «Recomendaciones»; cerrar sesión e iniciar con otra cuenta | Pantallas provisionales de HU9 y HU10 y regreso a «Movimientos»; la otra cuenta no ve los movimientos de la primera |

Para H12, la app no tiene un botón de cierre de sesión: reiniciar la app termina la sesión
(E04-D4).
