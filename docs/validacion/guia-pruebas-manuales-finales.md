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
| G4-04 | HU4-CA05, CA06 | Montos `0`, `-5`, `abc`; descripción de más de 250 caracteres | «Ingrese un monto válido»; contador en rojo |
| G4-05 | HU4-CA07–CA09 | Registrar un ingreso `1.250.000,50` (Salario) y dos gastos (Alimentación y Transporte) | «¡Operación exitosa!» y el resumen; al volver, el formulario está vacío |
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

## Regresión y seguridad

| Paso | Acción | Resultado esperado |
|---|---|---|
| G-S1 | `adb shell run-as co.gfpsas.gestionfinanciera ls databases` y copiar el archivo de la base (solo Debug) | El archivo no se abre como SQLite sin clave (cifrado SQLCipher) |
| G-S2 | `aapt2 dump badging` del APK Release (lo hace `Invoke-ReleaseBuild.ps1`) | Permisos `INTERNET`, `ACCESS_NETWORK_STATE` y `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; sin cámara ni almacenamiento |
| G-S3 | Actualizar sobre una instalación con datos de `main` (`5dd2071`) | Los movimientos y categorías se conservan (migración 6) |
