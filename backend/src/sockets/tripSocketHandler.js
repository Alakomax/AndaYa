/**
 * Manejador de WebSockets en Tiempo Real para AndaYa (GPS Tracking + Matching Engine)
 */
module.exports = (io) => {
  // Mapa de choferes activos: driverId -> { socketId, lat, lng, isOnline, vehiclePlate, lastUpdated }
  const activeDrivers = new Map();
  // Índice inverso: socketId -> driverId (para desconexión en O(1) sin iterar)
  const socketToDriver = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // 1. Conductor actualiza su ubicación GPS en vivo
    socket.on('driver:location_update', (data) => {
      const { driverId, lat, lng, isOnline, vehiclePlate, activeTripId } = data;
      if (!driverId) return;

      activeDrivers.set(driverId, {
        socketId: socket.id,
        driverId,
        lat,
        lng,
        isOnline: isOnline ?? true,
        vehiclePlate,
        lastUpdated: Date.now()
      });

      // Registrar en índice inverso para desconexión eficiente
      socketToDriver.set(socket.id, driverId);

      console.log(`[GPS Driver] Conductor ${driverId} actualizó ubicación: (${lat}, ${lng})`);

      // Emitir posición a la sala del viaje si está en curso
      if (activeTripId) {
        io.to(`trip_${activeTripId}`).emit('trip:driver_location', { driverId, lat, lng });
      }
    });

    // 2. Pasajero se une a la sala del viaje para seguimiento en vivo
    socket.on('trip:join_room', (tripId) => {
      socket.join(`trip_${tripId}`);
      console.log(`[Socket] Pasajero unido a sala trip_${tripId}`);
    });

    // 3. Conductor acepta la solicitud de viaje
    socket.on('trip:accept', (data) => {
      const { tripId, driverId } = data;
      console.log(`[Viaje Aceptado] Viaje ${tripId} aceptado por conductor ${driverId}`);

      io.to(`trip_${tripId}`).emit('trip:status_changed', {
        tripId,
        status: 'accepted',
        driverId
      });
    });

    // 4. Conductor cambia el estado del viaje (arrived, in_progress, completed)
    socket.on('trip:update_status', (data) => {
      const { tripId, status } = data;
      console.log(`[Estado Viaje] Viaje ${tripId} cambió a: ${status}`);

      io.to(`trip_${tripId}`).emit('trip:status_changed', { tripId, status });
    });

    // Desconexión: eliminación en O(1) usando índice inverso
    socket.on('disconnect', () => {
      const driverId = socketToDriver.get(socket.id);
      if (driverId) {
        activeDrivers.delete(driverId);
        socketToDriver.delete(socket.id);
        console.log(`[Socket] Conductor ${driverId} desconectado.`);
      }
    });
  });
};
