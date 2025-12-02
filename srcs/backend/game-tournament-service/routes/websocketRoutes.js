import aiWebSocketHandler from "../brain/aiWebSocket.js";

/**
 * WebSocket routes for real-time game communication
 * 
 * 
*/
 


export default async function websocketRoutes(fastify) {
    fastify.get('/ai/:sessionId', { websocket: true }, async (socket, request) => {
        const { sessionId } = request.params;
        
        try {
          // 🔐 Authenticate user via JWT token
          let userId = null;
          
          // Option 1: Token in query string (e.g., ws://localhost:5006/ws/ai/123?token=xyz)
          const tokenFromQuery = request.query.token;
          
          // Option 2: Token from cookie (browsers automatically send cookies with WebSocket)
          const tokenFromCookie = request.cookies.token;
          
          const token = tokenFromQuery || tokenFromCookie;
          
          if (!token) {
            console.warn(`[WebSocket] Connection rejected: No token provided for session ${sessionId}`);
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required: Missing token'
            }));
            socket.close();
            return;
          }
          
          // Verify JWT token
          try {
            const decoded = await fastify.jwt.verify(token);
            userId = decoded.userId || decoded.id; // Adjust based on your JWT payload structure
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