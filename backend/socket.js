const { Server } = require('socket.io');

const initSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.emit('connected', { message: 'Connected to SehatLine realtime services.' });

    socket.on('queue:join', ({ queueId }) => {
      if (queueId) socket.join(`queue:${queueId}`);
    });

    socket.on('queue:leave', ({ queueId }) => {
      if (queueId) socket.leave(`queue:${queueId}`);
    });
  });

  return io;
};

module.exports = { initSocket };
