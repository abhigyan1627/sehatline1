require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const connectDB = require('./config/db');
const placeRoutes = require('./routes/placeRoutes');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const doctorDashboardRoutes = require('./routes/doctorDashboardRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const allowedOrigins = [
  'https://sehatline1.vercel.app',
  process.env.FRONTEND_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SehatLine backend running', service: 'sehatline-api', port: process.env.PORT || 5000 });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/doctor-dashboard', doctorDashboardRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Internal server error'
  });
});

const startServer = async () => {
  await connectDB();
  app.set('io', initSocket(server, allowedOrigins));
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other backend terminal or change PORT in backend/.env.`);
      process.exit(1);
    }

    throw error;
  });

  server.listen(port, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅  SehatLine API running on port ${port}`);
    console.log(`🌐  CORS allowed origins:`);
    allowedOrigins.forEach((o) => console.log(`    • ${o}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
};

startServer().catch((error) => {
  console.error('Failed to start SehatLine API:', error.message);
  process.exit(1);
});
