require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const tripRoutes = require('./routes/tripRoutes');
const tripSocketHandler = require('./sockets/tripSocketHandler');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const LOCAL_IP = process.env.LOCAL_IP || 'tu-ip-local';

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Apps estáticas servidas
app.use(express.static(path.join(__dirname, '../../passenger-app')));
app.use('/driver', express.static(path.join(__dirname, '../../driver-app')));
app.use('/admin', express.static(path.join(__dirname, '../../admin-app')));

// Servidor de WebSockets (Socket.io)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

tripSocketHandler(io);

// Rutas de API REST
app.use('/api/v1/trips', tripRoutes);

// Endpoint de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'AndaYa Backend Core API',
    slogan: 'Pide. Sube. AndaYa.',
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, HOST, () => {
  console.log(`=================================`);
  console.log(`🚀 AndaYa Backend Core iniciado`);
  console.log(`📍 Local:  http://localhost:${PORT}`);
  console.log(`📱 Celular (Wi-Fi): http://${LOCAL_IP}:${PORT}`);
  console.log(`🚗 Eslogan: Pide. Sube. AndaYa.`);
  console.log(`=================================`);
});
