# IMEC del Norte - Frontend

Aplicacion web del sistema IMEC del Norte.

La documentacion principal del sistema completo esta en:

```text
../README.md
```

## Proyecto

- Tipo: frontend.
- Stack: React, TypeScript, Vite, Axios, TanStack React Query y Socket.IO Client.
- Puerto Docker de desarrollo: `3032`.
- URL del backend: se configura con `VITE_API_URL`.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Variables

Crear `.env` desde `.env.example`.

```env
VITE_API_URL=http://localhost:4001/api
VITE_API_BASE_URL=http://localhost:4001
VITE_WS_URL=http://localhost:4001
```
