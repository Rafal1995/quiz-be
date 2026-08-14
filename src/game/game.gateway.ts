import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service.js';
import { SessionService } from '../session/session.service.js';

interface JoinRoomPayload {
  sessionCode: string;
  playerId: string;
}

interface RejoinRoomPayload {
  sessionCode: string;
  playerId: string;
}

interface SubmitAnswerPayload {
  sessionCode: string;
  playerId: string;
  content: string;
}

interface StartGamePayload {
  sessionCode: string;
  playerId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server: Server;

  /** Maps socket.id → { sessionCode, playerId } */
  private connections = new Map<
    string,
    { sessionCode: string; playerId: string }
  >();

  /** Tracks which sessions are currently paused */
  private pausedSessions = new Set<string>();

  constructor(
    private readonly gameService: GameService,
    private readonly sessionService: SessionService,
  ) {}

  async handleDisconnect(client: Socket): Promise<void> {
    const conn = this.connections.get(client.id);
    if (!conn) return;

    this.connections.delete(client.id);
    const { sessionCode, playerId } = conn;

    // Mark player as disconnected in DB
    await this.sessionService.markPlayerDisconnected(playerId);

    // Notify all players
    this.server.to(sessionCode).emit('playerDisconnected', {
      playerId,
    });

    // Check if game is in progress — if so, pause it
    const session = await this.sessionService.findByCode(sessionCode);
    if (
      session.status === 'in_progress' &&
      !this.pausedSessions.has(sessionCode)
    ) {
      this.pausedSessions.add(sessionCode);
      this.server.to(sessionCode).emit('gamePaused', {
        reason: 'playerDisconnected',
        disconnectedPlayerId: playerId,
      });
      this.logger.log(
        `Game paused for session ${sessionCode} — player ${playerId} disconnected`,
      );
    }

    this.logger.log(`Player ${playerId} disconnected from ${sessionCode}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { sessionCode, playerId } = payload;

    const player = await this.gameService.validatePlayer(sessionCode, playerId);

    if (!player) {
      client.emit('error', { message: 'Invalid session or player' });
      return;
    }

    await client.join(sessionCode);
    this.connections.set(client.id, { sessionCode, playerId });

    // Ensure player is marked as connected
    await this.sessionService.markPlayerConnected(playerId);

    this.server.to(sessionCode).emit('playerJoined', {
      playerId: player.id,
      displayName: player.displayName,
      isHost: player.isHost,
    });

    this.logger.log(
      `Player "${player.displayName}" joined room ${sessionCode}`,
    );
  }

  @SubscribeMessage('rejoinRoom')
  async handleRejoinRoom(
    @MessageBody() payload: RejoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { sessionCode, playerId } = payload;

    const player = await this.gameService.validatePlayer(sessionCode, playerId);

    if (!player) {
      client.emit('error', { message: 'Invalid session or player' });
      return;
    }

    if (player.isConnected) {
      client.emit('error', { message: 'Player is already connected' });
      return;
    }

    // Mark as connected and join the socket room
    await this.sessionService.markPlayerConnected(playerId);
    await client.join(sessionCode);
    this.connections.set(client.id, { sessionCode, playerId });

    // Notify all players about the rejoin
    this.server.to(sessionCode).emit('playerRejoined', {
      playerId: player.id,
      displayName: player.displayName,
      isHost: player.isHost,
    });

    // Send current game state to the rejoining player
    const session = await this.sessionService.findByCode(sessionCode);
    const currentRound = session.rounds?.find((r) => r.status === 'active');

    client.emit('rejoinState', {
      sessionCode,
      playerId: player.id,
      displayName: player.displayName,
      isHost: player.isHost,
      sessionStatus: session.status,
      currentRound: currentRound
        ? {
            roundId: currentRound.id,
            roundNumber: currentRound.roundNumber,
            question: currentRound.questionData.question,
            imageUrl: currentRound.questionData.imageUrl ?? null,
            options: currentRound.questionData.options,
          }
        : null,
    });

    // Check if all players are now connected — if so, resume the game
    const allConnected =
      await this.sessionService.allPlayersConnected(sessionCode);
    if (allConnected && this.pausedSessions.has(sessionCode)) {
      this.pausedSessions.delete(sessionCode);
      this.server.to(sessionCode).emit('gameResumed', { sessionCode });
      this.logger.log(`Game resumed for session ${sessionCode}`);
    }

    this.logger.log(
      `Player "${player.displayName}" rejoined session ${sessionCode}`,
    );
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() payload: StartGamePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { sessionCode, playerId } = payload;

    try {
      const round = await this.gameService.startGame(
        sessionCode,
        playerId,
        this.server,
      );

      this.server.to(sessionCode).emit('gameStarted', {
        sessionCode,
      });

      this.server.to(sessionCode).emit('roundStarted', {
        roundId: round.id,
        roundNumber: round.roundNumber,
        question: round.questionData.question,
        imageUrl: round.questionData.imageUrl ?? null,
        options: round.questionData.options,
        // NOTE: correctOptionKey is NOT sent to clients
      });
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to start game',
      });
    }
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() payload: SubmitAnswerPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { sessionCode, playerId, content } = payload;

    // Don't allow answers while game is paused
    if (this.pausedSessions.has(sessionCode)) {
      client.emit('error', {
        message: 'Game is paused. Waiting for all players to reconnect.',
      });
      return;
    }

    try {
      const result = await this.gameService.submitAnswer(
        sessionCode,
        playerId,
        content, // this is now the selectedOptionKey
        this.server,
      );

      // Notify room that a player has answered (without revealing content)
      this.server.to(sessionCode).emit('playerAnswered', {
        playerId,
        answeredCount: result.answeredCount,
        totalPlayers: result.totalPlayers,
      });

      // If all players answered, reveal correct answer
      if (result.allAnswered) {
        this.server.to(sessionCode).emit('roundRevealed', {
          roundId: result.roundId,
          correctOptionKey: result.correctOptionKey,
        });
      }
    } catch (error) {
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to submit answer',
      });
    }
  }
}
