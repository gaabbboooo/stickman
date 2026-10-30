# 02 · Registro de decisiones

Cada decisión importante, con las alternativas que había y por qué se eligió una. Si una decisión se revierte, no se borra: se añade otra que la sustituye.

**Formato:** contexto → opciones → decisión → motivo → cómo sabremos si fue un error.

---

### D-01 · Tecnología: HTML5/JavaScript en lugar de Godot
*28 oct 2026 · decide Gabriel*

- **Contexto:** el encargo pedía Godot; el repositorio existente era HTML5/JS.
- **Opciones:** (a) Godot 4 con exportación web; (b) HTML5/JS partiendo del prototipo.
- **Decisión:** HTML5/JavaScript.
- **Motivo:** se publica tal cual en GitHub Pages sin exportaciones; no depende de ajustes de hilos del navegador; cualquiera lo abre con un clic.
- **Coste aceptado:** se aparta del requerimiento original y del perfil «Godot» del proyecto.
- **Revisar si:** la 2.0 necesita física, animación o herramientas de nivel que en JS cuesten mucho más que en un motor.

### D-02 · Mecánica central: lanzar manchas de tinta
*28 oct 2026 · decide Gabriel*

- **Opciones:** dibujar plataformas con tinta; lanzar manchas de tinta; plataformas clásico de pisar enemigos.
- **Decisión:** lanzar manchas, con un tintero limitado que se recarga solo y con gotas del nivel.
- **Motivo:** se entiende en segundos y enlaza con el tema (tinta contra borradores).
- **Revisar si:** en el playtest la gente no la descubre (primer disparo > 30 s o nunca dispara) o no la percibe como propia de INKLING.

### D-03 · Repositorio: reemplazar el prototipo en `stickman`
*28 oct 2026 · decide Gabriel*

- **Opciones:** repo nuevo `inkling`; reemplazar `stickman`; entregar un .zip.
- **Decisión:** reemplazar en `stickman`. El prototipo sigue accesible en el historial (commit `d548f4c`).

### D-04 · Reconstruir desde cero en lugar de evolucionar el prototipo
*28 oct 2026 · propone Claude, acepta Gabriel*

- **Motivo:** ver [auditoría](01-auditoria-v0.md). Los problemas eran de estructura (física ligada a FPS, nivel en píxeles de pantalla, sin estados de partida).

### D-05 · Todo el arte y el sonido se generan por código
*28 oct 2026*

- **Opciones:** sprites dibujados; recursos de terceros; dibujo procedural.
- **Decisión:** dibujo procedural con trazos que tiemblan ligeramente («line boil») y audio sintetizado con Web Audio.
- **Motivo:** cumple la regla de consistencia del encargo (todo del mismo universo), evita licencias de terceros y pesa unos 80 KB.
- **Coste aceptado:** el acabado depende del código, no de una mano de ilustrador. Para la 2.0 puede no bastar.
- **Revisar si:** en el playtest la puntuación «me gusta cómo se ve» queda por debajo de 4.

### D-06 · El jefe se llama «El Corrector», no «Liquid Paper»
*28 oct 2026*

- **Motivo:** Liquid Paper es una marca registrada. Un nombre genérico evita problemas al publicar.

### D-07 · Dificultad: marcapáginas que curan y «seguir desde el marcapáginas»
*28 oct 2026*

- **Contexto:** sin invulnerabilidad, el bot de pruebas perdió **3 de 3** partidas (morían a los 34–44 s, casi siempre en la regla móvil o ante el jefe).
- **Decisión:** los marcapáginas devuelven los corazones, y tras perder se puede seguir desde el último en lugar de empezar de cero.
- **Motivo:** el encargo pide que una persona externa pueda completar el nivel sin ayuda.
- **Ojo:** un bot juega peor que una persona. **La dificultad real está sin medir.** Es la primera pregunta del playtest.

### D-08 · Tintero: recarga más rápida
*28 oct 2026*

- **Contexto:** en las pruebas automáticas el tintero llegaba vacío al jefe y el combate se alargaba.
- **Decisión:** la recarga ya no se detiene al disparar (va más lenta) y las gotas de la arena reaparecen cada 5 s.

### D-09 · Modo playtest con datos de partida, sin servidor
*30 oct 2026 · propone Claude*

- **Opciones:** analítica online; formulario para el jugador; registro moderado.
- **Decisión:** el juego, con `?playtest`, registra lo que pasa y muestra un **código de sesión** que la persona moderadora copia en el [registro de playtest](04-plan-playtest.md#herramientas).
- **Motivo:** no envía datos a terceros ni necesita cookies o aviso legal, y combina datos objetivos (dónde mueres) con observación (por qué).
- **Coste aceptado:** solo funciona en sesiones moderadas.
