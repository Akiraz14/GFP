# Resumen de validacion - Etapa 01

- Ejecucion: 20261019-194120
- Ejecutado por: juanz en AKIRAZ-LT
- Pasos con fallo: 1

| Paso | Resultado | Detalle |
|---|---|---|
| JDK 17 para este proceso | OK | C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot |
| ANDROID_HOME | OK | C:\Users\juanz\AppData\Local\Android\Sdk |
| Gradle -version (debe indicar Launcher JVM 17) | OK | ver gradle-version.log |
| Gradle se ejecuta con JDK 17 | OK | Launcher JVM 17 |
| npm ci | OMITIDO | parametro -OmitirNpmCi |
| Chequeo de tipos (tsc) | OK | ver typecheck.log |
| Lint (ESLint) | OK | ver lint.log |
| Formato (Prettier) | FALLO | codigo 1, ver format.log |
| Pruebas (Jest) | OK | ver jest.log |
| Compilacion assembleDebug | OK | ver gradle-assembleDebug.log |
| APK de depuracion generado | OK | SHA256 8EB6D5A0D3317A852ACA7A0A560459E579F25BBD1238B90388CED32BF39B395E (125.59 MB) |
| Dispositivo Android 10 (API 29) o superior | OK | emulator-5554, API 29, x86 |
| Puerto 8081 libre antes de Metro | OK | sin proceso en escucha |
| Metro en ejecucion | OK | listo en 5 s (http://localhost:8081/status) |
| Instalacion APK de depuracion | OK | ver instalar-debug.log |
| App en ejecucion (debug) | OK | PID 9291 |
| Interfaz muestra 'GFP' (debug) | OK | ver ui-debug.xml y captura-debug.png |
| Logcat sin errores fatales ni de JS (debug) | OK | ver logcat-debug.txt |
| Cierre de Metro | OK | puerto 8081 libre (metro-cierre.txt) |
| Compilacion assembleRelease | OK | ver gradle-assembleRelease.log |
| APK release generado | OK | SHA256 D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05 |
| Dispositivo disponible para release | OK | emulator-5554 |
| Instalacion APK release | OK | ver instalar-release.log |
| App en ejecucion (release) | OK | PID 9625 |
| Interfaz muestra 'GFP' (release) | OK | ver ui-release.xml y captura-release.png |
| Logcat sin errores fatales ni de JS (release) | OK | ver logcat-release.txt |
