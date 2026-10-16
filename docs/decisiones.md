# Registro de decisiones — GFP

Fuente de verdad: los documentos fuente de la raíz del repositorio. Este registro
recoge las decisiones tomadas por el responsable del proyecto (Juan) durante la
planificación y la ejecución por etapas. No modifica los documentos fuente.

## Decisiones tomadas

| ID | Decisión | Fecha | Etapa |
|---|---|---|---|
| G-01 | Plan de etapas v3 aprobado: etapas 00, 01, 02, una etapa por historia (HU1–HU10) y etapa 13 de integración. Orden: HU1, HU2, HU3, HU8, HU4, HU5, HU6, HU7, HU9, HU10. Ver `plan-etapas.md`. | 2026-10-16 | 00 |
| DT-01 | El APK instalable y funcional para Android 10 (API 29) o superior es un entregable técnico obligatorio. Su generación, instalación y validación forman parte del proyecto. | 2026-10-16 | 00 |
| G-02 | Validación Android: Claude prepara guías, comandos, pruebas y registro de evidencias; Juan ejecuta en Windows lo que el entorno de Claude no permite. La validación en una segunda versión de Android es complementaria salvo acuerdo posterior. | 2026-10-16 | 00 |
| G-03 | Repositorio Git solo local en `C:\Users\juanz\Akiraz\Study\GFP`, con los documentos fuente intactos. No se crea ni publica repositorio remoto por ahora. | 2026-10-16 | 00 |
| G-04 | React Native CLI 0.87.x con TypeScript, npm, ESLint, Prettier, Jest y React Native Testing Library. Las dependencias nativas se validan en la Etapa 02. | 2026-10-16 | 00 |
| G-05 | Nombre visible `GFP`; identificador de aplicación `co.gfpsas.gestionfinanciera`. | 2026-10-16 | 00 |
| CA-ID | Los criterios de aceptación se conservan literalmente; se usan identificadores internos `HUx-CAyy` solo para organizar pruebas y trazabilidad. | 2026-10-16 | 00 |

## Discrepancias documentadas

| ID | Discrepancia | Estado |
|---|---|---|
| C-01 | El documento de historias de usuario (§2.1) indica que en la fase MVP no se contempla la generación y entrega de un APK instalable. La propuesta comercial, la propuesta VF y la decisión DT-01 establecen el APK como entregable. Según Juan, la redacción del documento de historias responde a una consideración académica de flexibilidad ante la evaluación. **Alcance documental académico:** demostración desde el entorno de desarrollo. **Objetivo técnico del proyecto:** APK instalable y validado (DT-01). El documento de historias no se modifica. | Abierta hasta su formalización documental; no reduce el objetivo técnico. |

## Entorno de validación confirmado (G-02)

Evidencia aportada por Juan el 2026-10-16 (Windows):

| Componente | Valor |
|---|---|
| Node / npm | 24.22.0 / 12.2.0 |
| Java global | Microsoft OpenJDK 25.0.4.1 (sin cambios) |
| JDK para GFP | Microsoft OpenJDK 17.0.20.1 — `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` (se usa solo en el proceso de compilación) |
| ANDROID_HOME | `C:\Users\juanz\AppData\Local\Android\Sdk` |
| build-tools | 37.0.0 (requerida por la plantilla) y 36.0.0 |
| NDK | 27.1.12297006 (requerida por la plantilla) y 28.2.13676358 |
| CMake | 3.22.1 |
| Plataformas | android-29, android-35, android-36, android-37.0 |
| Licencias SDK | Aceptadas |
| Emulador | `Pixel_4_Android_10`: API 29, x86, Google Play, WHPX disponible |
| Rutas largas | `LongPathsEnabled = 1` |

Motivo del JDK 17: `@react-native/gradle-plugin` 0.87.1 fija `jvmToolchain(17)` y
`sourceCompatibility = JavaVersion.VERSION_17` para los módulos Android
(`JdkConfiguratorUtils.kt`). La guía oficial de React Native recomienda JDK 17.

## Observaciones registradas para etapas futuras (sin decisión tomada)

| Observación | Etapa |
|---|---|
| La plantilla declara el permiso `INTERNET` (necesario para Metro en desarrollo). Si debe mantenerse en el APK final se decide con la seguridad de la Etapa 02 o en la Etapa 13. | 02 / 13 |
| La plantilla firma la variante release con la clave de depuración. La clave de firma definitiva es la decisión E13-D1. | 13 |
| El diagrama C4 Nivel 3 incluye los componentes "Sincronización Local" (Servicios) y "Generación de Reportes" (Análisis). Su alcance se interpreta con las historias de usuario y las exclusiones (sin sincronización entre dispositivos ni exportación); se revisará al implementar las etapas afectadas. | 02 / 11 |
