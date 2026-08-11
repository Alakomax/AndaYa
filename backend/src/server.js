require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const path = require('path');
const tripRoutes = require('./routes/tripRoutes');
const tripSocketHandler = require('./sockets/tripSocketHandler');

const app = express();
const server = http.createServer(app);

// Configuración de Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Servir la App Pasajero de AndaYa de forma estática (Raíz /)
app.use(express.static(path.join(__dirname, '../../passenger-app')));

// Servir la App Conductor de AndaYa de forma estática (Ruta /driver)
app.use('/driver', express.static(path.join(__dirname, '../../driver-app')));

// Servir la App Admin Backoffice de AndaYa de forma estática (Ruta /admin)
app.use('/admin', express.static(path.join(__dirname, '../../admin-app')));

// Servidor de WebSockets (Socket.io)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Inicializar Manejador de WebSockets
tripSocketHandler(io);

// Rutas de API REST
app.use('/api/v1/trips', tripRoutes);

// Endpoint de prueba de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'AndaYa Backend Core API',
    slogan: 'Pide. Sube. AndaYa.',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`=================================`);
  console.log(`🚀 AndaYa Backend Core iniciado`);
  console.log(`📍 Servidor en vivo: http://localhost:${PORT}`);
  console.log(`📱 Acceso Celular (Wi-Fi): http://192.168.100.140:${PORT}`);
  console.log(`🚗 Eslogan: Pide. Sube. AndaYa.`);
  console.log(`=================================`);
});
