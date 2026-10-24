# RAMA EXPERIMENTAL — NO INTEGRAR NI PUBLICAR

Rama `spike/02-compatibilidad`: pruebas de concepto de la Etapa 02 de GFP (SQLCipher,
Android Keystore, PBKDF2-HMAC-SHA256, cámara/galería y OCR). Base: `e10cebf`.

- Esta rama **nunca** se integra en `main` ni se publica. Los APK (`versionName 1.0-poc`)
  son experimentales y no sustituyen a ningún APK aprobado.
- La pantalla de pruebas también se ejecuta en Release **solo en esta rama**.
- Solo datos sintéticos. No se versionan imágenes, evidencias, registros ni copias de bases.
- Las acciones destructivas (desinstalar, `adb uninstall -k`, `pm clear`, borrar datos o
  archivos del dispositivo, limpiar logcat, quitar el worktree o referencias) requieren
  autorización individual y no están automatizadas.
- Los parámetros de PBKDF2, la normalización Unicode, `Tmax` y los umbrales de OCR **no
  están aprobados**.

## Ejecución (solo con autorización expresa)

Desde un worktree en modo detached del commit entregado:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\poc-stage02.ps1 -ExpectedCommit <hash> -CheckOnly
powershell -ExecutionPolicy Bypass -File scripts\poc-stage02.ps1 -ExpectedCommit <hash> -OcrImageFolder <carpeta externa con las imágenes sintéticas>
```

- Evidencias en bruto: `..\GFP-spike02-evidencias\<fecha>-<commit>\` (fuera de los
  repositorios; parámetro `-EvidenceRoot`). Nunca se sobrescriben archivos existentes.
- El script comprueba el commit, el estado del worktree y del repositorio principal (solo
  lectura) y el SHA-256 de los APK de la Etapa 01 al inicio, tras compilar y al final.
- Instala con `adb install -r` solo si la firma y el `versionCode` de la app instalada son
  compatibles (`apksigner`, `aapt2`); pide confirmación antes de instalar y de reiniciar.
- Resultados: `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `INFO` (`summary.md`, `results.json`).

## Protocolo de logs v2

`GFP-POC|v2|<runId>|<seq>|<step>|<test>|<code>|<status>|<detail>`

`runId` nuevo en cada arranque de la pantalla; `seq` consecutivo desde 1; `status` en
`OK|FAIL|INFO|BLOCKED`. Un hueco en `seq` invalida la evidencia (`BLOCKED`). Las líneas se
guardan por paso (`steps\<runId>-<step>-<n>.txt`) y por ejecución (`runs\`).

## Cobertura: Jest frente a Android

| Comportamiento | Jest | Android |
|---|---|---|
| Vectores PBKDF2 con @noble/hashes | Sí (V8) | Sí (Hermes) |
| Flujo y estados de P1/P1b con base falsa con estado | Sí (simulación) | — |
| Cifrado real, clave cruda, rechazo de clave incorrecta, archivos en disco | No | Sí |
| Keystore, persistencia entre arranques, actualización, reinicio | No | Sí |
| Contrato de `secureRandomBytes` (errores, longitudes, base64 estricto) | Sí (módulo simulado) | Sí (módulo real) |
| Calidad de `SecureRandom` | No | No: se basa en la revisión del código de la dependencia |
| ML Kit, galería, cámara | No | Sí |
| Métricas de OCR, ausencia de texto/URI/secretos en logs | Sí | Sí (análisis de privacidad) |

Las simulaciones de Jest no son evidencia de seguridad de la plataforma.

## Generador seguro

`secureRandomBytes()` llama directamente al TurboModule `RNGetRandomValues`
(`react-native-get-random-values@2.0.0`, `SecureRandom` en Android) y valida tipo, longitud
y base64 estricto. No importa el punto de entrada JS del paquete (contiene un respaldo con
`Math.random`), no tiene respaldo y ESLint prohíbe `Math.random` en `src/poc`. Sin módulo:
P2 no guarda secreto, P3 marca la sal como `BLOCKED` y P1b queda `BLOCKED`.

## Clave incorrecta (P1 y P1b)

1. Primer arranque: crea `poc-p1-wrong-key-v2.db` / `poc-p1b-wrong-key-v2.db` con la clave
   correcta, `journal_mode=DELETE`, marcador sintético y relectura.
2. El script detiene la app, comprueba que no hay `-journal`/`-wal` y calcula el hash.
3. Arranque siguiente: lectura de control con la clave correcta en solo lectura; después
   clave incorrecta fija en solo lectura. `OK` solo con error SQLITE_NOTADB; otro error es
   `BLOCKED`; una lectura correcta es `FAIL`.
4. El script vuelve a calcular el hash: debe ser idéntico.

Las bases de prueba nunca se recrean; una variante nueva usa otro sufijo (`-v3`).

## Control positivo y marcadores

`poc-canary-v2.db` es una base **sin cifrar** con el marcador `GFP-POC-CANARY-<runId>`.
La búsqueda debe encontrarlo solo ahí (si no aparece: `BLOCKED`) y no encontrar en claro
ningún marcador guardado en bases cifradas o en el Keystore. Fuera de alcance: APK,
`/data/misc/keystore` y particiones del sistema.

Cada arranque reescribe el marcador canario y el marcador público de P2, por eso todos los
marcadores (control y protegidos) se toman de la **última** ejecución Debug realizada
(`Select-InspectionRun` en `scripts\poc-stage02.lib.ps1`). Si en esa ejecución falta el
canario o un marcador protegido, `AT-REST` y `MARKER-SEARCH` quedan `BLOCKED`
(`canary_marker_unavailable`, `protected_marker_missing:<prueba>.<código>`) sin recurrir a
ejecuciones anteriores. `at-rest.txt` y `marker-search.txt` registran la ejecución usada.

## P3 extendido: diagnóstico de la espera

La espera tiene dos fases: hasta 600 s para el `step_begin P3_EXTENDED` y, desde ese
momento, hasta 1800 s para el `step_end`. Solo cuentan los eventos posteriores al inicio de
la espera. `PASS` exige `step_end` en la ejecución esperada y V2, V3, V7 y V7D en `OK`.
Motivos de `BLOCKED` (detalle con `runId`, tiempo transcurrido y último evento):

| Motivo | Situación |
|---|---|
| `not_started` | sin `step_begin` en la ejecución esperada |
| `timeout` | `step_begin` sin `step_end`, proceso vivo |
| `step_end_missing` | `step_begin` sin `step_end`, proceso terminado |
| `interrupted` | `step_begin` sin `step_end` y una ejecución más reciente |
| `runid_mismatch` | el paso se ejecutó en otra ejecución más reciente |
| `incomplete_block` | `step_end` sin `step_begin` (posible pérdida de log) |
| `missing_vectors` / `step_error` | paso terminado sin todos los vectores o con error |
| `missing_result` / `result_mismatch` | sin `conformance_result` o en desacuerdo con los vectores |

Resultado y bloque completo en `p3-extended.txt`. Los mismos motivos se aplican a
`P3_BENCHMARK` y `P4_BATCH`.

## V4 · Defectos de la ejecución V3, causas y cambios

**Evidencia automatizada frente a evidencia de dispositivo.** Las pruebas de esta sección
usan relojes y registros sintéticos (Jest y PowerShell). Demuestran la lógica de decisión
del protocolo; no demuestran rendimiento, cifrado ni OCR en Android. Los tiempos citados son
de la ejecución V3 en `emulator-5556` (API 29) y no se generalizan a dispositivos físicos.

### P3 · Duración excesiva

- **Defecto.** El paso único `P3_EXTENDED` no terminó en 1800 s y el proceso seguía vivo.
- **Causa raíz.** El paso encadenaba los cuatro vectores de conformidad (unos 1230 s en el
  emulador: V2 166 s, V3 549 s, V7 312 s, V7D 203 s) y un benchmark sin límite de 12
  derivaciones (100k, 210k, 310k y 600k, tres veces cada una; unos 1390 s estimados con la
  velocidad medida de 0,38 ms por iteración). Cada derivación bloquea el hilo JS y la
  pantalla mantiene los botones deshabilitados hasta el final, así que el paso ocupaba la
  app y la ventana de espera del protocolo.
- **Cambio.** Dos pasos separados:
  - `P3_EXTENDED` («P3 · V2, V3, V7 y V7D»): solo conformidad criptográfica. Vectores,
    entradas, sales, iteraciones y longitudes **sin cambios**; registra `vector_start`
    antes de cada vector y un `conformance_result` final.
  - `P3_BENCHMARK` («P3 · Tiempos PBKDF2»): medición con presupuesto explícito de 900 s
    (`BENCHMARK_BUDGET_MS`), hasta 3 muestras por tamaño en pasadas sucesivas (primero una
    muestra de cada tamaño). Antes de cada muestra estima su duración con la peor velocidad
    observada y no la inicia si excede el presupuesto restante (`benchmark_skipped`).
    Registra cada muestra (`benchmark_sample`), el resumen por tamaño (`benchmark`) y un
    `benchmark_result` final con `outcome=complete|incomplete|error`, motivo, muestras,
    tiempo y pendientes. `BENCHMARK_ITERATIONS` no cambia.
- **Por qué conserva el valor de las pruebas.** La conformidad sigue comprobando los ocho
  vectores originales y no depende del benchmark. El benchmark sigue midiendo los mismos
  tamaños candidatos; si el presupuesto no alcanza, el resultado queda `BLOCKED`
  (`benchmark_incomplete`) con los datos parciales, nunca `PASS`. Una derivación en curso no
  se puede interrumpir: el presupuesto evita empezar muestras que previsiblemente lo
  exceden. Ninguna cantidad de iteraciones se da por adecuada para producción.

### P4 · Cierre del lote no reconocido

- **Defecto.** `P4-BATCH` quedó `BLOCKED` («sin step_end P4_BATCH en 900 s») aunque los
  registros finales del mismo `runId` contenían `step_begin`, seis `ocr_result`,
  `batch_summary` (images=6, failures=0) y `step_end`.
- **Causa raíz (código).** La comparación de `runId` y `step_end` era correcta. La espera
  de P4 empezaba cuando terminaba la de P3 (1800 s), pero P3 seguía ejecutándose: la app
  deshabilita todos los botones mientras un paso está activo y el hilo JS queda bloqueado
  en cada derivación. Los 900 s de P4 se consumían antes de que el lote pudiera empezar; el
  lote se ejecutó después y solo apareció en la recogida final de registros. Además, el
  veredicto «sin step_end» no distinguía «no empezó» de «empezó y no terminó».
- **Confirmación pendiente.** La secuencia exacta (`seq` del `step_end` de P3 anterior al
  `step_begin` de P4 en `runs\R3-<runId>.txt`) no se ha verificado sobre las evidencias de
  V3 desde esta copia.
- **Cambio.** Antes de cada paso manual, `Wait-AppIdle` espera (hasta 1800 s) a que no haya
  ningún paso abierto (`Get-OpenStep`); si sigue ocupado, `BLOCKED`
  (`previous_step_running`). `P4_BATCH` usa la espera en dos fases y `Get-BatchVerdict`:
  `PASS` solo con `step_end` de la ejecución esperada, sin `FAIL`/`BLOCKED` en el bloque y
  con un `batch_summary` coherente con los `ocr_result` registrados (`summary_mismatch` si
  no). Las entradas se deduplican por `runId|seq` y se ordenan por `seq`.
- **Reconciliación final.** Si un paso termina después de su ventana, el resultado en vivo
  se conserva y se añade un `INFO` `<check>-LATE` con el veredicto calculado sobre la
  evidencia final (`late-completions.txt`). Nunca sustituye al resultado original.

### Pruebas automatizadas V4 (sin dispositivo)

| Prueba | Resultado |
|---|---|
| TypeScript, ESLint, Prettier | PASS |
| Jest completo (5 ejecuciones `--runInBand` y 1 en paralelo) | PASS, 77/77, sin avisos |
| `App.test.tsx` con CPU saturada | PASS |
| P3: vectores sin cambios, conformidad, benchmark completo, regresión V3, presupuesto, error | PASS (Jest) |
| Protocolo PowerShell (P3, benchmark, P4, pasos abiertos, regresión V3) en PowerShell 7.5.4 | PASS, 34/34 |
| Mutaciones (sin deduplicar, sin coherencia del resumen, incompleto como PASS, BLOCKED ignorado, sin presupuesto) | detectadas |
| Protocolo PowerShell en Windows PowerShell 5.1 | NOT RUN (no disponible en el entorno de V4) |
| Protocolo completo, builds Android, emulador | NOT RUN (fuera de esta fase) |

### Pendiente en dispositivo y riesgos abiertos

- Repetir en el emulador existente: D1–D3 (`AT-REST`, `MARKER-SEARCH`), `P3_EXTENDED`,
  `P3_BENCHMARK` y `P4_BATCH`. La cámara física sigue sin validar.
- Rendimiento de PBKDF2 con `@noble/hashes` en Hermes: lento en el emulador; sin medición en
  dispositivo físico. Tmax, número de iteraciones y política de normalización Unicode
  siguen pendientes de decisión.
- Una derivación larga bloquea la interfaz; el presupuesto no puede interrumpirla.
- 55 vulnerabilidades de npm audit sin tratar; umbral de calidad OCR pendiente.

## Pruebas del protocolo (sin dispositivo)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\tests\poc-stage02.lib.Tests.ps1
```

Ejecutor propio en PowerShell, sin dependencias (Windows PowerShell 5.1 o PowerShell 7);
termina con código 1 si alguna prueba falla.

## SQLite estándar (opcional)

Si hay `sqlite3.exe` o `python`, se abre una copia aislada (`.D`) en solo lectura: el
control en claro debe abrirse y la copia cifrada debe dar `file is not a database`. Sin
herramienta: `NOT RUN`. Procedimiento manual equivalente:
`sqlite3 -readonly <copia> "SELECT count(*) FROM sqlite_master;"`.

## P3 · Vectores fijados antes de las pruebas

| Id | Contraseña (UTF-8) | Sal | Iteraciones | Bytes | Esperado |
|---|---|---|---|---|---|
| V3 | `GFP-POC-V3-contrasena` | `GFP-POC-V3-sal-0001` | 600000 | 32 | `1b91267173e194ddf291adf386f7e7c773ea05482c57e218be3c193a90b43eed` |
| V7 | `contraseña-ñ€✓` (NFC, `636f6e7472617365c3b1612dc3b1e282ace29c93`) | `sal-ñ-0001` (NFC) | 600000 | 32 | `4cff0013b242c0afbee327b6bfc8a603e3171e9073794380051563880abb066f` |
| V7D | mismo texto en NFD (`636f6e74726173656ecc83612d6ecc83e282ace29c93`) | `sal-ñ-0001` (NFD) | 600000 | 32 | `4174819fd6e3923b2980f788f4dcc757c8a74c65f5aef94cc2e742930d92eb15` |

V7 y V7D coinciden en Node 22.23 (`crypto`), Python 3.10 (`hashlib`) y @noble/hashes 2.4.0.
Que den resultados distintos muestra que la política de normalización está pendiente.

## OCR (P4)

Solo imágenes sintéticas generadas desde `app/src/poc/ocrFixtures.ts`
(`tools/ocr-fixtures/`), guardadas fuera de los repositorios. Se registran únicamente
métricas (duración, caracteres, bloques, líneas, presencia de campos, recuperación de
fichas, similitud); nunca texto, URI, rutas, nombres de archivo ni mensajes nativos. Mide
**reconocimiento**, no extracción de importes, fechas o comercios. Sin umbrales aprobados.

## Limpieza pendiente de autorización

Imágenes en `/sdcard/Android/data/co.gfpsas.gestionfinanciera/files/ocr-dataset/` y en
`/sdcard/Pictures/GFP-POC-SINTETICAS/`, datos de la app del spike, el worktree y las
referencias `refs/revision/*`. Las evidencias externas se conservan hasta el cierre.
