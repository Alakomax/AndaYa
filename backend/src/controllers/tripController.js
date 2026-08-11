const fareService = require('../services/fareService');

/**
 * Controlador REST de Viajes para AndaYa
 */
class TripController {
  /**
   * POST /api/v1/trips/estimate
   * Cotiza la tarifa estimada transparente antes de solicitar el viaje.
   */
  async estimateTrip(req, res) {
    try {
      const { originLat, originLng, destLat, destLng } = req.body;

      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({
          error: 'Faltan coordenadas de origen y/o destino.'
        });
      }

      const routeInfo = await fareService.calculateRoute(
        parseFloat(originLat),
        parseFloat(originLng),
        parseFloat(destLat),
        parseFloat(destLng)
      );

      return res.json({
        success: true,
        data: {
          currency: 'CLP',
          estimatedFare: routeInfo.estimatedFare,
          distanceKm: routeInfo.distanceKm,
          durationMinutes: routeInfo.durationMinutes,
          breakdown: {
            // Leer desde fareService para mantener una única fuente de verdad
            baseFare: fareService.baseFare,
            commissionFee: 0,          // 0% Comisión por viaje en AndaYa
            driverEarningsPercentage: 100
          }
        }
      });
    } catch (error) {
      console.error('Error en estimateTrip:', error);
      return res.status(500).json({
        error: 'Error interno calculando la tarifa.'
      });
    }
  }
}

module.exports = new TripController();
