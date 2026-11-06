# Guía de la validación manual integral (HU1–HU10)

Validación única posterior a la consolidación (D-07), ejecutada por el responsable en **Android 10
(API 29)** y **Android 14 (API 34)**, con el APK Release firmado (o el Debug con Metro si la firma
aún no está lista; anótelo). Sustituye las guías parciales de E07 (`etapa-07-verificacion.md`,
M01–M14) y E08 (`etapa-08-verificacion.md`, H01–H12), que siguen siendo válidas como detalle.

## Reglas

- Solo cuentas y datos **sintéticos**. Ninguna captura debe mostrar contraseñas ni respuestas de
  seguridad.
- Para cada paso anote PASS, FAIL u OBSERVACIÓN, la fecha, el dispositivo y el APK (SHA-256).
- Evidencias en `GFP-evidencias\final\<dispositivo>\`, fuera del repositorio, una carpeta por
  ejecución; no se sobrescriben ejecuciones anteriores.
- Evidencia mínima por paso: una captura del resultado esperado. Los pasos marcados con ★ piden
  además lo indicado.
- La sesión termina al cerrar la app (E04-D4); para cambiar de cuenta, ciérrela y ábrala.

## Precondiciones generales

1. APK instalado desde cero (`adb uninstall co.gfpsas.gestionfinanciera` antes, si existía).
2. Dos cuentas sintéticas: **A** y **B**, creadas en G1.
3. Para G7: tres imágenes en la galería del emulador o dispositivo: un comprobante legible (JPG),
   una imagen sin texto (PNG) y una imagen de más de 5 MB o en GIF. En un dispositivo físico,
   además, un comprobante impreso para la cámara.
4. Reloj del dispositivo en la fecha real; anote la fecha de la prueba (HU10 depende del mes).

## G1 — HU1 Registrar usuario

HU1 ya se validó en emulador en E03 (sección «HU1 — cierre de validación» de
`trazabilidad.md`). En la validación final se repite como regresión.

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G1-01 | HU1-CA01–CA19 | Recorrer los tres pasos del registro con datos inválidos, duplicados y válidos, según la tabla de criterios de HU1 en `trazabilidad.md` | Cada mensaje y comportamiento literal de la tabla; cuenta A creada |
| G1-02 | HU1-CA18 | En los pasos 2 y 3 pulsar «Cancelar» | Vuelve al inicio de sesión sin cuenta parcial |
| G1-03 | — | Crear la cuenta B | Cuenta creada |

## G2 — HU2 Iniciar sesión

Procedimiento detallado en `etapa-04-pruebas-dispositivo.md` (ejecutado en Android 10 y 14 en
E04); se repite como regresión.

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G2-01 | HU2-CA01–CA06 | Campos vacíos, identificador inexistente, contraseña errónea y tres intentos fallidos | Mensajes literales y bloqueo de 15 minutos (HU2-CA06) |
| G2-02 | HU2-CA07 | Iniciar con la cuenta A | Abre el historial («Movimientos de tus finanzas») |
| G2-03 | HU2-CA08, CA09 | «Registrar» y «Olvidé mi contraseña» | Abren HU1 y HU3 |
| G2-10 | HU2-CA10 | Cerrar la app con la sesión abierta y abrirla | Vuelve al inicio de sesión; sin datos visibles |
| G2-11 | HU2-CA11 ★ | Con A, registrar un movimiento y una categoría; cerrar e iniciar con B | B no ve movimientos, categorías, totales, análisis ni recomendaciones de A. ★ Capturas de B en las cinco vistas |

## G3 — HU3 Recuperar contraseña

Procedimiento detallado en `etapa-05-pruebas-dispositivo.md` (ejecutado en Android 10 y 14 en
E05, con HU3-CA06 sin verificación en dispositivo); se repite como regresión.

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G3-01 | HU3-CA01–CA13 | Recorrer la recuperación con identificador inexistente, respuestas erróneas, contraseña inválida y válida | Mensajes y comportamientos literales de la tabla de HU3 |
| G3-02 | HU3-CA06 ★ | Tras el cambio, comprobar que la contraseña no queda en claro (`run-as` y copia de la base, solo Debug; requiere la clave SQLCipher) | Pendiente desde E05 (R16 no verificable): anote si se pudo verificar |
| G3-03 | HU3-CA12, CA13 | Iniciar con la contraseña nueva y con la anterior | La nueva entra; la anterior se rechaza |

## G4 — HU4 Registrar y editar movimiento

Detalle en `etapa-07-verificacion.md`, M01–M14.

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G4-01 | HU4-CA01, CA13 | «+ Nuevo movimiento»; guardar sin monto ni categoría y con la fecha vacía | «Error en los campos ingresados» y mensajes por campo |
| G4-02 | HU4-CA02, CA03 | Abrir «Categoría» con Gasto y con Ingreso | Categorías del tipo más «Otros»; la fecha es la de hoy |
| G4-03 | HU4-CA04 ★ | Fecha de mañana escrita; abrir 📅 | «La fecha no puede ser futura»; el calendario no deja elegir días futuros. ★ Captura del calendario |
| G4-04 | HU4-CA05, CA06 | Monto `0`; intentar escribir `-5` y `abc`; descripción de más de 250 caracteres | `0` muestra «Ingrese un monto válido»; el teclado numérico y la máscara de Bug 40 no admiten `-` ni letras; contador en rojo |
| G4-05 | HU4-CA07–CA09 | Registrar un ingreso `1.250.000,50` (Salario; se teclea `1250000,50`, E-COR-D3) y dos gastos (Alimentación y Transporte) | «¡Operación exitosa!» y el resumen; al volver, el formulario está vacío |
| G4-06 | HU4-CA10, CA07, CA08 | «Editar» en un gasto, cambiar el monto, «Actualizar» | Datos cargados; «El movimiento fue actualizado exitosamente» |
| G4-07 | HU4-CA11, CA12 | Llenar y pulsar «Limpiar»; llenar y pulsar «Cancelar», Atrás y la pestaña «Movimientos» | Campos restablecidos; vuelve al historial sin guardar |

## G5 — HU5 Historial

Detalle en `etapa-08-verificacion.md`, H01–H12.

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G5-01 | HU5-CA01 | Revisar la lista | Del más reciente al más antiguo, con categoría, monto con signo, fecha y tipo |
| G5-02 | HU5-CA02, HU8-CA08 | Crear una categoría y abrir el filtro «Categoría» | Aparece la nueva |
| G5-03 | HU5-CA03 | Filtrar por rango, tipo y categoría; cambiar filtros sin pulsar «Filtrar» | Solo coincidencias; sin «Filtrar» no cambia |
| G5-04 | HU5-CA04 | Filtro sin coincidencias; «Limpiar filtros» | Estado vacío literal; luego todo |
| G5-05 | HU5-CA05, CA06 ★ | «Eliminar», «Cancelar»; «Eliminar», «Confirmar»; reabrir la app | Modal literal; «Movimiento eliminado correctamente»; sigue eliminado. ★ Captura del modal |
| G5-06 | HU5-CA07 | «Editar» | Abre HU4 con los datos |

## G6 — HU6 Balance

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G6-01 | HU6-CA01, CA02 | Revisar el resumen del historial con los movimientos de G4 | INGRESOS, GASTOS y BALANCE con el formato `$1.250.000,50` (separador de miles y dos decimales); BALANCE = ingresos − gastos; no cambia al filtrar |
| G6-02 | HU6-CA03 ★ | Registrar gastos hasta superar los ingresos | BALANCE negativo en rojo. ★ Captura |
| G6-03 | HU6-CA04 | Crear, editar y eliminar un movimiento | Los tres valores cambian al volver al historial |

## G7 — HU7 Movimiento con foto

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G7-01 | HU7-CA01 ★ | «📷 Movimiento con foto» → «Tomar fotografía» (dispositivo físico o cámara del emulador) | Abre la cámara del sistema; la foto se procesa. ★ Anote el modelo y si la cámara es real o emulada |
| G7-02 | HU7-CA01 | «Seleccionar de la galería» con el comprobante JPG | Se procesa la imagen |
| G7-03 | HU7-CA02 | Elegir la imagen GIF o de más de 5 MB | Mensaje literal; no hay vista previa |
| G7-04 | HU7-CA03, CA04 ★ | Con el comprobante legible | «Procesando imagen con OCR…», vista previa, botones Cancelar/Reintentar/Continuar y, debajo, el resumen. ★ Anote qué campos acertó, falló o dejó vacíos (dato para D-05) |
| G7-05 | HU7-CA06–CA08 | Con la imagen sin texto; luego «Continuar» | Advertencia literal; formulario en Gasto, todos los campos vacíos, aviso de datos incompletos |
| G7-06 | HU7-CA05, CA09, CA10 | Con lectura parcial o completa, «Continuar»; corregir un campo; comprobar el historial antes de guardar; luego «Guardar movimiento» | Campos precargados y editables; nada en el historial hasta guardar |
| G7-07 | HU7-CA11, CA12 | «Reintentar»; «Cancelar»; Atrás | Estado inicial; vuelve al historial |
| G7-08 | E-CONS-D4 ★ | Tras G7-02 a G7-07: `adb shell run-as co.gfpsas.gestionfinanciera ls cache` (solo APK Debug) | Ningún archivo `rn_image_picker_lib_temp_*`. ★ Guarde la salida. Con Release, anótelo como no verificable |
| G7-09 | Offline ★ | Repetir G7-02 en modo avión | El OCR funciona sin red |

## G8 — HU8 Categorías

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G8-01 | HU8-CA01, CA02 | Abrir «Categorías» | Las 9 del sistema con candado, sin editar ni eliminar |
| G8-02 | HU8-CA03–CA06 | Crear, renombrar con un nombre existente (en otra capitalización), reutilizar un ícono, cambiar el tipo | «La categoría ya existe»; los demás cambios se guardan |
| G8-03 | HU8-CA07 ★ | Eliminar una categoría propia con dos movimientos | Modal literal con «2 movimientos serán reasignados.»; los movimientos pasan a «Otros» en el historial. ★ Captura del modal |

## G9 — HU9 Análisis financiero

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G9-01 | HU9-CA01, CA05 | Pestaña «Análisis», «Mes actual» | Total Ingresos, Total Gastos y Balance del mes con formato D-01 |
| G9-02 | HU9-CA02 ★ | Tocar un segmento de la dona o una fila de la leyenda; «Ver movimientos» | Muestra el monto de la categoría; abre el historial filtrado. ★ Captura de la dona |
| G9-03 | HU9-CA03 ★ | «Evolución» con «Mes actual» y con «Año actual» | Líneas de ingresos y gastos por semana y por mes. ★ Capturas |
| G9-04 | HU9-CA04 | Crear, editar, eliminar y registrar con foto un movimiento del período; volver a «Análisis» | Totales y gráficos cambian |
| G9-05 | HU9-CA06 | Rango personalizado sin movimientos | Mensaje literal; sin gráficos |

## G10 — HU10 Recomendaciones

| Paso | Criterios | Acción | Resultado esperado |
|---|---|---|---|
| G10-01 | HU10-CA01 | En modo avión, abrir «Recomendaciones» | Se generan sin red |
| G10-02 | HU10-CA02 ★ | Con gastos del mes mayores que los ingresos (R1), una categoría con más del 50 % (R2) y una categoría con más de 30 % sobre el mes anterior (R3; registre gastos con fecha del mes anterior) | Una tarjeta por regla activada. ★ Captura |
| G10-03 | HU10-CA03 | Revisar cada tarjeta | Título, descripción, datos de origen e ícono de severidad (naranja R1, rojo R2 y R3) |
| G10-04 | HU10-CA04, CA06 | Con la cuenta B (sin movimientos) | «¡Todo en orden! …» y el descargo literal |
| G10-05 | HU10-CA05 | «Ver movimientos asociados» en R1 y en R2 | Historial con el mes y, en R2, la categoría y Gasto |
| G10-06 | I-27 ★ | Descartar una tarjeta, cambiar de pestaña, cerrar y abrir la app | Sigue oculta durante el mes. ★ Si es posible, adelante el reloj al mes siguiente y anote si reaparece |

## G-INC — Incidencias y mejoras (Bugs 38–41, Tasks 27–37)

Detalle en `../incidencias-y-mejoras.md`. Ejecutar en Android 10 y 14.

| Paso | ID | Acción | Resultado esperado |
|---|---|---|---|
| GI-01 | Bug 38, Task 27 ★ | Registrar una cuenta: paso 1 con todos los datos, «Siguiente»; paso 2 con las preguntas, «Siguiente»; revisar el paso 3; «Editar datos»; volver y «Registrar» | Secciones del paso 1; barra de progreso igual a «Paso n de 3»; el paso 2 no avanza con preguntas incompletas; confirmación sin contraseña ni respuestas visibles; cada paso abre arriba. ★ Capturas de los tres pasos |
| GI-02 | Bug 39 | En el paso 2 elegir la pregunta 1; tocar «siguiente» del teclado en una respuesta | El teclado se abre en la respuesta 1; «siguiente» solo pasa a una respuesta con pregunta elegida |
| GI-03 | Bug 39, Task 29 | Recuperación: identificador válido y «Comenzar recuperación»; recorrer con «siguiente» | «Paso 2 de 2»; el foco y el teclado quedan en la respuesta 1; luego respuesta 2, nueva contraseña y confirmación |
| GI-04 | Bug 40 (sustituido por E-COR-D3) ★ | Ver GC-D3 | Ver GC-D3 |
| GI-05 | Bug 41 | Elegir de la galería una imagen GIF o WebP y otra JPG de más de 5 MB | El mensaje literal de HU7-CA02 y no se procesa |
| GI-06 | Task 36 | Abrir una lista desplegable, un diálogo de eliminar y el formulario de categoría; tocar dentro y fuera de cada uno | Dentro no se cierra; fuera se cierra sin guardar ni eliminar; Atrás de Android también lo cierra |
| GI-07 | Tasks 28, 30, 32–35 | Revisar inicio de sesión, historial con una descripción larga y un monto de 12 cifras, revisión de HU7, «Mis categorías» vacía, leyenda de «Evolución» y una recomendación con TalkBack | Coinciden con la sección 3 de `incidencias-y-mejoras.md`; TalkBack no lee «■» ni el emoji de severidad |

## G-COR — Correcciones de Android 10 (A–H)

Detalle en `../correcciones-android10.md`. Se valida **solo en el AVD `Pixel_4_Android_10`**
(Android 10, API 29). Las capturas van en
`C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\correcciones\<módulo>\`, sin tocar
`incidencias`.

### Preparación (PowerShell, una terminal nueva)

```powershell
# 1. Terminal y ruta del proyecto
Set-StrictMode -Version Latest
$Repo = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
Set-Location $Repo

# 2. Rama y estado de Git
git branch --show-current        # main
git status --short               # vacío
git log --oneline -1

# 3. Herramientas y carpeta de evidencias
$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$Adb = "$Sdk\platform-tools\adb.exe"
$Emu = "$Sdk\emulator\emulator.exe"
$Pkg = "co.gfpsas.gestionfinanciera"
$Avd = "Pixel_4_Android_10"
$Ev  = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\correcciones"
"A-registro","B-inicio-sesion","C-recuperacion","D-movimiento","E-foto","F-categorias","G-analisis","H-recomendaciones","build" |
  ForEach-Object { New-Item -ItemType Directory -Force (Join-Path $Ev $_) | Out-Null }
& $Emu -list-avds                # debe incluir Pixel_4_Android_10
```

```powershell
# 4. Arranque en frío del emulador Android 10
& $Adb emu kill 2>$null
Start-Sleep 3
Start-Process $Emu -ArgumentList '-avd', $Avd, '-no-snapshot-load'
& $Adb wait-for-device
do { Start-Sleep 3; $boot = (& $Adb shell getprop sys.boot_completed 2>$null) } until ("$boot".Trim() -eq '1')

# 5. Comprobar que es Android 10
& $Adb devices                                 # emulator-5554  device
& $Adb shell getprop ro.build.version.release  # 10
& $Adb shell getprop ro.build.version.sdk      # 29
```

```powershell
# 6. Desinstalar la versión anterior (borra la base cifrada y su clave)
& $Adb uninstall $Pkg
& $Adb shell pm list packages $Pkg             # sin resultado

# 7. Controles y limpieza de compilaciones anteriores
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch main -ExpectedTests 651 -EvidenceRoot "$Ev\build"
# Si Jest falla por tiempo en Windows: cd app; npx jest --testTimeout=30000 --runInBand; cd ..
$env:JAVA_HOME = (Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' | Sort-Object Name -Descending | Select-Object -First 1).FullName
Push-Location app\android; .\gradlew.bat clean --console=plain; Pop-Location

# 8. APK Debug (registra el SHA-256 en apk-debug.txt)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot "$Ev\build"

# 9. Existencia del APK
$Apk = "$Repo\app\android\app\build\outputs\apk\debug\app-debug.apk"
Test-Path $Apk; Get-FileHash $Apk -Algorithm SHA256

# 10. Instalación
& $Adb install $Apk                            # Success
```

```powershell
# 11. Inicio de la aplicación (Debug necesita Metro; en otra terminal: cd "$Repo\app"; npm start)
& $Adb reverse tcp:8081 tcp:8081
& $Adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1

# 12. Registro de logcat en segundo plano
& $Adb logcat -c
$Logcat = Start-Process -FilePath $Adb -ArgumentList 'logcat','-v','time','ReactNativeJS:V','ReactNative:V','AndroidRuntime:E','*:S' `
  -RedirectStandardOutput "$Ev\build\logcat.txt" -RedirectStandardError "$Ev\build\logcat-err.txt" -PassThru -NoNewWindow

# 13. Capturas (archivo binario intacto: screencap en el dispositivo y adb pull)
function Save-Screenshot([string]$Module, [string]$Name) {
  & $Adb shell screencap -p /sdcard/gfp-shot.png
  & $Adb pull /sdcard/gfp-shot.png (Join-Path $Ev "$Module\$Name.png") | Out-Null
  & $Adb shell rm /sdcard/gfp-shot.png
  Write-Host "Captura: $Ev\$Module\$Name.png"
}
# Ejemplo: Save-Screenshot 'A-registro' 'GC-A-paso1-encabezado'
```

```powershell
# 15. Fin de las pruebas
Stop-Process -Id $Logcat.Id
& $Adb shell am force-stop $Pkg
& $Adb emu kill
```

### Escenarios

En cada paso, compara la captura con el mockup y con la captura `GI-*` de `incidencias`.

| Paso | ID | Acción | Resultado esperado | Captura |
|---|---|---|---|---|
| GC-A1 | A1–A6, A8–A10 | «Crear Cuenta»; revisar el paso 1 completo (desplazar) | Encabezado «Registro de Usuario» con ← y ?; «Paso 1 de 3» y título centrados; barra azul; «Únete a GFP»; tres recuadros con ícono; (*) rojos; placeholders; «Cancelar» rojo; nota verde | `A-registro\GC-A1-paso1-*.png` |
| GC-A2 | A1, A13 | «Siguiente» con el paso vacío; ? y ←, ← en el paso 2 | Solo mensajes concretos; diálogo de ayuda; ← vuelve al paso 1 y, desde el paso 1, al inicio de sesión | `GC-A2-*` |
| GC-A3 | A7 | Paso 2 con una pregunta larga | Recuadro por pareja, «PREGUNTA DE SEGURIDAD n», «Obligatorio *», texto de la pregunta en una línea, «Tu respuesta» y placeholder; el teclado se abre en la respuesta | `GC-A3-*` |
| GC-A4 | A11, A12 | Paso 3 | Cada segmento en un recuadro; respuestas visibles; contraseña enmascarada; «Registrar» crea la cuenta | `GC-A4-*` |
| GC-B1 | B1–B9 | Inicio de sesión; ojo; «¿Olvidaste tu contraseña?» y «Crear Cuenta» | Título y subtítulo centrados, sin ← ni ?; recuadro con candado; (*) rojos; el ojo muestra y oculta; íconos en los botones; nota verde | `B-inicio-sesion\GC-B1-*` |
| GC-C1 | C1–C8 | Recuperación paso 1 y 2; ← en el paso 2 | ← y ?; paso centrado; barra de 2; texto de ayuda; (*) rojo; «Comenzar Recuperación»; nota verde; ← en el paso 2 vuelve al identificador | `C-recuperacion\GC-C1-*` |
| GC-D1 | D1, D2, D4–D7 | «+ Nuevo movimiento»; alternar Gasto/Ingreso; guardar vacío | Sin flecha; punto rojo y verde; $ y color del monto según el tipo; el error sobre «Guardar movimiento»; «Cancelar» rojo | `D-movimiento\GC-D1-*` |
| GC-D3 | D3 ★ | Teclear `45500` y guardar; luego `45500,50`; luego `45500.50`; borrar y editar en medio | `$45.500`; `$45.500,50` en ambos casos; el cursor no salta al editar; el historial y el balance coinciden con lo guardado | `GC-D3-*` |
| GC-E1 | E1, E2 | «Movimiento con foto» | Cámara en la vista previa y en el botón; recuadro amarillo de formatos | `E-foto\GC-E1-*` |
| GC-F1 | F1–F6 | «+ Nueva categoría», editar una y eliminar una con movimientos | Modal centrado y usable con el teclado; flechas de color en los tipos; eliminación con alerta, título centrado, recuadro amarillo con ícono, recuento centrado y «Confirmar» rojo | `F-categorias\GC-F1-*` |
| GC-G1 | G1–G7 | «Análisis»: periodos, una categoría, «Evolución» con ingresos > gastos y luego gastos > ingresos | Íconos; periodos en una tarjeta; categoría y valor separados; ondas suaves; tendencia verde ↗ o roja ↘ | `G-analisis\GC-G1-*` |
| GC-H1 | H1 | «Recomendaciones» con datos | Estrellas antes de «Recomendaciones Automatizadas» | `H-recomendaciones\GC-H1-*` |
| GC-R | Regresión | Registro, inicio de sesión, recuperación, movimientos con y sin decimales, foto, categorías, análisis y recomendaciones | Sin cambios funcionales; logcat sin `FATAL EXCEPTION` | `build\logcat.txt` |

## Regresión y seguridad

| Paso | Acción | Resultado esperado |
|---|---|---|
| G-S1 | `adb shell run-as co.gfpsas.gestionfinanciera ls databases` y copiar el archivo de la base (solo Debug) | El archivo no se abre como SQLite sin clave (cifrado SQLCipher) |
| G-S2 | `aapt2 dump badging` del APK Release (lo hace `Invoke-ReleaseBuild.ps1`) | Permisos `INTERNET`, `ACCESS_NETWORK_STATE` y `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; sin cámara ni almacenamiento |
| G-S3 | Actualizar sobre una instalación con datos de `main` (`5dd2071`) | Los movimientos y categorías se conservan (migración 6) |
