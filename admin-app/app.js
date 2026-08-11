/**
 * AndaYa Admin — Backoffice Logic v2.0
 * Collapsible Sidebar, Realtime Fleet Supervision & Ley EAT Management
 */

let adminMap = null;

const TAB_TITLES = {
  'tab-fleet':        'Supervisión de Flota Geográfica',
  'tab-verification': 'Verificación Ley EAT 21.553',
  'tab-trips':        'Monitor de Viajes en Tiempo Real',
  'tab-settings':     'Configuración de Tarifas & Suscripciones'
};

document.addEventListener('DOMContentLoaded', () => {
  initAdminMap();
  setupSidebarNavigation();
  setupCollapsibleSidebar();
  setupKeyboardShortcuts();
});

/**
 * 1. Inicializa el Mapa de Supervisión Global de Flota (Leaflet + Dark Matter)
 */
function initAdminMap() {
  adminMap = L.map('admin-map', {
    zoomControl: false
  }).setView([-33.4489, -70.6693], 12);

  L.control.zoom({ position: 'bottomright' }).addTo(adminMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(adminMap);

  // Posiciones simuladas de choferes activos en Santiago
  const driverPositions = [
    [-33.4263, -70.6126],  // Providencia
    [-33.3907, -70.5724],  // Las Condes
    [-33.4560, -70.6480],  // Barrio Brasil
    [-33.4180, -70.6010],  // Ñuñoa
    [-33.4350, -70.6520],  // San Borja
    [-33.4700, -70.6800],  // San Miguel
    [-33.3800, -70.5500],  // La Reina
    [-33.4489, -70.6693]   // Santiago Centro / Plaza de Armas
  ];

  const driverIcon = L.divIcon({
    className: '',
    html: '<div style="font-size: 22px; filter: drop-shadow(0 2px 8px rgba(37,99,235,0.6));">🚕</div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  driverPositions.forEach(pos => {
    L.marker(pos, { icon: driverIcon }).addTo(adminMap);
  });
}

/**
 * 2. Gestión de Menú Colapsable (Desktop & Mobile)
 */
function setupCollapsibleSidebar() {
  const sidebar  = document.getElementById('admin-sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const mobileBtn = document.getElementById('btn-mobile-menu');
  const backdrop  = document.getElementById('sidebar-backdrop');

  // Toggle en Desktop (Colapsar a Iconos / Expandir)
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    triggerMapResize();
  });

  // Toggle en Mobile (Abrir / Cerrar Drawer)
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      backdrop.classList.add('active');
    });
  }

  // Cerrar al hacer clic en el backdrop
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }
}

/**
 * Refresca el canvas del mapa de Leaflet tras el cambio de ancho del layout
 */
function triggerMapResize() {
  if (!adminMap) return;
  // Esperar a que la transición CSS termine (300ms)
  setTimeout(() => {
    adminMap.invalidateSize();
  }, 320);
}

/**
 * 3. Navegación por Pestañas del Menú Lateral
 */
function setupSidebarNavigation() {
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Alternar menú activo
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      btn.classList.add('active');

      // Alternar pestaña visible
      document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById(targetTab).classList.add('active');

      // Actualizar Título Dinámico de la Topbar
      if (TAB_TITLES[targetTab]) {
        document.getElementById('page-title').textContent = TAB_TITLES[targetTab];
      }

      // Si la pestaña es el mapa, redimensionar Leaflet
      if (targetTab === 'tab-fleet') {
        triggerMapResize();
      }

      // En mobile, cerrar sidebar tras seleccionar una pestaña
      const sidebar = document.getElementById('admin-sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
    });
  });
}

/**
 * 4. Atajos de Teclado (Ctrl+B para colapsar menú)
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      const sidebar = document.getElementById('admin-sidebar');
      sidebar.classList.toggle('collapsed');
      triggerMapResize();
    }
  });
}

/**
 * 5. Función global para aprobar chofer en la tabla Ley EAT
 */
window.approveDriver = function(btnElement, driverName) {
  const row = btnElement.closest('tr');
  const statusCell = row.querySelector('.badge-status.pending');

  if (statusCell) {
    statusCell.className = 'badge-status clean';
    statusCell.textContent = 'Aprobado EAT';
  }

  btnElement.disabled = true;
  btnElement.style.opacity = '0.5';
  btnElement.textContent = 'Aprobado';

  // Actualizar contador pendiente
  const pendingBadge = document.getElementById('pending-count');
  let currentCount = parseInt(pendingBadge.textContent);
  if (currentCount > 0) {
    pendingBadge.textContent = currentCount - 1;
  }

  showNotification(`✅ Conductor ${driverName} verificado y autorizado bajo la Ley EAT 21.553.`);
};

/**
 * Guardar configuración de suscripciones o tarifas
 */
window.saveSettings = function(msg) {
  showNotification(`✅ ${msg}`);
};

/**
 * Notificación Toast Flotante sin alert() bloqueante
 */
function showNotification(text) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    background: rgba(13, 21, 38, 0.95);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: #34d399;
    font-family: 'Outfit', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    padding: 12px 20px;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    animation: toastIn 0.3s ease;
  `;
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
