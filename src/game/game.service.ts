import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { Round, RoundStatus } from '../round/round.entity.js';
import { Answer } from '../round/answer.entity.js';
import { Session, SessionStatus } from '../session/session.entity.js';
import { Player } from '../player/player.entity.js';
import { SessionService } from '../session/session.service.js';
import { MOCK_QUESTIONS } from './mock-questions.js';

interface SubmitAnswerResult {
  answeredCount: number;
  totalPlayers: number;
  allAnswered: boolean;
  roundId: string;
  correctOptionKey?: string;
}

export interface PlayerScore {
  playerId: string;
  displayName: string;
  correctAnswers: number;
  totalPoints: number;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly roundRevealDelayMs: number;

  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {
    this.roundRevealDelayMs = this.configService.get<number>(
      'game.roundRevealDelayMs',
      5000,
    );
  }

  async validatePlayer(
    sessionCode: string,
    playerId: string,
  ): Promise<Player | null> {
    const session = await this.sessionRepository.findOne({
      where: { code: sessionCode },
    });

    if (!session) return null;

    const player = await this.playerRepository.findOne({
      where: { id: playerId, sessionId: session.id },
    });

    return player;
  }

  async startGame(
    sessionCode: string,
    playerId: string,
    server: Server,
  ): Promise<Round> {
    const session = await this.sessionService.findByCode(sessionCode);

    if (session.hostPlayerId !== playerId) {
      throw new Error('Only the host can start the game');
    }

    if (session.status !== SessionStatus.WAITING) {
      throw new Error('Game has already started');
    }

    // Create rounds from mock questions
    const rounds: Round[] = [];
    for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
      const round = this.roundRepository.create({
        roundNumber: i + 1,
        questionData: MOCK_QUESTIONS[i],
        content: MOCK_QUESTIONS[i].question, // backward compat
        status: RoundStatus.PENDING,
        sessionId: session.id,
      });
      rounds.push(await this.roundRepository.save(round));
    }

    // Update session status
    await this.sessionService.updateStatus(
      session.id,
      SessionStatus.IN_PROGRESS,
    );

    // Activate the first round
    const firstRound = rounds[0];
    firstRound.status = RoundStatus.ACTIVE;
    await this.roundRepository.save(firstRound);

    this.logger.log(`Game started for session ${sessionCode}`);

    return firstRound;
  }

  async submitAnswer(
    sessionCode: string,
    playerId: string,
    selectedOptionKey: string,
    server: Server,
  ): Promise<SubmitAnswerResult> {
    const session = await this.sessionRepository.findOne({
      where: { code: sessionCode },
      relations: { players: true },
    });

    if (!session || session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Session is not in progress');
    }

    // Find the active round
    const activeRound = await this.roundRepository.findOne({
      where: { sessionId: session.id, status: RoundStatus.ACTIVE },
    });

    if (!activeRound) {
      throw new Error('No active round');
    }

    // Check if player already answered this round
    const existingAnswer = await this.answerRepository.findOne({
      where: { roundId: activeRound.id, playerId },
    });

    if (existingAnswer) {
      throw new Error('You have already submitted an answer for this round');
    }

    // Check correctness and calculate points
    const isCorrect =
      activeRound.questionData.correctOptionKey === selectedOptionKey;
    const points = isCorrect ? 1 : 0; // Simple scoring — extensible later

    // Save the answer
    const answer = this.answerRepository.create({
      selectedOptionKey,
      isCorrect,
      points,
      content: selectedOptionKey, // backward compat
      roundId: activeRound.id,
      playerId,
    });
    await this.answerRepository.save(answer);

    // Check how many have answered
    const answeredCount = await this.answerRepository.count({
      where: { roundId: activeRound.id },
    });
    const totalPlayers = session.players.length;
    const allAnswered = answeredCount >= totalPlayers;

    const result: SubmitAnswerResult = {
      answeredCount,
      totalPlayers,
      allAnswered,
      roundId: activeRound.id,
    };

    if (allAnswered) {
      result.correctOptionKey = activeRound.questionData.correctOptionKey;

      // Move round to reveal status
      activeRound.status = RoundStatus.REVEAL;
      await this.roundRepository.save(activeRound);

      // Schedule next round after delay
      this.scheduleNextRound(session.id, sessionCode, activeRound, server);
    }

    return result;
  }

  async getSessionSummary(sessionCode: string): Promise<PlayerScore[]> {
    const session = await this.sessionService.findByCode(sessionCode);

    const players = await this.playerRepository.find({
      where: { sessionId: session.id },
    });

    const scores: PlayerScore[] = [];

    for (const player of players) {
      const answers = await this.answerRepository.find({
        where: { playerId: player.id },
      });

      const correctAnswers = answers.filter((a) => a.isCorrect).length;
      const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);

      scores.push({
        playerId: player.id,
        displayName: player.displayName,
        correctAnswers,
        totalPoints,
      });
    }

    // Sort by points descending, then by correct answers
    scores.sort(
      (a, b) =>
        b.totalPoints - a.totalPoints || b.correctAnswers - a.correctAnswers,
    );

    return scores;
  }

  private scheduleNextRound(
    sessionId: string,
    sessionCode: string,
    currentRound: Round,
    server: Server,
  ): void {
    setTimeout(async () => {
      try {
        // Mark current round as completed
        currentRound.status = RoundStatus.COMPLETED;
        await this.roundRepository.save(currentRound);

        // Find next round
        const nextRound = await this.roundRepository.findOne({
          where: { sessionId, status: RoundStatus.PENDING },
          order: { roundNumber: 'ASC' },
        });

        if (nextRound) {
          // Activate next round
          nextRound.status = RoundStatus.ACTIVE;
          await this.roundRepository.save(nextRound);

          server.to(sessionCode).emit('roundStarted', {
            roundId: nextRound.id,
            roundNumber: nextRound.roundNumber,
            question: nextRound.questionData.question,
            imageUrl: nextRound.questionData.imageUrl ?? null,
            options: nextRound.questionData.options,
            // NOTE: correctOptionKey is NOT sent to clients
          });

          this.logger.log(
            `Round ${nextRound.roundNumber} started for session ${sessionCode}`,
          );
        } else {
          // No more rounds — game finished
          await this.sessionService.updateStatus(
            sessionId,
            SessionStatus.FINISHED,
          );

          const summary = await this.getSessionSummary(sessionCode);

          server.to(sessionCode).emit('gameFinished', {
            sessionCode,
            leaderboard: summary,
          });

          this.logger.log(`Game finished for session ${sessionCode}`);
        }
      } catch (error) {
        this.logger.error('Error advancing round', error);
      }
    }, this.roundRevealDelayMs);
  }
}
