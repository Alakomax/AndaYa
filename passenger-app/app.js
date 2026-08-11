/**
 * AndaYa - App Pasajero Logic (Single Page Interactive Application)
 * Slogan: Pide. Sube. AndaYa.
 */

// Configuración de Estado Global
const state = {
  origin: { lat: -33.4489, lng: -70.6693, name: 'Santiago Centro' }, // Plaza de Armas Santiago
  destination: { lat: -33.4263, lng: -70.6126, name: 'Providencia' }, // Providencia
  estimatedFare: 4200,
  distanceKm: 6.2,
  durationMinutes: 14,
  activeTripId: null,
  socket: null,
  map: null,
  originMarker: null,
  destMarker: null,
  routePolyline: null,
  driverMarkers: []
};

// Coordenadas fijas para sugerencias en Chile
const LOCATIONS_PRESETS = {
  'Providencia': { lat: -33.4263, lng: -70.6126, name: 'Providencia, Santiago' },
  'Las Condes': { lat: -33.3907, lng: -70.5724, name: 'Las Condes, Santiago' },
  'Aeropuerto SCL': { lat: -33.3930, lng: -70.7858, name: 'Aeropuerto SCL, Pudahuel' }
};

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSockets();
  setupUIEvents();
  renderDriverSimulators();
});

/**
 * 1. Inicializa el Mapa Interactivo con Leaflet
 */
function initMap() {
  // Inicializar en Santiago de Chile
  state.map = L.map('map', {
    zoomControl: false
  }).setView([state.origin.lat, state.origin.lng], 13);

  // Re-posicionar control de zoom abajo a la derecha
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  // Tiles Oscuros Estilo Cyberpunk / Vector Dark (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  // Iconos Personalizados HTML/CSS
  const originIcon = L.divIcon({
    className: 'custom-map-pin origin-pin',
    html: '<div style="background:#3b82f6; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow: 0 0 15px #3b82f6;"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  const destIcon = L.divIcon({
    className: 'custom-map-pin dest-pin',
    html: '<div style="background:#ef4444; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow: 0 0 15px #ef4444;"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  // Agregar Marcadores de Origen y Destino Iniciales
  state.originMarker = L.marker([state.origin.lat, state.origin.lng], { icon: originIcon }).addTo(state.map);
  state.destMarker = L.marker([state.destination.lat, state.destination.lng], { icon: destIcon }).addTo(state.map);

  // Trazar línea de ruta
  drawRouteLine();
}

/**
 * 2. Conexión WebSocket al Backend (Realtime GPS & Status)
 */
function initSockets() {
  try {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/';
    state.socket = io(socketUrl, {
      reconnectionAttempts: 3,
      timeout: 3000
    });

    state.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket de AndaYa Core');
      document.querySelector('.status-dot').style.backgroundColor = '#10b981';
      document.querySelector('.status-text').textContent = 'Backend Conectado';
    });

    state.socket.on('disconnect', () => {
      console.log('⚠️ Desconectado del servidor WebSocket');
      document.querySelector('.status-dot').style.backgroundColor = '#f59e0b';
      document.querySelector('.status-text').textContent = 'Modo Demo / Offline';
    });
  } catch (err) {
    console.log('Modo Simulación Activo (Backend no alcanzable).');
  }
}

/**
 * 3. Dibuja la ruta y ajusta los límites del mapa
 */
function drawRouteLine() {
  if (state.routePolyline) {
    state.map.removeLayer(state.routePolyline);
  }

  const latlngs = [
    [state.origin.lat, state.origin.lng],
    [state.destination.lat, state.destination.lng]
  ];

  state.routePolyline = L.polyline(latlngs, {
    color: '#3b82f6',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(state.map);

  // Fit bounds con animación suave
  const bounds = L.latLngBounds(latlngs);
  state.map.fitBounds(bounds, { padding: [80, 80] });
}

/**
 * 4. Simula choferes en movimiento en el mapa (Efecto Radar)
 */
function renderDriverSimulators() {
  const driverIcon = L.divIcon({
    className: 'driver-sim-icon',
    html: '<div style="font-size: 22px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); transform: rotate(45deg);">🚗</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Generar 4 choferes cercanos alrededor del origen
  const simulatedOffsets = [
    [0.005, 0.006],
    [-0.004, 0.008],
    [0.007, -0.005],
    [-0.006, -0.004]
  ];

  simulatedOffsets.forEach((offset) => {
    const dLat = state.origin.lat + offset[0];
    const dLng = state.origin.lng + offset[1];
    const marker = L.marker([dLat, dLng], { icon: driverIcon }).addTo(state.map);
    state.driverMarkers.push(marker);
  });
}

/**
 * 5. Eventos de la Interfaz de Usuario
 */
function setupUIEvents() {
  // Botones de Chips Rápidos
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const destName = e.target.getAttribute('data-name-dest');
      if (LOCATIONS_PRESETS[destName]) {
        const target = LOCATIONS_PRESETS[destName];
        state.destination = { lat: target.lat, lng: target.lng, name: target.name };
        document.getElementById('input-dest').value = target.name;
        
        // Actualizar marcador de destino
        state.destMarker.setLatLng([target.lat, target.lng]);
        drawRouteLine();
      }
    });
  });

  // Botón: Calcular Tarifa (Paso 1 -> Paso 2)
  document.getElementById('btn-estimate').addEventListener('click', async () => {
    await fetchFareEstimate();
    switchStep('step-fare');
  });

  // Botón: Volver (Paso 2 -> Paso 1)
  document.getElementById('btn-back-step1').addEventListener('click', () => {
    switchStep('step-inputs');
  });

  // Botón: Pedir AndaYa Ahora (Paso 2 -> Paso 3)
  document.getElementById('btn-request-trip').addEventListener('click', () => {
    startTripSearch();
    switchStep('step-active-trip');
  });

  // Botón: Cancelar Viaje (Paso 3 -> Paso 1)
  document.getElementById('btn-cancel-trip').addEventListener('click', () => {
    resetTripState();
    switchStep('step-inputs');
  });
}

/**
 * 6. Consulta de Tarifa al Backend o Cálculo Local
 */
async function fetchFareEstimate() {
  const originText = document.getElementById('input-origin').value;
  const destText = document.getElementById('input-dest').value;

  document.getElementById('summary-origin').textContent = originText || state.origin.name;
  document.getElementById('summary-dest').textContent = destText || state.destination.name;

  try {
    // URL relativa dinámica: funciona tanto en localhost como desde IP local en celular
    const apiBase = `${window.location.protocol}//${window.location.host}`;
    const response = await fetch(`${apiBase}/api/v1/trips/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: state.origin.lat,
        originLng: state.origin.lng,
        destLat: state.destination.lat,
        destLng: state.destination.lng
      })
    });

    if (response.ok) {
      const result = await response.json();
      state.estimatedFare = result.data.estimatedFare;
      state.distanceKm = result.data.distanceKm;
      state.durationMinutes = result.data.durationMinutes;
    } else {
      throw new Error('Fallback local');
    }
  } catch (err) {
    // Fallback local: calcular tarifa sin red usando las coordenadas del estado
    const rawKm = state.distanceKm || 6.2;
    const rawMin = state.durationMinutes || 14;
    state.estimatedFare = Math.max(1500, Math.ceil((500 + rawKm * 180 + rawMin * 60) / 100) * 100);
  }

  // Renderizar valores en la Card
  document.getElementById('fare-amount').textContent = state.estimatedFare.toLocaleString('es-CL');
  document.getElementById('fare-distance').textContent = `${state.distanceKm} km`;
  document.getElementById('fare-time').textContent = `${state.durationMinutes} min`;
}

/**
 * 7. Inicia Búsqueda y Emparejamiento de Conductor (Simulación en Vivo)
 */
function startTripSearch() {
  document.getElementById('trip-status-title').textContent = 'Buscando conductores cercanos...';
  document.getElementById('trip-status-sub').textContent = 'Conectando con choferes sin comisión en tu zona';
  document.getElementById('driver-card').classList.add('hidden');
  document.getElementById('btn-call-driver').classList.add('hidden');

  // Simular asignación de chofer exitosa a los 3.5 segundos
  setTimeout(() => {
    document.getElementById('trip-status-title').textContent = '¡Conductor Asignado!';
    document.getElementById('trip-status-sub').textContent = 'Tu chofer va en camino al punto de recojo';
    document.getElementById('driver-card').classList.remove('hidden');
    document.getElementById('btn-call-driver').classList.remove('hidden');

    // Mover un marcador de conductor hacia la posición del origen
    if (state.driverMarkers.length > 0) {
      const activeDriverMarker = state.driverMarkers[0];
      animateDriverMovement(activeDriverMarker, state.origin.lat, state.origin.lng);
    }
  }, 3500);
}

/**
 * Mueve progresivamente el marcador del conductor hacia el usuario
 */
function animateDriverMovement(marker, targetLat, targetLng) {
  let steps = 30;
  let currentStep = 0;
  const startLatLng = marker.getLatLng();

  const interval = setInterval(() => {
    currentStep++;
    const lat = startLatLng.lat + (targetLat - startLatLng.lat) * (currentStep / steps);
    const lng = startLatLng.lng + (targetLng - startLatLng.lng) * (currentStep / steps);
    marker.setLatLng([lat, lng]);

    if (currentStep >= steps) {
      clearInterval(interval);
      document.getElementById('driver-eta').textContent = '¡Llegó!';
    }
  }, 300);
}

/**
 * Restablece el estado de la app
 */
function resetTripState() {
  state.activeTripId = null;
  document.getElementById('driver-card').classList.add('hidden');
}

/**
 * Alterna entre pasos del panel flotante
 */
function switchStep(stepId) {
  document.querySelectorAll('.panel-step').forEach(step => {
    step.classList.remove('active');
  });
  document.getElementById(stepId).classList.add('active');
}
