# Cierre del proyecto GFP

**Fecha:** 2026-11-07  
**Rama principal:** `main`, desde `1d1925f`  
**Estado:** ajustes finales y recomendaciones finalizados, validados manualmente por el responsable
en Android 10 e integrados en `main`. El APK Release final se registra en la sección 4.

## 1. Estado

| Elemento | Estado | Detalle |
|---|---|---|
| AJ-01 a AJ-05 | Finalizados | `ajustes-finales.md`; E-AJ-D1 y E-AJ-D2 aprobadas |
| Recomendaciones (R1–R8 y Consejo de Ahorro) | Finalizadas | `recomendaciones-ampliadas.md`; E-REC-D1 aprobada, E-REC-C1 a C6 aceptados |
| Pruebas manuales REC-V1 a REC-V12 | Aprobadas por el responsable (manual, Android 10, emulador Pixel 4, 2026-11-07) | `recomendaciones-ampliadas.md`, sección 6 |
| Evidencias | Organizadas fuera del repositorio | `GFP-evidencias\recomendaciones\` (33 capturas, `SHA256SUMS.txt`) y `GFP-evidencias\ajustes-finales\` |

## 2. Reglas de recomendaciones implementadas

| Regla | Condición | Prioridad o convivencia |
|---|---|---|
| R8 Sin ingresos registrados | Mes actual sin ingresos y con gastos | Reemplaza a R1 |
| R1 Balance Negativo | Ingresos > 0 y gastos ≥ ingresos | Excluye R6 y el Consejo de Ahorro; convive con R7 |
| R6 Alerta temprana de gasto | 80 % ≤ gastos / ingresos < 100 % | Excluye el Consejo de Ahorro |
| Consejo de Ahorro | Ingresos > 0, balance positivo y sin R6 | — |
| R2 Categoría Crítica | Una categoría > 50 % de los gastos del mes | Sin exclusiones |
| R3 ¡Alerta de Gastos Altos! | Gasto de la categoría > 130 % del mes anterior completo | Sin exclusiones |
| R4 Gasto reducido | Reducción > 30 % en períodos equivalentes | Convive con R5; una tarjeta, otras categorías desplegables |
| R5 Hábito estable | Variación ≤ 10 % en períodos equivalentes | Convive con R4; una tarjeta, otras categorías desplegables |
| R7 Ingresos menores que el mes anterior | Disminución > 20 % en períodos equivalentes | Convive con R1 |

Íconos, colores, acciones y criterios de implementación en `recomendaciones-ampliadas.md`.

## 3. Verificaciones técnicas finales

| Verificación | Entorno | Resultado |
|---|---|---|
| TypeScript (`tsc --noEmit`) | Claude, copia del árbol final | 0 errores |
| ESLint | Claude, copia del árbol final | 0 errores ni avisos |
| Prettier (`--check`) | Claude, copia del árbol final | Todos los archivos con formato |
| Jest | Claude, copia del árbol final | 39 suites, 705 pruebas aprobadas |
| Jest | Windows, responsable (`GFP-evidencias\recomendaciones\build\jest.log`) | 39 suites, 705 pruebas aprobadas |
| Compilación Debug (`Invoke-AndroidBuild.ps1`) | Windows, responsable, 2026-11-07 10:22 (`1d1925f` con estos cambios sin confirmar) | 4 PASS, 0 FAIL; APK Debug `1592C4151B479B0BBA2E363E201EDA8C27E46EAC7E9821CD7ABC6EA1F78D9795` |
| Pruebas manuales REC-V1 a REC-V12 | Android 10, emulador Pixel 4, responsable | APROBADO |

## 4. APK Release final

| Dato | Valor |
|---|---|
| Archivo | `GFP-Android-Release-v1.0.apk` |
| Ubicación | `C:\Users\juanz\Akiraz\Study\GFP Proyecto\entregables\` (fuera del repositorio: `*.apk` no se versiona) |
| Versión | `versionName` 1.0, `versionCode` 1 (`app/android/app/build.gradle`, sin cambios) |
| Paquete | `co.gfpsas.gestionfinanciera` |
| SDK | `minSdkVersion` 29 (Android 10), `targetSdkVersion` 36 |
| Tipo | Release, no depurable, con `assets/index.android.bundle` (no necesita Metro) |
| Firma | Clave propia `gfp-release` (D-06) en `%USERPROFILE%\.gfp-release\gfp-release.jks`, esquema v2; certificado SHA-256 `c7239744262234f2fffc0930487925f805a3bf00cfd83eb53a3b6f6d0cdf416e` (el mismo del Release del 2026-11-06, así que las actualizaciones conservan los datos) |
| Generación | `scripts\release\Invoke-ReleaseBuild.ps1` (pide las contraseñas sin mostrarlas) |

Instalación en el teléfono, actualización sin perder datos y registros: `guia-instalacion-ejecucion.md`,
sección 6.
