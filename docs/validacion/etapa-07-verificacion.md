# Verificación de la Etapa 07 — HU4 Registrar y editar movimiento financiero

**Estado (2026-11-04):** Jest, `typecheck`, `lint` y `format:check` pasaron en Linux sobre la rama
`e07/hu4-registrar-movimiento`, con 30 suites y 491 pruebas. La compilación Android no se pudo
ejecutar en el entorno de Claude (descargas de Gradle y del Android SDK bloqueadas); se ejecuta
en Windows con la sección 1.

Conforme a D-07, esta etapa no tiene pruebas manuales. La sección 3 es la parte de HU4 de la
guía de la validación manual integral, que el responsable ejecuta después de la Etapa 13 en
Android 10 y 14. No es una condición de cierre de esta etapa.

## Evidencias

- Van a `GFP-evidencias\e07\` (G-10), fuera del repositorio. Cada script crea su propia carpeta
  con fecha y hora y se detiene si ya existe: no sobrescribe ejecuciones anteriores.
- No se modifica ninguna evidencia anterior. Los scripts no usan cuentas ni contraseñas.

## 1. Windows: controles estáticos, Jest, APK y calendario nativo

Desde el repositorio canónico, en la rama de la etapa y con el árbol limpio. La etapa añade la
dependencia `@react-native-community/datetimepicker`, así que `Invoke-StaticChecks.ps1` debe
ejecutarse sin `-SkipNpmCi`.

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
git switch e07/hu4-registrar-movimiento
git status --porcelain            # vacío
git log --oneline -1              # commit entregado
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\e07"
New-Item -ItemType Directory -Force $Ev | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch e07/hu4-registrar-movimiento -ExpectedTests 491 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\Invoke-Hu4ApkCheck.ps1 -EvidenceRoot $Ev
```

| Paso | Resultado esperado |
|---|---|
| `Test-ScriptSyntax.ps1` | Sin errores (analiza `scripts\stage-04`) |
| `Invoke-StaticChecks.ps1` | PASS=8 FAIL=0; Jest 491/491 |
| `Invoke-AndroidBuild.ps1` | PASS=4 FAIL=0; registra el SHA-256 del APK Debug. Gradle descarga una sola vez `com.google.android.material:material` 1.12.0, que requiere el calendario |
| `Invoke-Hu4ApkCheck.ps1` | PASS=3 FAIL=0: `MIN-SDK` (API 29), `PERMISSIONS` (sin permisos fuera de E02-D7) y `DATE-PICKER-NATIVE` (módulo `com.reactcommunity.rndatetimepicker` en el APK) |

Si `PERMISSIONS` falla, el resumen indica qué permisos no están en la lista de E02-D7; se
reporta sin cambiar el script.

## 2. Regresión automatizada en emulador (opcional en esta etapa)

Los scripts de la Etapa 04 siguen siendo válidos: la pantalla provisional de HU5 conserva su
texto y muestra además los botones «+ Nuevo movimiento» y «Categorías». La migración 5 se aplica
al abrir la base; ningún script debe registrar `FATAL EXCEPTION`. Mismo procedimiento que en la
Etapa 06 (`etapa-06-pruebas-dispositivo.md`, sección 2), con `-EvidenceRoot $Ev`.

## 3. Guía de la validación final de HU4 (después de la Etapa 13)

Con una cuenta sintética recién registrada, en Android 10 y en Android 14. Para cada paso se anota
PASS, FAIL u OBSERVACIÓN; las capturas no deben mostrar contraseñas.

| Paso | Criterio | Acción | Resultado esperado |
|---|---|---|---|
| M01 | — | Iniciar sesión y pulsar «+ Nuevo movimiento» | «Registro de movimiento», «Añade una nueva transacción.», Gasto seleccionado y flecha roja ↓ |
| M02 | HU4-CA02, HU8-CA08 | Abrir «Categoría» con Gasto y con Ingreso; crear antes una categoría personalizada de ingreso | Gasto: las 7 de gasto del sistema, «Otros» y las propias de gasto. Ingreso: Salario, «Otros» y las propias de ingreso, incluida la recién creada |
| M03 | HU4-CA01, CA13 | Borrar la fecha y pulsar «Guardar movimiento» sin monto ni categoría | «Error en los campos ingresados» y un mensaje bajo monto, fecha y categoría; nada se guarda |
| M04 | HU4-CA03 | Abrir el formulario | La fecha es la de hoy, `DD/MM/AAAA` |
| M05 | HU4-CA04 | Escribir la fecha de mañana y guardar | «La fecha no puede ser futura» |
| M06 | HU4-CA04, D-03 | Pulsar 📅 | Calendario de Android con hoy seleccionado y los días futuros deshabilitados; al elegir un día el campo se actualiza |
| M07 | HU4-CA05 | Probar `0`, `-5`, `abc` y `45.500` | Los tres primeros muestran «Ingrese un monto válido»; `45.500` se acepta |
| M08 | HU4-CA06 | Guardar sin descripción; luego escribir más de 250 caracteres | Sin descripción se guarda; con más de 250 el contador se pone rojo y no se guarda |
| M09 | HU4-CA07, CA08 | Registrar un ingreso de `1.250.000,50` con Salario | «¡Operación exitosa!», «El movimiento fue registrado exitosamente» y el resumen con «$1.250.000,50» |
| M10 | HU4-CA09 | Pulsar «Volver al historial» y abrir de nuevo el formulario | Los campos están en sus valores iniciales |
| M11 | HU4-CA11 | Llenar todos los campos y pulsar «Limpiar» | Todos vuelven a sus valores iniciales |
| M12 | HU4-CA12 | Llenar el formulario y pulsar «Cancelar»; repetir con Atrás | Vuelve al historial y no se guarda nada |
| M13 | HU8-CA07c | Registrar dos gastos con una categoría propia y eliminarla | El modal dice «2 movimientos serán reasignados.»; los movimientos quedan en «Otros» (se comprueba en el historial desde la Etapa 08) |
| M14 | HU2-CA11 | Iniciar sesión con otra cuenta | No ve las categorías propias de la primera cuenta en el selector |

La edición (HU4-CA07 y CA08 al editar, CA10) se valida con el botón «Editar» del historial en la
guía de la Etapa 08.
