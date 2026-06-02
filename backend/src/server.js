import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.get('/', (_req, res) => {
  res.json({ message: 'CricArena API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);

io.on('connection', socket => {
  console.log('User connected');

  socket.on('join_match', matchId => {
    socket.join(matchId);
  });

  socket.on('leave_match', matchId => {
    socket.leave(matchId);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});