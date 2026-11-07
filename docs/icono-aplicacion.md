# Ícono oficial de la aplicación

**Fecha:** 2026-11-07  
**Fuente:** imagen aprobada por el responsable «Billetera verde con crecimiento financiero»
(billetera verde, billetes, flecha ascendente, gráfica de barras, monedas doradas, arco verde y
botón de cierre). Es un archivo fuente del proyecto y, como los demás, no se versiona en el
repositorio (`README.md`).

## 1. Método

No se rediseñó el logo: los recursos se obtuvieron de la propia imagen aprobada, sin redibujar
ni cambiar sus elementos ni sus colores.

1. Se eliminó el recuadro gris claro con sombra de la imagen de referencia: el fondo del recuadro
   se llevó a blanco puro con una corrección de campo plano (cada píxel se divide por el fondo
   estimado a su alrededor), que deja los colores de la ilustración prácticamente iguales. Se
   quitaron los restos del borde del recuadro.
2. El fondo blanco se convirtió en transparencia para la capa frontal del ícono adaptable. Sobre
   el fondo blanco del ícono se ve igual que la referencia.
3. La ilustración se centró en el círculo mínimo que la contiene y se escaló para que ese círculo
   coincida con la zona segura de Android (66 dp de diámetro en un lienzo de 108 dp). Así ninguna
   máscara (círculo, «squircle» o cuadrado redondeado) recorta el arco, las monedas ni el botón.

## 2. Recursos

| Archivo | Tamaño | Uso |
|---|---|---|
| `app/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | — | Ícono adaptable (nuevo): fondo y capa frontal |
| `app/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | — | Ícono adaptable redondo (nuevo), mismas capas |
| `app/android/app/src/main/res/values/ic_launcher_background.xml` | — | Color de fondo `#FFFFFF` (nuevo) |
| `res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher_foreground.png` | 108, 162, 216, 324 y 432 px | Capa frontal transparente (nueva) |
| `res/mipmap-{…}/ic_launcher.png` | 48, 72, 96, 144 y 192 px | Ícono clásico de cuadrado redondeado (reemplazado) |
| `res/mipmap-{…}/ic_launcher_round.png` | 48, 72, 96, 144 y 192 px | Ícono clásico redondo (reemplazado) |
| `docs/assets/app-icon-1024.png` | 1024 × 1024 px | Imagen maestra, fondo blanco (nueva) |

`AndroidManifest.xml` no cambia: sigue usando `@mipmap/ic_launcher` y `@mipmap/ic_launcher_round`.
Con `minSdkVersion` 29, Android usa los íconos adaptables de `mipmap-anydpi-v26`. Los PNG
clásicos quedan como respaldo, con la misma composición. No se agregaron dependencias, no cambió
el código de la app ni ninguna otra configuración.

## 3. Verificación

| Verificación | Resultado |
|---|---|
| XML del ícono adaptable y del color | Bien formados |
| Tamaños de los PNG por densidad | Los de la tabla, RGBA |
| Vista previa con máscaras de círculo, «squircle» y cuadrado redondeado, y a 144, 96, 48 y 32 px | Ningún elemento recortado; billetera, flecha, barras y monedas reconocibles a 48 px |
| Compilación Android y aspecto en el launcher | La hace el responsable en Windows (compilación y comprobación en el emulador con `Invoke-AndroidBuild.ps1` y `adb`) |
