# Sirma

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Deploy Automatico a GitHub Pages (sin credenciales en el repo)

Este proyecto ya incluye workflow en `.github/workflows/deploy-gh-pages.yml` para compilar y publicar en GitHub Pages automaticamente al hacer push a `main` o `master`.

### 1) Importante de seguridad

- En frontend (Angular + GitHub Pages) **no existe forma de ocultar totalmente** la configuracion web de Firebase en el navegador.
- Lo correcto es:
  - No guardar claves reales en Git.
  - Usar GitHub Secrets para inyectarlas en build.
  - Proteger Firebase con Firestore Rules/Auth/App Check.
  - Nunca poner secretos reales de Cloudinary (API secret) en frontend.

### 2) Configurar Secrets en GitHub

En tu repo: `Settings > Secrets and variables > Actions > New repository secret` y agrega:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_DELETE_ENDPOINT` (opcional)
- `BACKEND_URL` (opcional)

### 3) Activar Pages

En `Settings > Pages`:
- Source: `GitHub Actions`

### 4) Resultado

Cada push a `main/master`:
- genera `src/environments/environment.prod.ts` desde secretos,
- hace build con `base-href` del repo,
- publica el contenido de `dist/sirma` en GitHub Pages.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
