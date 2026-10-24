# Matriz de trazabilidad — GFP

Los criterios de aceptación se conservan **literalmente** en el documento fuente
`RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (sección 3).
Esta matriz solo asigna identificadores internos `HUx-CAyy`, numerados en el orden
en que aparecen los criterios en cada historia, y registra etapa, estado y
evidencia. La transcripción literal de cada criterio se incorpora a esta matriz al
iniciar la etapa de su historia.

Estados: Pendiente · Implementado · Probado · Parcial · Verificado.

## Resumen por historia

| Historia | Criterios | Etapa | Estado |
|---|---|---|---|
| HU1 Registrar usuario | CA01–CA19 | 03 | Pendiente |
| HU2 Iniciar sesión | CA01–CA11 | 04 | Pendiente |
| HU3 Recuperar contraseña | CA01–CA13 | 05 | Pendiente |
| HU8 Administrar categorías de movimientos financieros | CA01–CA08 (CA07 con subcriterios a, b, c) | 06 | Pendiente |
| HU4 Registrar y editar movimiento financiero | CA01–CA13 | 07 | Pendiente |
| HU5 Consultar historia de movimientos financieros | CA01–CA07 | 08 | Pendiente |
| HU6 Visualizar balance financiero | CA01–CA04 | 09 | Pendiente |
| HU7 Capturar gasto mediante factura o comprobante | CA01–CA12 | 10 | Pendiente |
| HU9 Consultar análisis financiero | CA01–CA06 | 11 | Pendiente |
| HU10 Consultar recomendaciones financieras automáticas | CA01–CA06 (CA02 con subcriterios a, b, c) | 12 | Pendiente |
| **Total** | **99** | | |

## Criterios parciales previstos

| Criterio | Historia | Dependencia | Evidencia exigible en la etapa actual (propuesta) | Verificación definitiva |
|---|---|---|---|---|
| HU1-CA18 | HU1 | Pantalla de inicio de sesión (HU2) | Prueba: Cancelar limpia todos los campos y emite navegación a la ruta de inicio de sesión | E04 |
| HU2-CA09 | HU2 | Pantalla de recuperación (HU3) | Prueba: el enlace emite navegación a la ruta de recuperación | E05 |
| HU2-CA10 | HU2 | Pantallas con información financiera (HU4, HU5, HU6, HU9, HU10) | Prueba: rutas autenticadas inaccesibles sin sesión válida; re-verificación en E07–E12 | E13 |
| HU2-CA11 | HU2 | Datos financieros de dos o más usuarios | Prueba: la sesión queda asociada a un único usuario; aislamiento verificado en E07, E08, E11, E12 | E13 |
| HU8-CA07c | HU8 | Movimientos (HU4) | Prueba de eliminación; reasignación con datos de prueba solo si el esquema existe desde E02 | E07 |
| HU8-CA08 | HU8 | Formulario HU4 y filtros HU5 | Prueba: la categoría creada o editada aparece de inmediato en la consulta de categorías activas | E07 y E08 |
| HU4-CA07 y CA08 (variante edición) | HU4 | Punto de entrada a la edición (HU5) | Prueba de integración del modo edición: guarda y muestra el mensaje de actualización | E08 |
| HU4-CA10 | HU4 | Botón "Editar" del historial (HU5-CA07) | Prueba de integración: el modo edición carga todos los datos del movimiento | E08 |
| HU4-CA12 | HU4 | Historial (HU5) y decisión E07-D3 | Prueba: Cancelar descarta cambios sin persistir | E08 |

HU5-CA07 pertenece a HU5 y se verifica en E08 como criterio propio; no sustituye
a HU4-CA10.

## Etapa 01 — criterios de cierre (no son criterios de historias)

| ID interno | Criterio | Estado | Evidencia |
|---|---|---|---|
| E01-C1 | Proyecto React Native 0.87.x con TypeScript para Android, identificador y nombre de G-05 | Verificado | `aapt2`: `package: name='co.gfpsas.gestionfinanciera'`, `application-label:'GFP'`, `minSdkVersion:'29'` (`20261016-152425/complementarias-20261019/salida-aapt2.txt`); `claude-20261016/configuracion.txt` |
| E01-C2 | Estructura inicial de carpetas según C4 Nivel 3 | Implementado | `app/src/README.md` |
| E01-C3 | Herramientas de calidad configuradas (tsc, ESLint, Prettier) y sin errores | Verificado (Linux y Windows); defecto de Prettier corregido | `claude-20261016/{typecheck,lint,format}.log`; `20261016-152425/{typecheck,lint,format}.log`; `20261019-194120/{typecheck,lint}.log`. Prettier falló en `20261019-194120/format.log` por revisar archivos generados; corregido con `app/.prettierignore` y verificado en Linux (`claude-20261019/format-check.log`) y en Windows (`windows-format-check/format-check.log`, 21/10/2026, código 0) |
| E01-C4 | Pruebas configuradas (Jest + React Native Testing Library) pasan | Verificado (Linux y Windows) | `claude-20261016/jest.log`; `20261016-152425/jest.log`; `20261019-194120/jest.log` |
| E01-C5 | Compilación Android (`assembleDebug`) con JDK 17 sin modificar Java global | Verificado | `20261016-152425/gradle-version.log` (`Launcher JVM: 17.0.20.1`), `20261016-152425/gradle-assembleDebug.log` (`BUILD SUCCESSFUL`), `20261016-152425/entorno.txt` (`JAVA_HOME` del proceso); repetido en `20261019-194120/`. El script solo cambia variables de su propio proceso |
| E01-C6 | APK de depuración instalado y ejecutándose en Android 10 (API 29) | Verificado | `20261016-152425/dispositivo.txt` (API 29); `20261016-152425/reanudacion/{instalar-debug.log,ui-debug.xml,captura-debug.png,logcat-debug.txt}`. Revalidación: `20261019-194120/{dispositivo-debug.txt,pid-debug.txt,ui-debug.xml,logcat-debug.txt}`. Release (complementaria): `20261016-152425/reanudacion/` (archivos `*-release*`) y `20261019-194120/{dispositivo-release.txt,reverse-release.txt,pid-release.txt,ui-release.xml,logcat-release.txt}` (API 29 registrada) |
| E01-C7 | Repositorio Git local con convenciones; documentos fuente excluidos del repositorio por decisión del responsable | Verificado | Historial sin objetos de los documentos fuente (`git rev-list --objects --all`, 2026-10-16); decisión D-FUENTES en `decisiones.md` |

Rutas relativas a `evidencias/ETAPA-01/`. El script corregido `scripts/validar-etapa.ps1`
quedó revalidado en `20261019-194120/`. La Etapa 01 fue aprobada. Ver `cierre-etapa-01.md`.

## Etapa 02 — criterios de cierre (no son criterios de historias)

Criterio específico del plan: fundamentos críticos con pruebas y evidencias verificables;
PoC de OCR solo de viabilidad; riesgos informados. Evidencia fuera del repositorio, en
`GFP-spike02-evidencias\20261023-163848-6caa2ac\` (rama experimental `6caa2ac`, emulador
API 34). Detalle y decisiones abiertas en `decisiones.md` (secciones "Etapa 02").

| ID interno | Criterio | Estado | Evidencia |
|---|---|---|---|
| E02-C1 | Librerías nativas seleccionadas y compatibles con React Native 0.87.1 | Verificado (emulador) | E02-LIB; `BUILD-DEBUG`, `RUN-D1` a `RUN-R3` en `summary.md` |
| E02-C2 | Base de datos cifrada con SQLCipher: cifrado en reposo y rechazo de clave incorrecta | Verificado (emulador) | `at-rest.txt`, `marker-search.txt`, `wrong-key-hashes.txt`, `sqlite-standard.txt` |
| E02-C3 | Secreto en Android Keystore persistente entre ejecuciones | Verificado (emulador); respaldo por hardware no demostrado | `P2-KEYSTORE-CAPABILITY`, `SCN-*` en `summary.md` |
| E02-C4 | Derivación PBKDF2-HMAC-SHA256 conforme a vectores de referencia | Verificado (emulador); parámetros no aprobados (E02-D1, E02-D2) | `p3-extended.txt`, `p3-benchmark.txt` |
| E02-C5 | Viabilidad de cámara, galería y OCR | Verificado como viabilidad; calidad sin umbral (E02-OCR, E02-D8) | `p4-batch.txt` |
| E02-C6 | Decisiones de la etapa resueltas (plan, "Decisiones pendientes por etapa") | Parcial | Librerías resueltas (E02-LIB); E02-D1 a E02-D9 abiertas |
| E02-C7 | Integración en `main` sin alterar la aplicación de la Etapa 01 | Pendiente | Integración selectiva aprobada tras revisión del diff y validaciones técnicas (E02-INT) |
