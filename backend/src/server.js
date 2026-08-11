require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const tripRoutes = require('./routes/tripRoutes');
const tripSocketHandler = require('./sockets/tripSocketHandler');

const app = express();
const server = http.createServer(app);

// Configuración de Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

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
server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 AndaYa Backend Core iniciado`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🚗 Eslogan: Pide. Sube. AndaYa.`);
  console.log(`=================================`);
});
