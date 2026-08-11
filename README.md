# AndaYa 🚗💨

> **Eslogan:** Pide. Sube. AndaYa.  
> **Posicionamiento:** AndaYa es la app latinoamericana que conecta pasajeros y conductores para moverse de forma rápida, segura y transparente.

---

## Concepto y Modelo de Negocio
Plataforma Full-Stack de transporte de pasajeros basada en un modelo justo de **suscripción fija para conductores (0% comisión por viaje)**, permitiendo tarifas más transparentes para los pasajeros y mayores ingresos netos para los choferes.

## Arquitectura del Sistema
- **App Pasajero**: Solicitud de viajes, estimación de tarifa en tiempo real, seguimiento GPS en vivo.
- **App Conductor**: Gestión de solicitudes, alternar estado Online/Offline, navegación y taxímetro digital.
- **Backend & Realtime API**: Motor de asignación geográfica (PostGIS + Spatial Indexing), máquina de estados de viaje y comunicación bi-direccional vía WebSockets.
- **Panel de Administración Web**: Verificación de documentos de conductores, control de flotas, configuración de tarifas y gestión de suscripciones.

## Stack Tecnológico (Fase 1 - Frente Gratuito)
- **Apps Móviles**: Multiplataforma (Android / iOS)
- **Backend & Base de Datos**: Node.js + Supabase (PostgreSQL + PostGIS)
- **Mapas & Ruteo**: MapLibre GL / OpenStreetMap + OSRM (Open Source Routing Machine)

---

> Proyecto en Fase 1: Inicialización y diseño de la arquitectura de datos.
