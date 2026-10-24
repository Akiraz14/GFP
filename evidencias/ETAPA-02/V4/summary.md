# Spike Etapa 02 - resumen de ejecucion

- Fecha: 2026-10-23T17:42:01.8682546-05:00
- Commit: 6caa2acc882965d68a37f87992c0a6136c7db4fa
- Worktree: C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-spike02-v4
- Dispositivo: emulator-5554 (emulador)
- Modo: completo
- Acciones destructivas automatizadas: ninguna

| Comprobacion | Resultado | Detalle | Evidencia |
|---|---|---|---|
| PRE-WORKTREE | PASS | HEAD=6caa2acc882965d68a37f87992c0a6136c7db4fa limpio; detached=True |  |
| PRE-MAIN-REPOSITORY | PASS | repositorio principal en e10cebf31b29fffcc783b0817724ed34308a39c8 (solo lectura) | main-repository-start.txt |
| INTEGRITY-STAGE01-START | PASS | Debug Etapa 01: intacto; Release Etapa 01: intacto | stage01-apk-sha256.txt |
| PRE-TOOLS | PASS | sqlite3=True python=True | tools.txt |
| PRE-PBKDF2-VECTORS | PASS | Node y .NET reproducen V3, V7 y V7D; Node reproduce todos | pbkdf2-vectors.txt |
| PRE-OCR-IMAGES | PASS | 6 imagenes sinteticas con hash verificado |  |
| ENV-JDK17 | PASS | C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot |  |
| NPM-CI | NOT RUN | parametro -SkipNpmCi |  |
| QUALITY-TSC | PASS | exit 0 (Jest valida logica con simulaciones, no comportamiento nativo) | typecheck.log |
| QUALITY-ESLINT | PASS | exit 0 (Jest valida logica con simulaciones, no comportamiento nativo) | lint.log |
| QUALITY-PRETTIER | PASS | exit 0 (Jest valida logica con simulaciones, no comportamiento nativo) | format.log |
| JEST-LOGIC | PASS | exit 0 (Jest valida logica con simulaciones, no comportamiento nativo) | jest.log |
| BUILD-DEBUG | PASS | SHA256 E0994C87C6CBE0D88CE283D698F9CA278E9E69A286923819FFCA1E0BCC2253A8; 206057044 bytes | apk-spike.txt |
| APK-DEBUG-INFO | INFO | ABI=arm64-v8a,armeabi-v7a,x86,x86_64; ML Kit/OCR comprimido=44817075 bytes; permisos=android.permission.INTERNET,android.permission.USE_BIOMETRIC,android.permission.USE_FINGERPRINT,android.permission.SYSTEM_ALERT_WINDOW,android.permission.ACCESS_LOCAL_NETWORK,co.gfpsas.gestionfinanciera.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION,android.permission.ACCESS_NETWORK_STATE | permissions-debug.txt |
| BUILD-RELEASE | FAIL | exit 1 | gradle-assembleRelease.log |
| INTEGRITY-STAGE01-AFTER-BUILD | PASS | Debug Etapa 01: intacto; Release Etapa 01: intacto | stage01-apk-sha256.txt |
| APK-CERT-MATCH | PASS | Debug y Release firmados con fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c | apk-spike.txt |
| DEVICE | INFO | emulator-5554 emulador API 34 | device.txt |
| PRE-INSTALLED-APP | PASS | misma firma y versionCode compatible (1) | apk-spike.txt |
| METRO | PASS | Metro listo |  |
| RUN-D1-start | PASS | rmvlhxh66 sin FAIL ni BLOCKED (pid  -> 17492) | steps\rmvlhxh66-AUTO-1.txt |
| RUN-D2-force-stop | PASS | rmvlhxzxt sin FAIL ni BLOCKED (pid  -> 17655) | steps\rmvlhxzxt-AUTO-1.txt |
| RUN-D3-back | PASS | rmvlhyhf8 sin FAIL ni BLOCKED (pid  -> 17794) | steps\rmvlhyhf8-AUTO-1.txt |
| P1-WRONG-KEY | PASS | 3 verificaciones: control OK, clave incorrecta rechazada (NOTADB), hash identico | wrong-key-hashes.txt |
| P1B-WRONG-KEY | PASS | 3 verificaciones: control OK, clave incorrecta rechazada (NOTADB), hash identico | wrong-key-hashes.txt |
| AT-REST | PASS | 6 archivos: copias A=B=C=original, sin cabecera ni marcadores en claro; control positivo legible | at-rest.txt |
| MARKER-SEARCH | PASS | control positivo solo en poc-canary-v2.db; 5 marcadores protegidos sin coincidencias | marker-search.txt |
| P1-SQLITE-STANDARD | PASS | SQLite estandar abre el control y rechaza la copia cifrada (file is not a database) | sqlite-standard.txt |
| RUN-R1-variant-switch | PASS | rmvlir8s6 sin FAIL ni BLOCKED (pid  -> 18675) | steps\rmvlir8s6-AUTO-1.txt |
| RELEASE-LOGS | PASS | diagnostico disponible en Release (rmvlir8s6) |  |
| RUN-R2-update | PASS | rmvliro7t sin FAIL ni BLOCKED (pid  -> 18808) | steps\rmvliro7t-AUTO-1.txt |
| RUN-R3-reboot | PASS | rmvljbhq6 sin FAIL ni BLOCKED (pid  -> 5580) | steps\rmvljbhq6-AUTO-1.txt |
| SCN-FORCE-STOP | PASS | rmvlhxzxt: P1, P1B y P2 persisten; misma huella | steps\rmvlhxzxt-AUTO-1.txt |
| SCN-CLOSE-REOPEN | PASS | rmvlhyhf8: P1, P1B y P2 persisten; misma huella | steps\rmvlhyhf8-AUTO-1.txt |
| SCN-VARIANT-SWITCH | PASS | rmvlir8s6: P1, P1B y P2 persisten; misma huella | steps\rmvlir8s6-AUTO-1.txt |
| SCN-UPDATE | PASS | rmvliro7t: P1, P1B y P2 persisten; misma huella | steps\rmvliro7t-AUTO-1.txt |
| SCN-REBOOT | PASS | rmvljbhq6: P1, P1B y P2 persisten; misma huella | steps\rmvljbhq6-AUTO-1.txt |
| SCN-UNINSTALL-REINSTALL | NOT RUN | destructivo: no autorizado en esta etapa |  |
| SCN-UNINSTALL-KEEP-DATA | NOT RUN | adb uninstall -k excluido por decision |  |
| P1-CIPHER | PASS | OK en 6 ejecuciones (Debug y Release) |  |
| P1-READ-WRITE | PASS | OK en 6 ejecuciones (Debug y Release) |  |
| P1B-CIPHER | PASS | OK en 6 ejecuciones (Debug y Release) |  |
| P1B-READ-WRITE | PASS | OK en 6 ejecuciones (Debug y Release) |  |
| P3-BASIC-SALT | PASS | OK en 6 ejecuciones (Debug y Release) |  |
| P2-KEYSTORE-CAPABILITY | INFO | nivel maximo soportado declarado por react-native-keychain: SECURE_SOFTWARE; no demuestra el respaldo por hardware de la clave usada |  |
| P3-BASIC-VECTORS | PASS | 24 calculos de V1, V4, V5 y V6 correctos en Hermes |  |
| RNG-NATIVE | INFO | el secreto ya existia; la generacion no se observo en estas ejecuciones |  |
| P3-EXTENDED-VECTORS | PASS | complete: 4 vectores OK; vectors=4;failed=0; runId=rmvljbhq6; elapsedS=265; last=rmvljbhq6#44 P3_EXTENDED/STEP/step_end/INFO (emulador) | p3-extended.txt |
| P3-BENCHMARK | PASS | complete: outcome=complete;reason=all_samples;samples=12/12;elapsedMs=435400;budgetMs=900000;pending=none; runId=rmvljbhq6; elapsedS=444; last=rmvljbhq6#65 P3_BENCHMARK/STEP/step_end/INFO / iterations=100000;samples=3;medianMs=11836;runsMs=12455/11778/11836 / iterations=210000;samples=3;medianMs=24665;runsMs=26174/24303/24665 / iterations=310000;samples=3;medianMs=37146;runsMs=38638/35609/37146 / iterations=600000;samples=3;medianMs=70889;runsMs=71690/70073/70889 (emulador) | p3-benchmark.txt |
| P4-BATCH | PASS | complete: ocrResults=6; images=6;failures=0;p50Ms=543;p95Ms=3497; runId=rmvljbhq6; elapsedS=22; last=rmvljbhq6#81 P4_BATCH/STEP/step_end/INFO; calidad sin umbral aprobado (INFO) | p4-batch.txt |
| P4-QUALITY | INFO | index=01;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=1;similarity=1 / index=02;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=0.962;similarity=0.99 / index=03;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=1;similarity=0.355 / index=04;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=0.962;similarity=0.995 / index=05;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=1;similarity=1 / index=06;fieldMerchant=1;fieldDate=1;fieldTotal=1;fieldCurrency=1;fieldDocument=1;tokenRecall=1;similarity=0.995 | p4-batch.txt |
| P4-GALLERY | PASS | ocr_result (reconocimiento, no extraccion de campos) | steps\rmvljbhq6-P4_GALLERY-1.txt |
| P4-CAMERA | PASS | ocr_result (reconocimiento, no extraccion de campos) | steps\rmvljbhq6-P4_CAMERA-1.txt |
| PRIVACY-SCAN | PASS | 17 archivos sin exposiciones ni casos ambiguos | sensitive-scan.md |
| INTEGRITY-STAGE01-END | PASS | Debug Etapa 01: intacto; Release Etapa 01: intacto | stage01-apk-sha256.txt |
| MAIN-REPOSITORY-UNCHANGED | PASS | HEAD, estado y referencias identicos al inicio | main-repository-end.txt |
| WORKTREE-UNCHANGED | PASS | sin cambios |  |
| DESTRUCTIVE-ACTIONS | INFO | ninguna automatizada; limpieza pendiente de autorizacion (ver cleanup-pending.txt si existe) |  |
