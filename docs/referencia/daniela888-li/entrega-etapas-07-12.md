# Entrega de las Etapas 07 a 12 para revisión

**Fecha:** 2026-11-04  
**Commit base:** `d6c1713` de `main`  
**Ramas:** una por etapa, encadenadas de `e07/hu4-movimientos` a `e12/hu10-recomendaciones`, más `fix/navegacion-cierre-sesion`, entregadas por el fork `daniela888-li/GFP`  
**Estado:** propuesta para revisión. Nada está aprobado ni integrado en `main`.

## Qué incluye

| Etapa | Historia | Cierre | Validación | Decisiones |
|---|---|---|---|---|
| 07 | HU4 | `cierre-etapa-07.md` | `validacion/etapa-07-pruebas-dispositivo.md` | `decisiones-etapa-07.md` |
| 08 | HU5 | `cierre-etapa-08.md` | `validacion/etapa-08-pruebas-dispositivo.md` | `decisiones-etapa-08.md` |
| 09 | HU6 | `cierre-etapa-09.md` | `validacion/etapa-09-pruebas-dispositivo.md` | `decisiones-etapa-09.md` |
| 10 | HU7 | `cierre-etapa-10.md` | `validacion/etapa-10-pruebas-dispositivo.md` | `decisiones-etapa-10.md` |
| 11 | HU9 | `cierre-etapa-11.md` | `validacion/etapa-11-pruebas-dispositivo.md` | `decisiones-etapa-11.md` |
| 12 | HU10 | `cierre-etapa-12.md` | `validacion/etapa-12-pruebas-dispositivo.md` | `decisiones-etapa-12.md` |

Cada rama parte de la anterior y debe revisarse e integrarse en ese orden. Los cambios de esta
tabla se separaron después de construirlos juntos, y cada rama pasó las pruebas por sí sola.

## Archivos existentes modificados

Ningún archivo del proyecto se eliminó. Además se modifican `app/package-lock.json`,
`docs/trazabilidad.md` y `docs/plan-etapas.md`.

| Archivo | Cambio |
|---|---|
| `app/__tests__/App.test.tsx` | Servicios de prueba, historial real en lugar de la pantalla provisional y flujos nuevos |
| `app/__tests__/infrastructure/categoryMigration.test.ts` | Versión esperada 5 |
| `app/__tests__/infrastructure/migrator.test.ts` | Versión esperada 5 y tabla `movements` |
| `app/__tests__/presentation/CategoriesScreen.test.tsx` | Prueba nueva del recuento del modal |
| `app/jest.setup.js` | Mocks de cámara y OCR |
| `app/package.json` | Dependencia `react-native-svg` 15.16.0 |
| `app/src/business/categories/categoryManagement.ts` | Reasignación a «Otros» (HU8-CA07c) y `countMovements`; **cambia la lógica de eliminación** |
| `app/src/infrastructure/database/migrations.ts` | Migración 5; las migraciones 1 a 4 no cambian |
| `app/src/infrastructure/database/repositories/categoryRepository.ts` | Solo comentario |
| `app/src/presentation/categories/CategoriesScreen.tsx` | Recuento en el modal de eliminación |
| `app/src/presentation/categories/categoryTexts.ts` | Texto del recuento |
| `app/src/presentation/navigation/AppNavigator.tsx` | Pantallas nuevas, barras, Atrás, Adelante y Cerrar sesión; **cambio mayor** |
| `app/src/presentation/navigation/routes.ts` | Rutas marcadas como implementadas |
| `app/src/presentation/screens/ProvisionalScreen.tsx` | Solo comentario |
| `app/src/services/appServices.ts` | Servicios de movimientos y comprobantes |
| `app/src/services/nativeAppServices.ts` | Conexión de esos servicios |

## Puntos que requieren decisión

1. Aprobar `react-native-svg` 15.16.0, dependencia nativa nueva.
2. Revisar `categoryManagement.ts`, porque cambia la eliminación de categorías aprobada en E06.
3. Decidir las propuestas de las Etapas 07 a 12.
4. Decidir si el título y el mensaje con la palabra «registrado» se conservan.
5. Aprobar la barra superior y el botón Cerrar sesión (E13-D2, E13-D3).

## Verificación

Jest 34 suites y 494 pruebas, `typecheck`, `lint` y `format:check` pasaron en Linux sobre `fix/navegacion-cierre-sesion`. No se ejecutaron los scripts de `scripts/stage-04/`.
