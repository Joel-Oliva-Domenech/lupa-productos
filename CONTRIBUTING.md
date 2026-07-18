# Contribuir a Lupa

Gracias por ayudar a que la información de productos sea más comprensible y honesta.

## Antes de empezar

1. Busca si ya existe un issue parecido.
2. Para cambios grandes, abre primero una propuesta breve.
3. Mantén el principio central: mostrar evidencias y límites, no un veredicto universal.

## Preparar el proyecto

~~~bash
pnpm install
pnpm assets
pnpm dev
~~~

Antes de enviar un pull request:

~~~bash
pnpm test
pnpm build
~~~

## Criterios

- Escribe interfaz y documentación en lenguaje claro.
- No conviertas datos incompletos en afirmaciones médicas o absolutas.
- Añade pruebas cuando cambies reglas de códigos o análisis.
- Conserva navegación por teclado, contraste suficiente y etiquetas accesibles.
- No incluyas datos personales, claves ni imágenes de productos sin licencia compatible.
- Explica visualmente los estados de carga, error, ausencia de datos y modo sin conexión.

## Pull requests

Describe el problema, el cambio, cómo lo probaste y cualquier límite conocido. Incluye una
captura cuando alteres la interfaz.
