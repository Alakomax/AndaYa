const axios = require('axios');

/**
 * Servicio de Cálculo de Rutas y Tarifas Transparentes (AndaYa)
 */
class FareService {
  constructor() {
    this.osrmUrl = process.env.OSRM_ROUTING_URL || 'https://router.project-osrm.org';
    this.baseFare = parseFloat(process.env.BASE_FARE || '500');
    this.perKmRate = parseFloat(process.env.PER_KM_RATE || '180');
    this.perMinuteRate = parseFloat(process.env.PER_MINUTE_RATE || '60');
    this.minimumFare = parseFloat(process.env.MINIMUM_FARE || '1500');
  }

  /**
   * Obtiene la ruta, distancia y duración entre 2 coordenadas geográficas usando OSRM (100% Gratis)
   * @param {number} originLat Latitud de Origen
   * @param {number} originLng Longitud de Origen
   * @param {number} destLat Latitud de Destino
   * @param {number} destLng Longitud de Destino
   */
  async calculateRoute(originLat, originLng, destLat, destLng) {
    try {
      const url = `${this.osrmUrl}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
      const response = await axios.get(url);

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No se pudo encontrar una ruta válida.');
      }

      const route = response.data.routes[0];
      const distanceKm = route.distance / 1000; // Convertir metros a KM
      const durationMinutes = Math.ceil(route.duration / 60); // Convertir segundos a Minutos

      const estimatedFare = this.calculateFare(distanceKm, durationMinutes);

      return {
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        durationMinutes,
        estimatedFare
      };
    } catch (error) {
      console.error('Error calculando ruta OSRM:', error.message);
      // Fallback a cálculo de distancia Haversine si el servidor OSRM no responde
      const distanceKm = this.haversineDistance(originLat, originLng, destLat, destLng);
      const durationMinutes = Math.ceil(distanceKm * 2.5); // Estimación 2.5 min/km
      const estimatedFare = this.calculateFare(distanceKm, durationMinutes);

      return {
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        durationMinutes,
        estimatedFare
      };
    }
  }

  /**
   * Calcula la tarifa sin comisión abusiva (Tarifa directa al conductor)
   */
  calculateFare(distanceKm, durationMinutes) {
    const rawFare = this.baseFare + (distanceKm * this.perKmRate) + (durationMinutes * this.perMinuteRate);
    const roundedFare = Math.ceil(rawFare / 100) * 100; // Redondear a los 100 CLP más cercanos
    return Math.max(roundedFare, this.minimumFare);
  }

  /**
   * Fórmula de Haversine para distancia aproximada en línea recta
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new FareService();
