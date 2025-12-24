import prisma from '../prisma/prismaClient.js';
import aiWebSocketHandler from "../ai/aiWebSocket.js";

export default async function websocketRoutes(app, options) {
	// Establish WebSocket connection for AI game
	/*
		- Authentication checks that token is present and valid 
		- Fetch game session with players and check that session exists and it is an AI game
		- Check that user is one of session's players and is the human player
		- Prevent duplicate connection
		- Delegate to AI handler to handle AI logic, prediction, movement, etc. 
	*/
	app.get('/ai/:sessionId', { websocket: true }, async (socket, request) => {
		const { sessionId } = request.params;
		
		try {
			// Authentication checks
			const token = request.cookies.token;
			if (!token) {
				console.warn(`[WebSocket] No token for session ${sessionId}`);
				socket.close(4401, "Authentication required");
				return;
			}
			
			let userId = null;
			try {
				const decoded = await app.jwt.verify(token);
				userId = decoded.userId || decoded.id;
			} catch (err) {
				console.warn(`[WebSocket] Invalid token:`, err.message);
				socket.close(4401, "Invalid token");
				return;
			}
			
			// Fetch session with players
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(sessionId) },
				include: { players: true }
			});

			if (!session) {
				console.warn(`[WebSocket] Session ${sessionId} not found`);
				socket.close(4404, "Session not found");
				return;
			}

			if (!session.isAi) {
				console.warn(`[WebSocket] Session ${sessionId} is not AI`);
				socket.close(4404, "Not an AI session");
				return;
			}

			// Check if user is a player
			const humanPlayer = session.players.find(p => p.userId === userId);
			if (!humanPlayer) {
				console.warn(`[WebSocket] User ${userId} NOT found in session ${sessionId}`);
				socket.close(4403, "You are not a player in this session");
				return;
			}

			// Prevent duplicate connections
			if (aiWebSocketHandler.isConnected(sessionId)) {
				console.warn(`[WebSocket] Session ${sessionId} already connected`);
				socket.close(4409, "Session already active");
				return;
			}

			// Attach AI handler
			await aiWebSocketHandler.handleConnections(socket, sessionId);
		} catch (error) {
			console.error(`[WebSocket] Fatal error:`, error);
			socket.close(4500, "Internal server error");
		}
	});
}