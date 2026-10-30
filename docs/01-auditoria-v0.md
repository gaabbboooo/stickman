# 01 · Auditoría del punto de partida (v0)

**Fecha:** 28 oct 2026 · **Objeto:** repositorio `gaabbboooo/stickman`, commit `d548f4c` · **Encargo:** requerimiento interdepartamental «INKLING — demo jugable de alta calidad».

## Qué había

Dos archivos (`index.html` y `game.js`, 319 líneas) con un prototipo en HTML5 Canvas titulado «Stickman – Test Build».

![Prototipo v0](evidencia/v0-prototipo.png)

**No había** proyecto de Godot (aunque el encargo lo pedía), ni los scripts GDScript diseñados antes para INKLING, ni README, arte, sonido o licencia.

## Qué funcionaba

- Movimiento lateral y salto con gravedad.
- Botones táctiles para móvil.
- Ciclo día/noche por fases.
- Fosos, un enemigo rectangular y una bola de paja rodante.

## Problemas encontrados

| # | Problema | Gravedad |
|---|---|---|
| 1 | Sin final: las fases se repiten sin fin, no hay victoria, vidas ni pantalla de derrota | Bloqueante |
| 2 | Morir te devuelve al inicio sin ningún aviso | Bloqueante |
| 3 | Los fosos no son huecos: el suelo sigue debajo y solo matan si aterrizas dentro | Grave |
| 4 | Nivel en píxeles fijos: en pantallas estrechas el recorrido se rompe | Grave |
| 5 | Física ligada a los FPS: a 120 Hz el juego va el doble de rápido | Grave |
| 6 | Temporizadores que no se reinician entre fases; el jugador puede salirse por la izquierda | Media |
| 7 | Teclas que se quedan pulsadas al cambiar de pestaña | Media |
| 8 | De noche los fosos dibujan un hueco azul celeste | Leve |
| 9 | Sin menú, instrucciones, pausa ni sonido | Bloqueante para el encargo |
| 10 | Estética genérica (cielo azul, líneas negras) sin nada del universo INKLING | Bloqueante para el encargo |

## Conclusión

Se conservan las **ideas** (stickman, enemigos que llegan por ambos lados, progresión por fases), no el **código**. Arreglar 10 problemas estructurales costaba más que reconstruir, y la base no permitía cumplir el criterio de calidad del encargo. Ver decisión D-04 en [02-decisiones.md](02-decisiones.md).
