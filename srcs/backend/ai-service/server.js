require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>AI Service running – port 5007 ✅</h1>');
});

// Test endpoint – create AI game
app.post('/ai/games', async (req, res) => {
  const { userId, difficulty = 'medium', aiSide = 'right' } = req.body;

  try {
    const game = await prisma.aIGameSession.create({
      data: {
        userId: Number(userId),
        aiDifficulty: difficulty.toLowerCase(),
        aiSide: aiSide.toUpperCase(),
        playerScore: 0,
        aiScore: 0,
      },
    });
    res.json({ success: true, gameId: game.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected to AI service:', socket.id);
});

const PORT = process.env.PORT || 5007;
server.listen(PORT, () => {
  console.log(`🚀 AI Service running on port ${PORT}`);
});