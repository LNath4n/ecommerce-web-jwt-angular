# E-commerce Web: Angular + JWT

Angular storefront for an e-commerce platform: product catalog, shopping cart, user profile and an admin area, protected by route guards and a JWT interceptor. It consumes the [Spring Boot REST API](https://github.com/LNath4n/ecommerce-api-jwt-spring-boot).

**Live demo:** https://d23ev6ydugwou7.cloudfront.net/productos
**Backend repo:** [ecommerce-api-jwt-spring-boot](https://github.com/LNath4n/ecommerce-api-jwt-spring-boot)

---

## Key Features

- **Route guards**: authentication guard (cart and profile require a session), admin guard (admin area requires admin permissions) and an unsaved-changes guard.
- **JWT handling with an HTTP interceptor**: a functional interceptor attaches the token to every API request and handles expired sessions.
- **Signals-based state**: Angular Signals (`signal`, `computed`) for local and authentication state, with RxJS for asynchronous flows. No external state library.
- **Standalone components and lazy-loaded routes**: routes load their components on demand.
- **Internationalization**: Spanish and English with ngx-translate.
- **SSR ready**: Angular SSR with an Express server is set up.

---

## Tech Stack

| Area | Technologies |
|------|--------------|
| Framework | Angular 22, TypeScript |
| State and async | Angular Signals, RxJS |
| UI | Bootstrap 5, Angular Material, SCSS, Lucide icons |
| i18n | ngx-translate |
| Testing | Vitest, JSDOM |
| Hosting | AWS (CloudFront) |

---

## Project Structure (core)

```
src/app/core/
├── services/auth/       # Authentication state with Signals
├── guard/               # Route guards
└── interceptors/        # JWT interceptor
```

---

## Getting Started

### Prerequisites

- Node.js and npm
- The backend running locally (default `http://localhost:8080`), or access to a deployed API

### Install and run

```bash
npm install
ng serve
```

Open `http://localhost:4200/`. The app reloads automatically when you change a source file.

### Build

```bash
ng build
```

Build artifacts are stored in `dist/`.

### Unit tests

```bash
ng test
```

Tests run with [Vitest](https://vitest.dev/).

---

## Project Status

In development. Authentication, catalog and cart work against the live API; more features are in progress.

---
