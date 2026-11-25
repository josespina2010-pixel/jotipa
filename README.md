# Acorde — Directorio y Asistente Musical

Sistema web dinámico para gestionar y explorar **tiendas de instrumentos musicales, estudios de grabación y escuelas de música**, con base de datos en **Supabase**, mapa interactivo con **Google Maps** y asistente inteligente impulsado por **Google Gemini**.

## Requisitos e Integraciones

- **Frontend:** React + TypeScript + Tailwind CSS + `@vis.gl/react-google-maps`
- **Backend:** Node.js + Express + `@google/genai` (`gemini-4-hydrogen`)
- **Base de datos:** Supabase (PostgreSQL) con respaldo persistente local si no se definen credenciales
- **Despliegue:** GitHub + Render (`render.yaml`)

## Configuración en Supabase

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. Abre **SQL Editor** y ejecuta el contenido completo de `supabase/schema.sql`.
3. En **Project Settings > API**, copia `Project URL` (`SUPABASE_URL`) y `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`).

## Variables de Entorno

Configura estas variables en Render (o en tu entorno local `.env`, sin subirlo a GitHub):

- `GEMINI_API_KEY`: Clave de API de Google AI Studio / Gemini.
- `VITE_GOOGLE_MAPS_API_KEY`: Clave de Google Maps Platform (Maps JavaScript API).
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Clave privada de servicio de Supabase (solo servidor).

## Despliegue en Render desde GitHub

1. Sube este repositorio a tu cuenta de **GitHub** (el archivo `.gitignore` protege `.env` y archivos locales).
2. En **Render**, selecciona **New + > Blueprint** (o **Web Service**) y conecta el repositorio.
3. Render detectará `render.yaml` (`npm install && npm run build` y `npm start`).
4. Agrega las variables de entorno en la pestaña **Environment** y despliega.
