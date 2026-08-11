/**
 * AndaYa Admin Backoffice Logic
 * Supervision Global, Ley EAT & Metric Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminMap();
  setupSidebarNavigation();
});

let adminMap = null;

/**
 * Inicializa el Mapa de Supervisión Global de Flota
 */
function initAdminMap() {
  adminMap = L.map('admin-map', {
    zoomControl: false
  }).setView([-33.4489, -70.6693], 12);

  L.control.zoom({ position: 'bottomright' }).addTo(adminMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(adminMap);

  // Simular 10 marcadores de choferes activos distribuidos en Santiago
  const driverPositions = [
    [-33.4489, -70.6693],
    [-33.4263, -70.6126],
    [-33.3907, -70.5724],
    [-33.4560, -70.6480],
    [-33.4180, -70.6010],
    [-33.4350, -70.6520],
    [-33.4700, -70.6800],
    [-33.3800, -70.5500]
  ];

  const driverIcon = L.divIcon({
    className: 'admin-driver-pin',
    html: '<div style="font-size: 20px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">🚕</div>',
    iconSize: [22, 22]
  });

  driverPositions.forEach(pos => {
    L.marker(pos, { icon: driverIcon }).addTo(adminMap);
  });
}

/**
 * Gestión de Pestañas del Menú Lateral
 */
function setupSidebarNavigation() {
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = btn.getAttribute('data-tab');

      // Alternar clases del menú
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      btn.classList.add('active');

      // Alternar visibilidad de pestañas
      document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
      document.getElementById(targetTab).classList.add('active');

      // Invalidate map size if map tab opened
      if (targetTab === 'tab-fleet' && adminMap) {
        setTimeout(() => {
          adminMap.invalidateSize();
        }, 100);
      }
    });
  });
}

/**
 * Función global para aprobar chofer en la tabla EAT
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

  alert(`✅ Conductor ${driverName} verificado y autorizado bajo la Ley EAT 21.553.`);
};
