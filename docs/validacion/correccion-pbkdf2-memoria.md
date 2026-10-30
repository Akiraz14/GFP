# Corrección del consumo de memoria de PBKDF2 en Android (`fix/pbkdf2-memory`)

**Estado (2026-10-30): corrección validada en emuladores Android 10 y 14; pendiente de revisión
del responsable, sin integrar en `main` y sin validación en un dispositivo físico.**

Este documento registra la corrección y su validación sobre el commit
`4d9b63279b7b5f3eec1716d716d9f9510a202cad` (rama `fix/pbkdf2-memory`, base `main` `b59948c`). La
decisión técnica está en `docs/decisiones.md`, sección «Nota de implementación de E02-D1». El
diagnóstico completo (experimentos E1 a E3) está en la rama `e04/hu2-login-pbkdf2` y no se
reproduce aquí.

Las evidencias están en `GFP-e04-evidencias\`, fuera del repositorio. Horas en UTC−5 salvo que se
indique otra cosa.

## 1. Defecto y corrección

| Aspecto | Detalle |
|---|---|
| Defecto | `Pbkdf2HmacSha256.derive()` calculaba PBKDF2 con `Mac("HmacSHA256")`. En el registro de HU1 se lanzan seis derivaciones de 600 000 iteraciones en paralelo (`Promise.all` en `accountRegistration.ts`, hasta 4 hilos en `GfpCryptoModule`), y la memoria nativa del proceso creció hasta agotarse (`Scudo OOM` y cierre por `lowmemorykiller` en Android 14) |
| Corrección | `derive()` usa `SecretKeyFactory("PBKDF2WithHmacSHA256")` con `PBEKeySpec`. La contraseña UTF-8 se decodifica estrictamente a `char[]` sin pasar por `String`; `PBEKeySpec.clearPassword()` y el borrado del `char[]` se hacen en `finally`. UTF-8 no válido se rechaza con `IllegalArgumentException` |
| Archivos de código | `Pbkdf2HmacSha256.java` (corrección) y `Pbkdf2Calibration.java` (vectores U1 a U8; cinco comprobaciones de rechazo y una de contraseña distinta) |
| Sin cambios | `GfpCryptoModule`, la interfaz JavaScript, `PROVISIONAL_PBKDF2_ITERATIONS`, el esquema de la base y los verificadores guardados |

## 2. Parámetros criptográficos preservados (E02-D1)

PBKDF2-HMAC-SHA256, 600 000 iteraciones provisionales, sal de 16 bytes, clave derivada de 32 bytes,
normalización NFC en JavaScript y el mismo formato de verificador. Los vectores V1, V4 a V7 y U1 a
U8 tienen resultados fijos. Que la implementación corregida los reproduzca indica que los
verificadores creados con la implementación anterior siguen siendo válidos. En la rama de la Etapa 04
se comprobó además la compatibilidad en ambos sentidos entre las dos implementaciones.

## 3. Hechos e inferencias

| Afirmación | Estado | Evidencia |
|---|---|---|
| Con la implementación anterior, seis derivaciones en paralelo agotaron la memoria nativa en emuladores Android 10 y 14 | **Comprobado** en la rama de la Etapa 04 (proceso aislado; 410–561 MB en Android 14 y 1,9–2,0 GB en Android 10) | Diagnóstico de la rama `e04/hu2-login-pbkdf2` |
| La causa interna es que Conscrypt crea un `HMAC_CTX` nativo en cada `doFinal()` y solo lo libera al finalizar el objeto | **Comprobado en el código fuente de AOSP; inferencia en el dispositivo**, porque Conscrypt se actualiza como módulo APEX | Ídem |
| El APK validado contiene la corrección | **Comprobado**: se compiló desde `4d9b632` y los diagnósticos ejecutan `Pbkdf2HmacSha256.derive` del propio APK | Secciones 4.1 y 4.2 |
| Con la corrección, seis derivaciones en paralelo usan menos de 2 MB de memoria nativa | **Comprobado** en emuladores Android 10 y 14 | Sección 4.2 |
| El registro de HU1 ejecuta las seis derivaciones antes de escribir la cuenta | **Comprobado en el código** (`accountRegistration.ts`: `Promise.all` de `createSecretVerifier` antes de la transacción) | — |
| El registro completo no agota la memoria con la corrección | **Comprobado** en emuladores: el registro termina y no hay `Scudo OOM` ni cierres de la app por `lowmemorykiller` | Sección 4.3 |
| El comportamiento será el mismo en dispositivos físicos | **No comprobado** | Sección 6 |

## 4. Pruebas ejecutadas sobre `4d9b632`

- APK Debug: `D0871FB4D56E1B579749CE9D195DC418424FFE16300D120F712676A52DCE98DF`.
- Herramientas: Node v24.22.0, npm 12.2.0, JDK 17.0.20.1.
- Emulador Android 10: `Pixel_4_Android_10`, huella `QSR1.211112.011/13135432`, Gboard 8.0.4.
- Emulador Android 14: `Pixel_4`, huella `UE1A.230829.036.A4/12096271`, Conscrypt 340818082, Gboard 18.5.6.

### 4.1 Windows

| Prueba | Evidencia | Resultado |
|---|---|---|
| `npm ci`, typecheck, lint, formato y Jest | `fix-pbkdf2-static-windows-20261029-083323` | PASS 8/8; Jest 17 suites y 221/221 pruebas |
| `assembleDebug` | `fix-pbkdf2-build-windows-20261029-084422` | PASS 5/5; genera el APK indicado arriba |

### 4.2 Calibración y memoria de PBKDF2 (proceso aislado con el APK corregido)

| Medida | Android 10 (`diag-e3-pbkdf2-fix-emulator-5554-sdk29-20261029-112845`) | Android 14 (`…-sdk34-20261029-121742`) |
|---|---|---|
| Vectores (`Pbkdf2Calibration`) | 13/13 | 13/13 |
| Comprobaciones (cinco rechazos y contraseña distinta) | 6/6 | 6/6 |
| Proveedor de `SecretKeyFactory` | `BC` 1.61 | `BC` 1.68 |
| Mediana de 600 000 iteraciones | 5818 ms | 11 363 ms (de 9548 a 17 649 ms) |
| Memoria nativa con 6 derivaciones en paralelo (inicio → máximo) | 1664 → 1939 KB | 1295 → 1379 KB |
| `Scudo OOM` / cierres por `lowmemorykiller` | 0 / 0 | 0 / 0 |

En Android 14, los tiempos de la calibración (`Pbkdf2Calibration`) fueron muy variables y más lentos
que los de la medición comparativa de la misma ejecución (mediana de 5387–5787 ms). Probablemente el
emulador estaba cargado, pero no está demostrado.

### 4.3 Regresión de HU1 con registro completo (ejecuciones válidas)

En ambas plataformas se ejecutó `Invoke-FixHu1Device.ps1` (revisión 5) con `cold-boot-stable.ps1`:

1. Arranque en frío con `-no-snapshot-load`.
2. Espera de 3 minutos tras `sys.boot_completed=1`.
3. Tres comprobaciones de estabilidad: un solo dispositivo, sin diálogos ni ventanas de ANR y sin ANR nuevos.

La app se desinstaló al inicio de cada ejecución. Los emuladores son desechables.

| Android | Estabilidad | Regresión | Resultado |
|---|---|---|---|
| 14 | `emulator-stability-Pixel_4-20261029-230134` (0 ANR desde el arranque) | `fix-pbkdf2-hu1-device-emulator-5554-20261029-230606` | **PASS 36, FAIL 0, BLOCKED 0** |
| 10 | `emulator-stability-Pixel_4_Android_10-20261029-232440` (0 ANR desde el arranque) | `fix-pbkdf2-hu1-device-emulator-5554-20261029-232935` | **PASS 36, FAIL 0, BLOCKED 0** |

| Grupo de casos | Android 14 | Android 10 |
|---|---|---|
| Instalación limpia y P-D3 (creación de clave y base, reinstalación) | 7/7 | 7/7 |
| E03-V09: clave ausente y clave rechazada (pantalla de error, base intacta, recuperación al restaurar) | 10/10 | 10/10 |
| E03-V06: validación del documento por tipo (CC, CE, PPT y pasaporte) | 8/8 | 8/8 |
| E03-V13: teclado por tipo de documento (numérico para CC, CE y PPT; texto para pasaporte) | 4/4 | 4/4 |
| HU1-CA18 (Cancelar en el paso 2 y formulario vacío al reabrir) | 2/2 | 2/2 |
| HU1-REGISTER (registro completo; seis derivaciones en paralelo) | PASS (22 s) | PASS (15 s) |
| HU1-REGISTER-LOGIN (vuelta a la vista de inicio de sesión) | PASS | PASS |
| REGISTER-MEMORY (`Scudo OOM` y cierres de la app por `lowmemorykiller`) | 0 / 0 | 0 / 0 |
| REGISTER-LOGCAT-PASSWORD (la contraseña de prueba no aparece en logcat) | PASS | PASS |
| LOGCAT (sin `FATAL EXCEPTION`) | PASS | PASS |

En todos los logcat guardados de ambas ejecuciones (antes de V13, antes de cada tipo de documento,
antes y durante el registro y al final) hay 0 líneas `Scudo`, 0 cierres por `lowmemorykiller`, 0 ANR
y 0 `FATAL EXCEPTION`. El estado de Git del worktree no cambió durante las ejecuciones.

### 4.4 Ejecuciones descartadas o fallidas (no cuentan como validación)

| Ejecución | Android | Resultado | Motivo |
|---|---|---|---|
| `fix-pbkdf2-hu1-device-emulator-5554-20261029-113628` | 10 | PASS 36 | Válida para la revisión 1 del script, pero sin arranque en frío; queda sustituida por la sección 4.3 |
| `…-20261029-123420` | 14 | PASS 23, FAIL 6, BLOCKED 1 | La app se cerró antes del registro (entre las 17:40:09 y las 17:40:54 UTC), sin derivaciones PBKDF2 en curso. Causa no determinada: el logcat de ese intervalo se borró y en lo conservado no hay `Scudo OOM` ni cierres por `lowmemorykiller` |
| `…-20261029-133146` | 14 | PASS 32, FAIL 4 | Los 4 FAIL de E03-V13 se deben a que el script no reconocía el nuevo formato de registro de Gboard. El tipo de teclado recibido era el correcto (numérico 0x83002, texto 0x81001) |
| `…-20261029-135429` | 14 | PASS 36 | Sin arranque en frío: el emulador seguía activo desde la ejecución anterior |
| `…-20261029-143817` | 14 | PASS 7, FAIL 10, BLOCKED 1 | Arranque en frío sin estabilización: 11 ANR de procesos del sistema y el aviso «System UI isn't responding» encima de la app durante todo el recorrido. Ningún ANR, `FATAL EXCEPTION` ni `Scudo OOM` de la app |
| `emulator-stability-Pixel_4-20261029-225006` | 14 | Detenida antes de la regresión | Aviso «Process system isn't responding» en la primera comprobación de estabilidad |

Estos problemas son del emulador o de la automatización. No hay evidencia que los atribuya a la
corrección, aunque el cierre de la ejecución `123420` sigue sin causa conocida.

## 5. Automatización (fuera del repositorio)

Los scripts están en `tmp\fix-pbkdf2-validation\`. `lib\Common.ps1` y `lib\DeviceUi.ps1` son
copias sin cambios de la rama de la Etapa 04, y `lib\FixTarget.ps1` exige la rama y el commit de
esta validación.

| Archivo | SHA-256 |
|---|---|
| `Invoke-FixHu1Device.ps1` (revisión 5) | `BEFCEC17EBEB7EC941B8E2E3129897890DAAD2B8DDA3039E8DC0812F2CF2CB36` |
| `cold-boot-stable.ps1` | `C943C8FC838FDC3E049932C866EB7BC95FFBE31E9A5A008F996C16A4F478523B` |
| `lib\Common.ps1` | `E9F96B80EE7EFA2B6D13AF5CD323B5EE760820E086EA963F27EBB899B442AF94` |
| `lib\DeviceUi.ps1` | `4CADC95102BEA7D91E07622F9C0394E80BFC3BB5A8FD52CE7FC6AA4DF6D86E42` |
| `lib\FixTarget.ps1` | `C887709B693664BEEBD89B36CD7F7041C607B394FDE1E85F08AEE931142D18CD` |
| `Invoke-FixStaticChecks.ps1` | `B7EAF0D7943545C22BA79A20D83DE934C9C56F3CCB0A62144995C6847037AD86` |
| `Invoke-FixAndroidBuild.ps1` | `0BDA128307D7483D09C3C7B9EFEB99219DC8B552B6B1088226D38A7158A56A1E` |
| `tmp\e3-pbkdf2-diag\Invoke-Pbkdf2Diagnostic-v2.ps1` | `26C32FE11D8595293E09EAF5225282F46234C7B0C8EF6C1041A554B36B73D1AD` |

Las revisiones 1, 3 y 4 de `Invoke-FixHu1Device.ps1` se conservan junto a la revisión 5. Cambios
entre revisiones:

- La revisión 3 detiene el recorrido si falta un elemento.
- La revisión 4 reconoce el formato de registro de Gboard.
- La revisión 5 distingue entre app cerrada, diálogo del sistema superpuesto, elemento ausente y falta
  de información, y nunca registra PASS en esos casos.

La revisión 1 registraba como PASS `E03-V06-*-LETTERS` y `-DIGITS` aunque el campo no estuviera en
pantalla. La misma lógica, y el mismo lector de Gboard, siguen en
`scripts/stage-04/Invoke-Hu1DeviceRegression.ps1` y `scripts/stage-04/lib/DeviceUi.ps1` de la rama
de la Etapa 04. Ese hallazgo está pendiente de decisión.

## 6. Limitaciones y pendientes

- **Solo emuladores x86/x86_64.** No hay pruebas en un dispositivo físico; P-D1 sigue aplazada.
- **Inicio de sesión no probado en esta rama.** `main` solo tiene la pantalla provisional de HU2. La
  verificación de una contraseña correcta e incorrecta se cubre aquí con los vectores y con la
  comprobación `wrong-password-differs`, no con la interfaz. La prueba de actualización con
  `adb install -r` y el inicio de sesión se ejecutaron en la rama de la Etapa 04, no sobre `4d9b632`.
- **`Scudo OOM` en Android 10 no aporta información.** Android 10 no usa Scudo, así que allí la
  ausencia de memoria agotada se apoya en que no hubo cierres por `lowmemorykiller` y en las
  mediciones de la sección 4.2.
- **Dependencia de BouncyCastle interno de Android.** Su versión (1.61 y 1.68 en estos emuladores)
  cambia con el sistema y debe comprobarse con `Pbkdf2Calibration` en cada versión soportada.
- **Tiempos no representativos.** Los tiempos de derivación medidos en emuladores no sirven para fijar
  las iteraciones definitivas de E02-D1.
- **Cierre sin causa conocida** de la ejecución `123420` (sección 4.4).
