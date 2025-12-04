import aiWebSocketHandler from "../ai/aiWebSocket.js";
import prisma from '../prisma/prismaClient.js';

/**
 * WebSocket routes for real-time game communication
    - Check that game session exists and player is in game session
    - Check that it is not a duplicate connection
*/
export default async function websocketRoutes(fastify) {
    fastify.get('/ai/:sessionId', { websocket: true }, async (socket, request) => {
        const { sessionId } = request.params;
        
        try {
          // Token from cookie (browsers automatically send cookies with WebSocket)
          const token = request.cookies.token;
          
          if (!token) {
            console.warn(`[WebSocket] Connection rejected: No token provided for session ${sessionId}`);
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required: Missing token'
            }));
            socket.close();
            return;
          }
          
          // 🔐 Authenticate user via JWT token
          let userId = null;
          
          // Verify JWT token
          try {
            const decoded = await fastify.jwt.verify(token);
            userId = decoded.userId;
            console.log(`[WebSocket] User ${userId} authenticated for session ${sessionId}`);
          } catch (err) {
            console.error(`[WebSocket] Invalid token for session ${sessionId}:`, err.message);
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Invalid or expired token'
            }));
            socket.close();
            return;
          }
          
          // Check session exists
          const session = await prisma.gameSession.findUnique({
              where: { id: Number (sessionId )},
              include: { players: true }
          });

          if (!session || !session.isAi) {
              socket.close(4404, "Invalid or non-AI session");
              return;
          }
          // Check if the user is part of the session
          const isPlayer = session.players.some(p => p.userId === userId);
          if (!isPlayer) {
              socket.close(4403, "You are not a player in this session");
              return;
          }

          // Prevent duplicate WS connections
          if (aiWebSocketHandler.isConnected(sessionId)) {
              socket.close(4409, "AI session already active");
              return;
          }
          // ✅ Pass the connection to AI WebSocket handler
          await aiWebSocketHandler.handleConnections(socket, sessionId, userId);
          
        } catch (error) {
          console.error(`[WebSocket] Connection error for session ${sessionId}:`, error);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to establish WebSocket connection'
          }));
          socket.close();
        }
      });

    
}