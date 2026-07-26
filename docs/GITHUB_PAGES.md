# Publicar la app en GitHub Pages

## Método sencillo desde navegador

1. Entra a GitHub.
2. Crea un repositorio nuevo llamado `finanzas-pareja`.
3. Sube estos archivos al repositorio.
4. Entra a `Settings > Pages`.
5. En `Source`, elige `Deploy from a branch`.
6. En `Branch`, elige `main` y `/root`.
7. Guarda.
8. Espera a que GitHub muestre la URL publicada.

## Método con Git en computadora

```bash
git init
git add .
git commit -m "Primera versión de app de finanzas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/finanzas-pareja.git
git push -u origin main
```

Después activa GitHub Pages en `Settings > Pages`.
