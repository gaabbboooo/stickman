# 04 · Plan de playtest con personas reales · demo 1.0

**Objetivo:** saber, con datos y observación, si alguien que no ha participado en INKLING lo entiende, lo disfruta y lo termina sin ayuda, y qué cambiar en la 2.0.

Estos criterios se fijan **antes** de testear, para no ajustar el listón a los resultados.

## Preguntas que queremos responder

1. **Comprensión.** ¿Entienden qué hay que hacer sin que nadie lo explique?
2. **Descubrimiento.** ¿Descubren la tinta, y en cuánto tiempo?
3. **Dificultad.** ¿Dónde se atascan? ¿El capítulo se puede terminar?
4. **Gancho.** ¿Se divierten? ¿Querrían un capítulo 2?
5. **Identidad.** ¿Cómo describen el estilo visual? ¿Coincide con «cuaderno vivo, cálido, artesanal»?

## Criterios de éxito

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Terminan el capítulo | ≥ 60 % | Código de partida |
| Primer disparo | ≤ 30 s y **todos** disparan | Código de partida |
| «Sabía qué tenía que hacer» | media ≥ 4/5 | Puntuación final |
| Diversión | media ≥ 4/5 | Puntuación final |
| Dificultad percibida | media entre 2,5 y 3,5 | Puntuación final |
| Explican el objetivo correctamente | ≥ 4 de 5 | Pregunta 1 de la entrevista |

Si un criterio falla, se convierte en prioridad de la 2.0. Si todos se cumplen, la 2.0 crece en contenido en lugar de corregir.

## Participantes

- **Cuántas:** mínimo 5, ideal 8. Con 5 personas aparecen la mayoría de los problemas graves de usabilidad.
- **Quién:** solo mayores de edad. Mezcla de perfiles: al menos 2 que casi nunca juegan y 2 que juegan habitualmente.
- **Dispositivo:** al menos 2 en móvil.
- **Evitar:** personas que hayan visto el desarrollo. Familia y amigos íntimos solo si no hay más remedio, y anotándolo.

## Guion de la sesión (unos 15 minutos)

1. **Antes (2 min).** «Estoy probando un juego, no te estoy probando a ti. No hay respuestas incorrectas. Si algo te confunde, es culpa del juego. Mientras juegas, di en voz alta lo que piensas.» Pide permiso para tomar notas anónimas y marca el consentimiento.
2. **Juego (8–10 min).** Abre la demo con `?playtest` y entrégala en la **pantalla de título**. Empieza el cronómetro del registro.
   - **No ayudes.** Si pregunta, responde: «¿Qué crees tú?»
   - Solo intervienes si lleva más de 2 minutos bloqueada en el mismo sitio. Apúntalo como «Confusión».
   - Anota con las etiquetas: Confusión, Frustración, Disfrute, Error del juego, o algo que haya dicho en voz alta.
   - Si quiere parar, para. Pulsa pausa para sacar el código.
3. **Código (1 min).** En la pantalla final o en la pausa, pulsa «Copiar código» y pégalo en el registro.
4. **Entrevista (4 min).** Las cinco preguntas del registro, en orden, apuntando sus palabras.
5. **Puntuaciones (1 min).** Las cinco escalas del 1 al 5.

## Herramientas

- **Demo con medición:** `https://gaabbboooo.github.io/stickman/?playtest`. Muestra un distintivo «PLAYTEST» y, en pausa, derrota o victoria, el código de la sesión. No envía nada a ningún sitio.
- **Registro de playtest:** página privada de Insomnio en Claude («Registro de playtest INKLING»). Tiene la ficha por sesión, el cronómetro, las etiquetas y la entrevista, y calcula los resultados agregados frente a estos criterios.

## Privacidad

- Alias en lugar de nombres. Nada de correos, teléfonos ni datos de contacto en el registro.
- No se graba vídeo ni audio sin un permiso explícito aparte.
- Si alguien pide que se borre su sesión, se borra desde la tabla de sesiones del registro.

## Después

Con 5 sesiones o más se rellena [05-resultados-playtest.md](05-resultados-playtest.md) y se revisa la [hoja de ruta 2.0](06-hoja-de-ruta-v2.md): cada cambio de la 2.0 tiene que apuntar a un hallazgo.
