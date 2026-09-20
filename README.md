# Nuestra aventura · 1 año juntos

Página web interactiva estilo RPG retro (pixel-art original). Solo HTML + CSS + JavaScript.

## Archivos
- `index.html` estructura de pantallas
- `style.css` estilo pixel-art y diseño responsive
- `game.js` lógica del juego. **Todo lo que se personaliza está al inicio, en `PERSONALIZACIÓN DEL REGALO`.**
- `assets/` tus imágenes (mira el `LEEME.txt` de cada carpeta)

## Probar en tu computadora
Doble clic en `index.html`. (Con internet se cargan las tipografías pixel; sin internet usa fuentes de respaldo.)

## Probar en el celular
Misma red Wi-Fi: en la carpeta del proyecto ejecuta `python3 -m http.server 8000` y abre
`http://IP-DE-TU-PC:8000` en el celular. O publica en GitHub Pages y abre el enlace.

## Publicar con GitHub Pages
1. Crea un repositorio público en github.com (p. ej. `nuestro-aniversario`).
2. Sube el contenido de esta carpeta (`index.html`, `style.css`, `game.js`, `assets/`).
3. Settings → Pages → Source: *Deploy from a branch* → Branch `main` / carpeta `/ (root)` → Save.
4. En 1–2 minutos estará en `https://TU-USUARIO.github.io/nuestro-aniversario/`.
GitHub Pages distingue mayúsculas/minúsculas: `Colegio.png` ≠ `colegio.png`.

## Cambiar recuerdos y nombres
Abre `game.js` y edita solo la sección `PERSONALIZACIÓN DEL REGALO`:
`CONFIG` (nombres, fecha), `ZONAS` (textos), `LUGARES`, `CANCIONES`, `UNIVERSIDAD`,
`PROXIMA_RUTA`, `RECUERDOS` (coleccionables), `FINAL` (mensaje) y `COLORES`.
Cuando termines, pon `mostrarAyudas: false` para ocultar los avisos de archivos faltantes.
