/**
 * AndaYa Driver — App Conductor v2.0
 * Dark Premium Logic & Realtime Websockets
 */

const driverState = {
  isOnline: false,
  driverId: 'driver_001',
  vehiclePlate: 'AB-CD-12',
  currentLat: -33.4489,
  currentLng: -70.6693,
  currentTripPhase: 0, // 0: Esperando, 1: En camino a origen, 2: Pasajero a bordo, 3: Llegando a destino
  todayEarnings: 38500,
  countdownTimer: null,
  countdownSeconds: 15,
  map: null,
  driverMarker: null,
  socket: null
};

document.addEventListener('DOMContentLoaded', () => {
  initDriverMap();
  initDriverSockets();
  setupDriverEvents();
});

// ────────────────────────────
// 1. MAPA DEL CONDUCTOR
// ────────────────────────────
function initDriverMap() {
  driverState.map = L.map('driver-map', { zoomControl: false })
    .setView([driverState.currentLat, driverState.currentLng], 14);

  L.control.zoom({ position: 'bottomright' }).addTo(driverState.map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(driverState.map);

  const carIcon = L.divIcon({
    className: '',
    html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 8px rgba(37,99,235,0.7)); transform: rotate(15deg);">🚖</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  driverState.driverMarker = L.marker([driverState.currentLat, driverState.currentLng], { icon: carIcon }).addTo(driverState.map);
}

// ────────────────────────────
// 2. WEBSOCKETS
// ────────────────────────────
function initDriverSockets() {
  try {
    const socketUrl = `${window.location.protocol}//${window.location.host}`;
    driverState.socket = io(socketUrl);

    driverState.socket.on('connect', () => {
      console.log('✅ Modo Conductor conectado a AndaYa Core');
    });
  } catch {
    console.log('Modo Driver Simulación Activo.');
  }
}

// ────────────────────────────
// 3. EVENTOS UI Y NAVEGACIÓN
// ────────────────────────────
function setupDriverEvents() {
  const toggleBtn    = document.getElementById('btn-toggle-online');
  const toggleLabel  = document.getElementById('toggle-label');
  const waitingTitle = document.getElementById('waiting-title');
  const waitingSub   = document.getElementById('waiting-sub');

  // Conectar / Desconectar
  toggleBtn.addEventListener('click', () => {
    driverState.isOnline = !driverState.isOnline;

    if (driverState.isOnline) {
      toggleBtn.className = 'btn-toggle-online online';
      toggleLabel.textContent = 'CONECTADO EN LÍNEA';
      waitingTitle.textContent = 'Buscando solicitudes sin comisión...';
      waitingSub.textContent = 'Mantén la app abierta. Te avisaremos cuando haya un viaje cercano.';

      if (driverState.socket) {
        driverState.socket.emit('driver:location_update', {
          driverId: driverState.driverId,
          lat: driverState.currentLat,
          lng: driverState.currentLng,
          isOnline: true,
          vehiclePlate: driverState.vehiclePlate
        });
      }

      // Simular solicitud entrante a los 4 segundos
      setTimeout(triggerIncomingOffer, 4000);
    } else {
      toggleBtn.className = 'btn-toggle-online offline';
      toggleLabel.textContent = 'FUERA DE LÍNEA';
      waitingTitle.textContent = 'Estás fuera de línea';
      waitingSub.textContent = 'Conéctate para empezar a recibir solicitudes de viajes sin comisión.';

      switchDriverState('state-waiting');
      clearInterval(driverState.countdownTimer);
    }
  });

  // Aceptar viaje
  document.getElementById('btn-accept-trip').addEventListener('click', () => {
    clearInterval(driverState.countdownTimer);
    driverState.currentTripPhase = 1;
    updateTripPhaseUI();
    switchDriverState('state-in-trip');
  });

  // Rechazar viaje
  document.getElementById('btn-decline-trip').addEventListener('click', () => {
    clearInterval(driverState.countdownTimer);
    switchDriverState('state-waiting');
  });

  // Siguiente Fase del Viaje
  document.getElementById('btn-next-phase').addEventListener('click', () => {
    driverState.currentTripPhase++;
    updateTripPhaseUI();
  });
}

// ────────────────────────────
// 4. SOLICITUD ENTRANTE (OFERTA)
// ────────────────────────────
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

// ────────────────────────────
// 5. TAXÍMETRO Y FASES DE VIAJE
// ────────────────────────────
function updateTripPhaseUI() {
  const banner    = document.getElementById('trip-phase-banner');
  const destText  = document.getElementById('current-destination-text');
  const actionBtn = document.getElementById('btn-next-phase');

  if (driverState.currentTripPhase === 1) {
    banner.style.background = 'rgba(37, 99, 235, 0.15)';
    banner.style.color = '#60a5fa';
    banner.textContent = '🚗 En camino al punto de recojo (Santiago Centro)';
    destText.textContent = 'Pasajero esperando en Origen';
    actionBtn.textContent = 'Marcar "Llegué al Origen"';
    actionBtn.style.background = 'linear-gradient(135deg, #1d4ed8, #2563eb)';
  } else if (driverState.currentTripPhase === 2) {
    banner.style.background = 'rgba(6, 182, 212, 0.15)';
    banner.style.color = '#06b6d4';
    banner.textContent = '👥 Pasajero a bordo — En ruta a Providencia';
    destText.textContent = 'Destino: Av. Providencia 1450';
    actionBtn.textContent = 'Iniciar Viaje con Pasajero';
    actionBtn.style.background = 'linear-gradient(135deg, #0284c7, #06b6d4)';
  } else if (driverState.currentTripPhase === 3) {
    banner.style.background = 'rgba(16, 185, 129, 0.15)';
    banner.style.color = '#34d399';
    banner.textContent = '🏁 Llegando al destino final';
    destText.textContent = 'Cobro al Pasajero: $4.200 CLP (100% tuyo)';
    actionBtn.textContent = 'Finalizar Viaje y Cobrar $4.200 CLP';
    actionBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
  } else if (driverState.currentTripPhase >= 4) {
    // Viaje finalizado → Sumar ganancias
    driverState.todayEarnings += 4200;
    document.getElementById('today-earnings').textContent = `$${driverState.todayEarnings.toLocaleString('es-CL')}`;

    banner.style.background = 'rgba(16, 185, 129, 0.25)';
    banner.style.color = '#34d399';
    banner.textContent = '🎉 ¡Viaje Finalizado! $4.200 CLP abonados al 100% en tu saldo.';
    
    driverState.currentTripPhase = 0;
    setTimeout(() => {
      switchDriverState('state-waiting');
    }, 2500);
  }
}

function switchDriverState(stateId) {
  document.querySelectorAll('.panel-state').forEach(el => el.classList.remove('active'));
  document.getElementById(stateId).classList.add('active');
}
