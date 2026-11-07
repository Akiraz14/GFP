# Cierre del proyecto GFP — MVP finalizado

**Fecha:** 2026-11-07  
**Producto:** GFP — Gestión Financiera Personal, aplicación Android (`co.gfpsas.gestionfinanciera`)  
**Versión:** 1.0 (`versionCode` 1)  
**Estado:** MVP funcionalmente terminado. El responsable informó pruebas funcionales manuales
satisfactorias en Android 10. Quedan dos acciones locales del responsable: generar y verificar el
APK Release definitivo y publicar `main` en GitHub (sección 11).

## 1. Objetivo y alcance

GFP ayuda a una persona a registrar sus ingresos y gastos, consultar el análisis de sus finanzas y
recibir recomendaciones basadas en reglas, **sin conexión y sin servidor**: todos los datos quedan
en el dispositivo, en una base de datos cifrada. El alcance es el de los documentos fuente
(propuesta comercial, propuesta VF y documento de historias de usuario RQ02v2), que se conservan
fuera del repositorio. El entregable es un APK instalable en Android 10 (API 29) o superior.

Fuera del alcance: backend, sincronización en la nube, iOS y metas de ahorro.

## 2. Historias de usuario cubiertas

Las diez historias del documento RQ02v2, con 99 criterios de aceptación. La correspondencia de
cada criterio con su implementación y sus pruebas está en `trazabilidad.md` y
`cobertura-hu1-hu10.md`.

| Historia | Funcionalidad |
|---|---|
| HU1 Registrar usuario | Asistente de tres pasos: datos personales, cinco preguntas de seguridad y contraseña |
| HU2 Iniciar sesión | Con correo, documento o celular; bloqueo de 15 minutos tras tres intentos fallidos |
| HU3 Recuperar contraseña | Con dos preguntas de seguridad, bloqueo por intentos y nueva contraseña |
| HU4 Registrar y editar movimiento | Ingresos y gastos con monto, fecha, categoría y descripción; confirmación al actualizar y regreso automático al historial |
| HU5 Consultar historial | Lista con filtros por fecha, tipo y categoría; edición y eliminación; botones flotantes de registro |
| HU6 Visualizar balance | Ingresos, gastos y balance del período |
| HU7 Capturar gasto con foto | Cámara o galería, lectura OCR en el dispositivo y revisión antes de guardar |
| HU8 Administrar categorías | Categorías del sistema y propias; duplicados controlados; reasignación a «Otros» |
| HU9 Consultar análisis financiero | Métricas por período, gastos por categoría y evolución |
| HU10 Recomendaciones automáticas | Reglas R1 a R8 y Consejo de Ahorro, con acceso a los movimientos asociados |

Ajustes posteriores aprobados: AJ-01 a AJ-06 (`ajustes-finales.md`), recomendaciones ampliadas
(`recomendaciones-ampliadas.md`) e ícono oficial (`icono-aplicacion.md`).

## 3. Tecnologías

| Área | Tecnología |
|---|---|
| Aplicación | React Native 0.87.1, React 19.2.3, TypeScript |
| Base de datos local | `@op-engineering/op-sqlite` 18.2.5 con SQLCipher |
| Custodia de la clave | `react-native-keychain` 10.0.0 (Android Keystore) |
| Credenciales | PBKDF2-HMAC-SHA256 nativo (módulo propio `GfpCrypto`) |
| OCR | `@react-native-ml-kit/text-recognition` 2.0.0, en el dispositivo |
| Cámara y galería | `react-native-image-picker` 8.3.0 |
| Gráficos e íconos | `react-native-svg` 15.16.0 |
| Pruebas | Jest 29, React Native Testing Library 14.0.1 |
| Compilación | Gradle, JDK 17; `compileSdk` 37, `targetSdk` 36, `minSdk` 29 |

Las versiones exactas están en `app/package.json` y `app/android/build.gradle`.

## 4. Arquitectura

Aplicación local en capas, según el diagrama C4 nivel 3 de la propuesta comercial
(`app/src/README.md`):

| Capa (`app/src`) | Responsabilidad |
|---|---|
| `presentation/` | Pantallas, componentes y navegación |
| `business/` | Movimientos, categorías, dinero, fechas y servicio de recomendaciones |
| `services/` | Autenticación, sesión y validaciones |
| `processing/` | Captura de imagen, OCR y extracción de datos |
| `analysis/` | Métricas de HU9 y reglas de HU10 |
| `infrastructure/` | Base cifrada, migraciones, repositorios, seguridad y módulos nativos |

Los servicios devuelven resultados tipados y exigen una sesión activa. Cada usuario del dispositivo
solo ve sus propios datos.

## 5. Persistencia local y funcionamiento offline

- Sin backend ni sincronización: la app funciona sin conexión.
- Base SQLite cifrada con SQLCipher. Su clave de 256 bits se genera en el dispositivo y se guarda
  en el Android Keystore.
- Seis migraciones de esquema versionadas e inmutables.
- Contraseñas y respuestas de seguridad guardadas solo como verificadores PBKDF2.
- `android:allowBackup="false"` y reglas de extracción que excluyen los datos de las copias de
  Android. **Desinstalar la app borra los datos y no se pueden recuperar.**

## 6. OCR y sus limitaciones

La lectura de comprobantes (HU7) usa ML Kit en el dispositivo. La app extrae monto, fecha y
comercio, y endereza documentos girados 90°, 180° o 270° (AJ-02). El usuario siempre revisa y
corrige los datos antes de guardar.

Limitaciones conocidas:

- **La precisión no es absoluta.** El resultado depende de la nitidez, la iluminación, la
  orientación y la cantidad de información de la factura.
- Si no hay un total fiable, el monto queda vacío y el formulario lo pide.
- La evaluación formal de calidad del OCR (`plan-evaluacion-ocr.md`, P-CONS-03) no se ejecutó.
  Lo verificado son las pruebas automatizadas de extracción y las pruebas manuales del
  responsable con los comprobantes de prueba (AJ-V3 y AJ-V4).

## 7. Recomendaciones basadas en reglas

Las recomendaciones son deterministas: se calculan con reglas fijas sobre los movimientos del
usuario, en el dispositivo y sin inteligencia artificial. Incluyen la leyenda de que no
constituyen asesoramiento financiero profesional.

| Regla | Condición | Prioridad o convivencia |
|---|---|---|
| R8 Sin ingresos registrados | Mes actual sin ingresos y con gastos | Reemplaza a R1 |
| R1 Balance Negativo | Ingresos > 0 y gastos ≥ ingresos | Excluye R6 y el Consejo de Ahorro; convive con R7 |
| R6 Alerta temprana de gasto | 80 % ≤ gastos / ingresos < 100 % | Excluye el Consejo de Ahorro |
| Consejo de Ahorro | Ingresos > 0, balance positivo y sin R6 | — |
| R2 Categoría Crítica | Una categoría > 50 % de los gastos del mes | Sin exclusiones |
| R3 ¡Alerta de Gastos Altos! | Gasto de la categoría > 130 % del mes anterior completo | Sin exclusiones |
| R4 Gasto reducido | Reducción > 30 % en períodos equivalentes | Convive con R5 |
| R5 Hábito estable | Variación ≤ 10 % en períodos equivalentes | Convive con R4 |
| R7 Ingresos menores que el mes anterior | Disminución > 20 % en períodos equivalentes | Convive con R1 |

Íconos, colores, acciones, períodos equivalentes y decisiones (E-AJ-D1, E-AJ-D2, E-REC-D1) en
`recomendaciones-ampliadas.md` y `decisiones.md`. Descartar una tarjeta la oculta solo durante
la sesión.

## 8. Pruebas

### Automatizadas (Jest)

Último resultado registrado, en una copia del árbol de trabajo con todos los cambios de esta
entrega (2026-11-07):

| Verificación | Resultado |
|---|---|
| Jest | 39 suites, 712 pruebas aprobadas, 0 omitidas |
| TypeScript (`tsc --noEmit`) | 0 errores |
| ESLint | 0 errores y 0 avisos |
| Prettier | Sin diferencias |

Las pruebas son unitarias, de servicios con SQLite en memoria, de persistencia, de pantallas y de
la app completa. Qué valida cada archivo y cómo ejecutarlas: `testing/guia-pruebas-automatizadas.md`.

### Manuales (responsable, Android 10, emulador Pixel 4)

| Validación | Resultado | Detalle |
|---|---|---|
| Pruebas funcionales del MVP (HU1–HU10) | Satisfactorias, según el responsable (2026-11-07) | — |
| REC-V1 a REC-V12 (recomendaciones) | APROBADO | `recomendaciones-ampliadas.md`, sección 6 |
| AJ-V1 a AJ-V8 (ajustes finales) | Aprobados | `ajustes-finales.md`, sección 3 |
| APK Release anterior (`107b3e4`) | Satisfactorio, según el responsable | Sección 10 |

Las evidencias están fuera del repositorio, en `GFP Proyecto\GFP-evidencias\`. Para repetir las
pruebas: `testing/guia-pruebas-emulador-android.md`.

El ícono oficial y la confirmación al actualizar movimientos (AJ-06) se incorporaron después del
APK Release anterior. AJ-06 está cubierto por pruebas automatizadas; su
comprobación en el emulador y la del ícono en el launcher forman parte de la verificación del APK
definitivo (sección 11).

## 9. Compatibilidad

| Dato | Valor |
|---|---|
| Android mínimo | 10 (API 29) |
| Android objetivo | API 36 |
| Validación | Emulador `Pixel_4_Android_10` (Android 10) |
| Permisos del Release | `INTERNET`, `ACCESS_NETWORK_STATE` y el permiso interno de receptores dinámicos, los únicos admitidos por E02-D7 |

## 10. APK Release

Se genera con `scripts\release\Invoke-ReleaseBuild.ps1`, que pide las contraseñas de la clave sin
mostrarlas y verifica firma, paquete, `minSdkVersion`, que no sea depurable, permisos y bundle
JavaScript. Procedimiento completo: `guia-instalacion-ejecucion.md`, secciones 4 a 6.

| Dato | Valor |
|---|---|
| Archivo | `GFP-Android-Release-v1.0.apk` |
| Ubicación | `C:\Users\juanz\Akiraz\Study\GFP Proyecto\entregables\` (fuera del repositorio; `*.apk` no se versiona) |
| Versión | `versionName` 1.0, `versionCode` 1 |
| Paquete | `co.gfpsas.gestionfinanciera` |
| SDK | `minSdkVersion` 29, `targetSdkVersion` 36 |
| Tipo | Release, no depurable, con `assets/index.android.bundle` (abre sin Metro) |
| Firma | Clave propia `gfp-release` (D-06) en `%USERPROFILE%\.gfp-release\gfp-release.jks`, esquema v2; certificado SHA-256 `c7239744262234f2fffc0930487925f805a3bf00cfd83eb53a3b6f6d0cdf416e` |
| Informe de verificación | `entregables\GFP-Android-Release-v1.0.txt`, generado junto al APK |

APK Release anterior, generado por el responsable el 2026-11-07 desde `107b3e4` (sin el ícono ni
AJ-06): `Invoke-ReleaseBuild.ps1` con `RESULTADO PASS=10 FAIL=0`, SHA-256
`AF71A35299F9845E2B8ED386E6DB1650FA242925016CE3CD67342E0301CB924E`, mismo certificado
(`GFP-evidencias\cierre\hu2-release-windows-20261107-122835`). El APK definitivo lo reemplaza; el
anterior se conserva en `entregables\anteriores\`.

**Instalación:** `adb install -r` o abrir el APK desde el administrador de archivos y elegir
«Actualizar». Con la misma firma, la actualización conserva los datos. No desinstale la versión
existente: desinstalar borra la base de datos local.

## 11. Estado de entrega

| Elemento | Estado |
|---|---|
| Alcance funcional HU1–HU10 | Implementado |
| Ajustes AJ-01 a AJ-06, recomendaciones R1–R8 y Consejo de Ahorro, ícono oficial | Implementados |
| Pruebas automatizadas | Registradas (sección 8) |
| Pruebas manuales en Android 10 | Satisfactorias, según el responsable |
| Documentación | Actualizada (`README.md` y este documento) |
| Publicación en GitHub (`main`) | Pendiente del `push` del responsable |
| APK Release definitivo | Pendiente de generación y verificación local por el responsable |

## 12. Declaración de cierre

El MVP de GFP — Gestión Financiera Personal está funcionalmente terminado. Implementa las diez
historias de usuario acordadas (HU1 a HU10): registro, inicio de sesión y recuperación de cuenta;
registro, edición y consulta de movimientos; balance; captura de gastos mediante fotografía con
OCR; administración de categorías; análisis financiero y recomendaciones basadas en reglas. La
aplicación funciona sin conexión y protege la información financiera con una base de datos local
cifrada.

El responsable del proyecto ejecutó las pruebas funcionales manuales en Android 10 con resultados
satisfactorios. Las pruebas automatizadas registradas (39 suites, 712 pruebas aprobadas) y las
verificaciones estáticas están documentadas.

El reconocimiento de comprobantes depende de la calidad de las imágenes (nitidez, orientación e
información disponible) y no garantiza una lectura perfecta; por eso el usuario revisa los datos
antes de guardarlos.

La entrega queda completa cuando el responsable genere y verifique localmente el APK Release
definitivo y publique la rama `main` en GitHub.
