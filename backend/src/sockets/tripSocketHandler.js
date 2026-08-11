/**
 * Manejador de WebSockets en Tiempo Real para AndaYa (GPS Tracking + Matching Engine)
 */
module.exports = (io) => {
  // Almacenamiento en memoria de choferes activos (para respuesta en <10ms)
  const activeDrivers = new Map(); // driverId -> { socketId, lat, lng, isOnline, vehiclePlate }

  io.on('connection', (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // 1. El Conductor pasa a estado ONLINE y emite su ubicación GPS
    socket.on('driver:location_update', (data) => {
      const { driverId, lat, lng, isOnline, vehiclePlate } = data;
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

      console.log(`[GPS Driver] Conductor ${driverId} actualizó ubicación: (${lat}, ${lng})`);
      
      // Emitir posición a la sala del viaje si está en curso
      if (data.activeTripId) {
        io.to(`trip_${data.activeTripId}`).emit('trip:driver_location', {
          driverId,
          lat,
          lng
        });
      }
    });

    // 2. El Pasajero se unió a la sala del viaje para ver seguimiento en vivo
    socket.on('trip:join_room', (tripId) => {
      socket.join(`trip_${tripId}`);
      console.log(`[Socket] Pasajero unido a sala trip_${tripId}`);
    });

    // 3. El Conductor Acepta la Solicitud de Viaje
    socket.on('trip:accept', (data) => {
      const { tripId, driverId, passengerSocketId } = data;
      console.log(`[Viaje Aceptado] Viaje ${tripId} aceptado por conductor ${driverId}`);
      
      io.to(`trip_${tripId}`).emit('trip:status_changed', {
        tripId,
        status: 'accepted',
        driverId
      });
    });

    // 4. El Conductor cambia el estado del viaje (arrived, in_progress, completed)
    socket.on('trip:update_status', (data) => {
      const { tripId, status } = data;
      console.log(`[Estado Viaje] Viaje ${tripId} cambió a: ${status}`);

      io.to(`trip_${tripId}`).emit('trip:status_changed', {
        tripId,
        status
      });
    });

    // Desconexión de conductor
    socket.on('disconnect', () => {
      for (const [driverId, info] of activeDrivers.entries()) {
        if (info.socketId === socket.id) {
          activeDrivers.delete(driverId);
          console.log(`[Socket] Conductor ${driverId} desconectado.`);
          break;
        }
      }
    });
  });
};
