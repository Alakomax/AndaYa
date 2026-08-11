/**
 * AndaYa — App Pasajero v2.0
 * Dark Premium Design System
 */

// ── Estado Global ──
const state = {
  origin:      { lat: -33.4489, lng: -70.6693, name: 'Plaza de Armas, Santiago Centro' },
  destination: { lat: -33.4263, lng: -70.6126, name: 'Providencia, Santiago' },
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

const LOCATIONS_PRESETS = {
  'Providencia':    { lat: -33.4263, lng: -70.6126, name: 'Providencia, Santiago' },
  'Las Condes':     { lat: -33.3907, lng: -70.5724, name: 'Las Condes, Santiago' },
  'Aeropuerto SCL': { lat: -33.3930, lng: -70.7858, name: 'Aeropuerto SCL, Pudahuel' }
};

// ── Tiles del mapa ──
const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSockets();
  setupEvents();
  renderSimulatedDrivers();
});

// ────────────────────────────
// 1. MAPA INTERACTIVO
// ────────────────────────────
function initMap() {
  state.map = L.map('map', { zoomControl: false })
    .setView([state.origin.lat, state.origin.lng], 13);

  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  L.tileLayer(MAP_TILE_URL, {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(state.map);

  state.originMarker = L.marker(
    [state.origin.lat, state.origin.lng],
    { icon: createPinIcon('#3b82f6') }
  ).addTo(state.map);

  state.destMarker = L.marker(
    [state.destination.lat, state.destination.lng],
    { icon: createPinIcon('#ef4444') }
  ).addTo(state.map);

  drawRouteLine();
}

function createPinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px; height:14px;
      background:${color};
      border-radius:50%;
      border:2.5px solid white;
      box-shadow: 0 0 12px ${color}, 0 0 24px ${color}55;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function drawRouteLine() {
  if (state.routePolyline) state.map.removeLayer(state.routePolyline);

  const latlngs = [
    [state.origin.lat, state.origin.lng],
    [state.destination.lat, state.destination.lng]
  ];

  state.routePolyline = L.polyline(latlngs, {
    color: '#3b82f6',
    weight: 4,
    opacity: 0.7,
    dashArray: '8, 12'
  }).addTo(state.map);

  state.map.fitBounds(L.latLngBounds(latlngs), { padding: [100, 100] });
}

function renderSimulatedDrivers() {
  const offsets = [[0.005, 0.006], [-0.004, 0.008], [0.007, -0.005], [-0.006, -0.004]];
  const driverIcon = L.divIcon({
    className: '',
    html: `<div style="font-size:20px; filter:drop-shadow(0 2px 8px rgba(37,99,235,0.6));">🚕</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  offsets.forEach(([dLat, dLng]) => {
    const marker = L.marker(
      [state.origin.lat + dLat, state.origin.lng + dLng],
      { icon: driverIcon }
    ).addTo(state.map);
    state.driverMarkers.push(marker);
  });
}

// ────────────────────────────
// 2. WEBSOCKET
// ────────────────────────────
function initSockets() {
  try {
    const socketUrl = `${window.location.protocol}//${window.location.host}`;
    state.socket = io(socketUrl, { reconnectionAttempts: 3, timeout: 3000 });

    state.socket.on('connect', () => setConnectionStatus(true));
    state.socket.on('disconnect', () => setConnectionStatus(false));
  } catch {
    setConnectionStatus(false);
  }
}

function setConnectionStatus(online) {
  const dot   = document.getElementById('conn-dot');
  const label = document.getElementById('conn-label');
  if (online) {
    dot.classList.add('online');
    label.textContent = 'Conectado';
  } else {
    dot.classList.remove('online');
    label.textContent = 'Demo / Offline';
  }
}

// ────────────────────────────
// 3. EVENTOS UI
// ────────────────────────────
function setupEvents() {
  // Chips de destino rápido
  document.querySelectorAll('.dest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const destName = chip.getAttribute('data-name-dest');
      const preset = LOCATIONS_PRESETS[destName];
      if (!preset) return;

      state.destination = { lat: preset.lat, lng: preset.lng, name: preset.name };
      document.getElementById('input-dest').value = preset.name;
      state.destMarker.setLatLng([preset.lat, preset.lng]);
      drawRouteLine();

      // Marcar chip seleccionado
      document.querySelectorAll('.dest-chip').forEach(c => c.classList.remove('active-chip'));
      chip.classList.add('active-chip');
    });
  });

  // Paso 1 → 2
  document.getElementById('btn-estimate').addEventListener('click', async () => {
    await fetchFareEstimate();
    switchStep('step-fare');
  });

  // Paso 2 → 1
  document.getElementById('btn-back-step1').addEventListener('click', () => {
    switchStep('step-inputs');
  });

  // Paso 2 → 3
  document.getElementById('btn-request-trip').addEventListener('click', () => {
    startTripSearch();
    switchStep('step-active-trip');
  });

  // Cancelar viaje
  document.getElementById('btn-cancel-trip').addEventListener('click', () => {
    resetTrip();
    switchStep('step-inputs');
  });
}

// ────────────────────────────
// 4. COTIZACIÓN DE TARIFA
// ────────────────────────────
async function fetchFareEstimate() {
  const originText = document.getElementById('input-origin').value;
  const destText   = document.getElementById('input-dest').value;

  document.getElementById('summary-origin').textContent = originText || state.origin.name;
  document.getElementById('summary-dest').textContent   = destText || state.destination.name;

  try {
    const apiBase = `${window.location.protocol}//${window.location.host}`;
    const res = await fetch(`${apiBase}/api/v1/trips/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originLat: state.origin.lat,
        originLng: state.origin.lng,
        destLat:   state.destination.lat,
        destLng:   state.destination.lng
      })
    });

    if (!res.ok) throw new Error('API no disponible');
    const { data } = await res.json();
    state.estimatedFare  = data.estimatedFare;
    state.distanceKm     = data.distanceKm;
    state.durationMinutes = data.durationMinutes;
  } catch {
    // Fallback local con coordenadas reales del estado
    const rawKm  = state.distanceKm || 6.2;
    const rawMin = state.durationMinutes || 14;
    state.estimatedFare = Math.max(1500, Math.ceil((500 + rawKm * 180 + rawMin * 60) / 100) * 100);
  }

  // Actualizar UI con animación de conteo
  animateNumber('fare-amount', state.estimatedFare);
  document.getElementById('fare-distance').textContent = `${state.distanceKm} km`;
  document.getElementById('fare-time').textContent     = `${state.durationMinutes} min`;
}

// Animación de número al cambiar tarifa
function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  const start = parseInt(el.textContent.replace(/\D/g, '')) || 0;
  const duration = 600;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current.toLocaleString('es-CL');
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ────────────────────────────
// 5. BÚSQUEDA Y ASIGNACIÓN
// ────────────────────────────
function startTripSearch() {
  const searchingView    = document.getElementById('searching-view');
  const matchedCard      = document.getElementById('driver-matched-card');
  const btnCall          = document.getElementById('btn-call-driver');

  searchingView.style.display = 'flex';
  matchedCard.classList.add('hidden');
  btnCall.classList.add('hidden');

  document.getElementById('trip-status-title').textContent = 'Buscando conductores...';
  document.getElementById('trip-status-sub').textContent   = 'Conectando choferes sin comisión en tu zona';

  // Simular match a los 3.5 segundos
  setTimeout(() => {
    document.getElementById('trip-status-title').textContent = '¡Conductor en camino!';
    document.getElementById('trip-status-sub').textContent   = 'Tu chofer ya sabe dónde estás';
    matchedCard.classList.remove('hidden');
    btnCall.classList.remove('hidden');

    // Animar el conductor más cercano hacia el origen
    if (state.driverMarkers.length > 0) {
      animateDriverApproach(state.driverMarkers[0], state.origin.lat, state.origin.lng);
    }
  }, 3500);
}

function animateDriverApproach(marker, targetLat, targetLng) {
  const start    = marker.getLatLng();
  const steps    = 40;
  let   step     = 0;
  const INTERVAL = 250;

  const timer = setInterval(() => {
    step++;
    const t   = step / steps;
    const lat = start.lat + (targetLat - start.lat) * t;
    const lng = start.lng + (targetLng - start.lng) * t;
    marker.setLatLng([lat, lng]);

    if (step >= steps) {
      clearInterval(timer);
      document.getElementById('driver-eta').textContent = '¡Llegó!';
    }
  }, INTERVAL);
}

// ────────────────────────────
// 6. UTILIDADES
// ────────────────────────────
function resetTrip() {
  state.activeTripId = null;
  document.getElementById('driver-matched-card').classList.add('hidden');
}

function switchStep(stepId) {
  document.querySelectorAll('.panel-step').forEach(el => el.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}
