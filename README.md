# Taxi Chile 🚖

Plataforma Full-Stack de transporte de pasajeros basada en Chile con modelo de suscripción fija para conductores (0% comisión por viaje).

## Arquitectura del Sistema
- **App Pasajero**: Solicitud de viajes, estimación de tarifa en tiempo real, seguimiento GPS en vivo.
- **App Conductor**: Gestión de solicitudes, alternar estado Online/Offline, navegación y taxímetro digital.
- **Backend & Realtime API**: Motor de asignación geográfica, máquina de estados de viaje y comunicación bi-direccional vía WebSockets.
- **Panel de Administración Web**: Verificación de documentos de conductores (Ley EAT 21.553), control de flotas y configuración de tarifas/suscripciones.

## Stack Tecnológico (Fase 1 - Frente Gratuito)
- **Apps Móviles**: Multiplataforma (Android / iOS)
- **Backend & Base de Datos**: Node.js + Supabase (PostgreSQL + PostGIS)
- **Mapas & Ruteo**: MapLibre GL / OpenStreetMap + OSRM (Open Source Routing Machine)

---

> Proyecto en fase de inicialización y diseño de arquitectura.
