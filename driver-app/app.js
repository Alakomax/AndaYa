/**
 * AndaYa Driver - Modo Conductor Logic
 * Slogan: Pide. Sube. AndaYa.
 */

const driverState = {
  isOnline: false,
  driverId: 'driver_001',
  vehiclePlate: 'AB-CD-12',
  currentLat: -33.4489,
  currentLng: -70.6693,
  currentTripPhase: 0, // 0: Waiting, 1: En camino a origen, 2: A bordo, 3: En destino
  todayEarnings: 38500,
  countdownTimer: null,
  countdownSeconds: 15, // valor de reset; el conteo real se establece en triggerIncomingOffer
  map: null,
  driverMarker: null,
  socket: null
};

document.addEventListener('DOMContentLoaded', () => {
  initDriverMap();
  initDriverSockets();
  setupDriverEvents();
});

/**
 * 1. Inicializa el Mapa del Conductor
 */
function initDriverMap() {
  driverState.map = L.map('driver-map', {
    zoomControl: false
  }).setView([driverState.currentLat, driverState.currentLng], 14);

  L.control.zoom({ position: 'bottomright' }).addTo(driverState.map);

  // Tiles Oscuros
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(driverState.map);

  // Marcador del Auto del Conductor
  const carIcon = L.divIcon({
    className: 'driver-car-pin',
    html: '<div style="font-size: 28px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">🚖</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  driverState.driverMarker = L.marker([driverState.currentLat, driverState.currentLng], { icon: carIcon }).addTo(driverState.map);
}

/**
 * 2. Conexión WebSocket al Backend
 */
function initDriverSockets() {
  try {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/';
    driverState.socket = io(socketUrl);

    driverState.socket.on('connect', () => {
      console.log('✅ Modo Conductor conectado a AndaYa Core Server');
    });
  } catch (err) {
    console.log('Modo Driver Simulación Activo.');
  }
}

/**
 * 3. Eventos de la Interfaz del Conductor
 */
function setupDriverEvents() {
  const toggleBtn = document.getElementById('btn-toggle-online');
  const toggleLabel = document.getElementById('toggle-label');
  const waitingTitle = document.getElementById('waiting-title');
  const waitingSub = document.getElementById('waiting-sub');

  // Toggle Online / Offline
  toggleBtn.addEventListener('click', () => {
    driverState.isOnline = !driverState.isOnline;

    if (driverState.isOnline) {
      toggleBtn.classList.remove('offline');
      toggleBtn.classList.add('online');
      toggleLabel.textContent = 'CONECTADO EN LÍNEA';
      waitingTitle.textContent = 'Buscando solicitudes en tu zona...';
      waitingSub.textContent = 'Mantén la app abierta. Te avisaremos cuando haya un nuevo viaje sin comisión.';

      // Transmitir posición GPS por Socket.io
      if (driverState.socket) {
        driverState.socket.emit('driver:location_update', {
          driverId: driverState.driverId,
          lat: driverState.currentLat,
          lng: driverState.currentLng,
          isOnline: true,
          vehiclePlate: driverState.vehiclePlate
        });
      }

      // Simular oferta de viaje entrante en 4 segundos
      setTimeout(triggerIncomingOffer, 4000);
    } else {
      toggleBtn.classList.remove('online');
      toggleBtn.classList.add('offline');
      toggleLabel.textContent = 'FUERA DE LÍNEA';
      waitingTitle.textContent = 'Estás fuera de línea';
      waitingSub.textContent = 'Conéctate para empezar a recibir solicitudes de viajes sin comisión.';
      
      switchDriverState('state-waiting');
      clearInterval(driverState.countdownTimer);
    }
  });

  // Aceptar Viaje
  document.getElementById('btn-accept-trip').addEventListener('click', () => {
    clearInterval(driverState.countdownTimer);
    driverState.currentTripPhase = 1;
    updateTripPhaseUI();
    switchDriverState('state-in-trip');
  });

  // Rechazar Viaje
  document.getElementById('btn-decline-trip').addEventListener('click', () => {
    clearInterval(driverState.countdownTimer);
    switchDriverState('state-waiting');
  });

  // Botón Acción Fase del Viaje (Llegué -> Iniciar -> Finalizar)
  document.getElementById('btn-next-phase').addEventListener('click', () => {
    driverState.currentTripPhase++;
    updateTripPhaseUI();
  });
}

/**
 * 4. Dispara una Oferta de Viaje Entrante (Simulación de Solicitud de Pasajero)
 */
function triggerIncomingOffer() {
  if (!driverState.isOnline) return;

  switchDriverState('state-incoming');
  driverState.countdownSeconds = 15;
  document.getElementById('countdown-timer').textContent = '15';

  clearInterval(driverState.countdownTimer);
  driverState.countdownTimer = setInterval(() => {
    driverState.countdownSeconds--;
    document.getElementById('countdown-timer').textContent = driverState.countdownSeconds;

    if (driverState.countdownSeconds <= 0) {
      clearInterval(driverState.countdownTimer);
      switchDriverState('state-waiting');
    }
  }, 1000);
}

/**
 * 5. Actualiza la UI de las fases del viaje
 */
function updateTripPhaseUI() {
  const banner = document.getElementById('trip-phase-banner');
  const destText = document.getElementById('current-destination-text');
  const actionBtn = document.getElementById('btn-next-phase');

  if (driverState.currentTripPhase === 1) {
    banner.textContent = '🚗 En camino al punto de recojo (Santiago Centro)';
    destText.textContent = 'Pasajero esperando en Origen';
    actionBtn.textContent = 'Marcar "Llegué al Origen"';
  } else if (driverState.currentTripPhase === 2) {
    banner.textContent = '👥 Pasajero a bordo - En ruta a Providencia';
    destText.textContent = 'Destino: Av. Providencia 1450';
    actionBtn.textContent = 'Iniciar Viaje';
    actionBtn.style.backgroundColor = '#10b981';
  } else if (driverState.currentTripPhase === 3) {
    banner.textContent = '🏁 Llegando al destino final';
    destText.textContent = 'Cobro al Pasajero: $4.200 CLP (100% tuyo)';
    actionBtn.textContent = 'Finalizar Viaje y Cobrar $4.200 CLP';
  } else if (driverState.currentTripPhase >= 4) {
    driverState.todayEarnings += 4200;
    // Actualizar widget de ganancias sin alert() nativo
    const earningsNode = document.querySelector('.earning-box .amount');
    if (earningsNode) {
      earningsNode.childNodes[0].nodeValue = `$${driverState.todayEarnings.toLocaleString('es-CL')} `;
    }
    // Mostrar banner de confirmación en el panel en lugar de un alert bloqueante
    const banner = document.getElementById('trip-phase-banner');
    banner.style.background = 'rgba(16,185,129,0.25)';
    banner.style.color = '#34d399';
    banner.textContent = '🎉 ¡Viaje Finalizado! $4.200 CLP abonados al 100% en tu saldo.';
    driverState.currentTripPhase = 0;
    setTimeout(() => {
      switchDriverState('state-waiting');
    }, 2500);
  }
}

/**
 * Alterna entre estados del panel del conductor
 */
function switchDriverState(stateId) {
  document.querySelectorAll('.panel-state').forEach(el => {
    el.classList.remove('active');
  });
  document.getElementById(stateId).classList.add('active');
}
