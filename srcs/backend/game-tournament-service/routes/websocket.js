import prisma from '../prisma/prismaClient.js';
import aiWebSocketHandler from "../ai/aiWebSocket.js";



export default async function websocketRoutes(fastify) {
  fastify.get('/ai/:sessionId', { websocket: true }, async (socket, request) => {
      const { sessionId } = request.params;
      
      try {
        const token = request.cookies.token;
        
        if (!token) {
          console.warn(`[WebSocket] No token for session ${sessionId}`);
          socket.close(4401, "Authentication required");
          return;
        }
        
        // Verify JWT
        let userId = null;
        try {
          const decoded = await fastify.jwt.verify(token);
          
          // ✅ FIX: JWT might use 'id' instead of 'userId'
          userId = decoded.userId || decoded.id;
          
          console.log(`[WebSocket] JWT decoded:`, decoded);
          console.log(`[WebSocket] User ${userId} authenticated for session ${sessionId}`);
        } catch (err) {
          console.error(`[WebSocket] Invalid token:`, err.message);
          socket.close(4401, "Invalid token");
          return;
        }
        
        // Fetch session with players
        const session = await prisma.gameSession.findUnique({
            where: { id: Number(sessionId) },
            include: { players: true }
        });

        console.log(`📋 [WebSocket] Session ${sessionId} players:`, 
            session?.players.map(p => ({ userId: p.userId, displayName: p.displayName }))
        );

        if (!session) {
            console.error(`[WebSocket] Session ${sessionId} not found`);
            socket.close(4404, "Session not found");
            return;
        }

        if (!session.isAi) {
            console.error(`[WebSocket] Session ${sessionId} is not AI`);
            socket.close(4404, "Not an AI session");
            return;
        }

        // Check if user is a player
        const humanPlayer = session.players.find(p => p.userId === userId);
        
        if (!humanPlayer) {
            console.error(`[WebSocket] User ${userId} NOT found in session ${sessionId}`);
            console.error(`   Available players:`, session.players.map(p => ({ userId: p.userId, displayName: p.displayName })));
            socket.close(4403, "You are not a player in this session");
            return;
        }

        console.log(`[WebSocket] User ${userId} verified in session ${sessionId}`);

        // Prevent duplicate connections
        if (aiWebSocketHandler.isConnected(sessionId)) {
            console.warn(`⚠️ [WebSocket] Session ${sessionId} already connected`);
            socket.close(4409, "Session already active");
            return;
        }

        console.log(`[WebSocket] Connecting to AI handler...`);
        await aiWebSocketHandler.handleConnections(socket, sessionId, userId);
        
      } catch (error) {
        console.error(`[WebSocket] Fatal error:`, error);
        socket.close(4500, "Internal error");
      }
  });
}