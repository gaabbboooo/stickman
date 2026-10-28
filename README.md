# INKLING · Demo jugable

> Capítulo 1 · *El Ejército del Borrador* — un plataformas 2D que vive en las páginas de un cuaderno.
> Proyecto de **Insomnio creative lab**. Versión: **demo 1.0**.

El Ejército del Borrador quiere dejar el cuaderno en blanco. Eres un pequeño personaje de tinta con bufanda azul: cruza la página, borra a sus soldados lanzando manchas de tinta y derrota al **Corrector**, un bote de corrector líquido que intenta tapar todo lo dibujado.

Una partida completa dura unos pocos minutos.

## Cómo jugar

| Acción | Teclado | Pantalla táctil |
|---|---|---|
| Caminar | ← → o A D | ◀ ▶ |
| Saltar (mantén para saltar más alto) | Espacio, ↑ o W | ▲ |
| Lanzar tinta | X o J | ✒ |
| Pausa | Esc o P | ❚❚ |
| Menús | ↑ ↓ + Enter, o ratón | tocar la opción |

**Reglas**

- Tienes **3 corazones**. Un golpe o una caída por un agujero de la página quita uno.
- Cada disparo gasta una gota del **tintero** (6 gotas). Se rellena solo poco a poco, y las **gotas azules** del nivel dan +3.
- Los **marcapáginas rojos** guardan tu avance y te devuelven los corazones.
- Si te quedas sin corazones puedes seguir desde el último marcapáginas o reiniciar el capítulo.

**Enemigos y obstáculos**

- **Garabato**: camina de un lado a otro. Cae con una mancha o pisándolo. Hay una variante voladora.
- **Borrador**: aguanta tres manchas; cuando te ve, tiembla y embiste. Pisarlo o mancharlo lo aturde.
- **Chinchetas**: hay que saltarlas.
- **El Corrector** (jefe): escupe gotas de corrector que dejan charcos, y salta para provocar ondas que hay que esquivar saltando. A media vida se enfada y acelera. Tus manchas también deshacen sus gotas en el aire.

## Ejecutar el proyecto

No necesita instalación, compilación ni dependencias.

**Opción A — abrir directamente**
1. Descarga el repositorio (botón *Code → Download ZIP*) y descomprímelo.
2. Abre `index.html` con un navegador moderno (Chrome, Edge, Firefox o Safari).

**Opción B — servidor local** (recomendado si tu navegador limita archivos locales)
```bash
cd stickman
python3 -m http.server 8000
# y abre http://localhost:8000
```

**Publicar en GitHub Pages**
En el repositorio: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`. El archivo `.nojekyll` ya está incluido. La demo queda en `https://<usuario>.github.io/stickman/`.

## Estructura

```
index.html            página y botones táctiles
css/style.css         estilos, tipografía y controles móviles
src/core.js           utilidades y dibujo "a mano" (trazos que tiemblan)
src/audio.js          efectos y música sintetizados con Web Audio
src/input.js          teclado, táctil y ratón
src/level.js          diseño del Capítulo 1
src/entities.js       jugador, enemigos, tinta, gotas y partículas
src/boss.js           el Corrector y sus ataques
src/world.js          física, cámara, marcapáginas y reglas
src/render.js         cuaderno, nivel y HUD
src/ui.js             menús, pausa, derrota, victoria y transiciones
src/main.js           arranque y bucle a paso fijo (60 Hz)
assets/fonts/         tipografía Patrick Hand (licencia OFL)
```

Todo el arte se dibuja por código sobre un lienzo de 960×540 que se escala a cualquier pantalla, y todo el sonido se sintetiza en tiempo real: el juego no carga imágenes ni audio externos.

## Pruebas realizadas

Probado en Chromium sin interfaz, tanto abriendo el archivo directamente como servido por HTTP:

- Navegación de todos los menús con teclado, ratón y toque.
- Movimiento, salto, disparo, recarga de tinta y pausa (también la automática al cambiar de pestaña).
- Caída por agujeros, derrota, *Seguir desde el marcapáginas* y *Reiniciar capítulo*.
- Activación de marcapáginas, entrada en la arena, reinicio del jefe al morir, victoria y *Jugar otra vez*.
- Un bot automático recorre el nivel entero y derrota al jefe hasta la pantalla de victoria.
- Controles táctiles en un móvil horizontal simulado (844×390) y aviso para girar el móvil en vertical.
- Consola sin errores ni avisos en todos los recorridos.

## Limitaciones conocidas

- Es una demo de un solo capítulo; no hay guardado entre sesiones (solo se recuerdan las opciones de sonido).
- La dificultad se ha ajustado con pruebas automáticas, no con pruebas con jugadores reales.
- En móvil se juega en horizontal; en vertical se pide girar el dispositivo.
- Sin soporte de mando.
- Los navegadores solo permiten sonar al audio después de la primera pulsación o toque.

## Créditos y licencias

- Diseño, código y arte: Insomnio creative lab.
- Tipografía **Patrick Hand** © 2010-2012 Patrick Wagesreiter, bajo SIL Open Font License 1.1 (`assets/fonts/OFL-PatrickHand.txt`).
- No se usa ningún otro recurso de terceros.
- El código y el arte de INKLING no tienen licencia abierta: todos los derechos reservados salvo que el autor publique una licencia.
