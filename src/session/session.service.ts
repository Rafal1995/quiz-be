import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session, SessionStatus } from './session.entity.js';
import { Player } from '../player/player.entity.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { JoinSessionDto } from './dto/join-session.dto.js';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly configService: ConfigService,
  ) {}

  async create(
    dto: CreateSessionDto,
  ): Promise<{ session: Session; host: Player }> {
    const maxPlayersDefault = this.configService.get<number>(
      'game.maxPlayersDefault',
      5,
    );

    const session = this.sessionRepository.create({
      code: this.generateSessionCode(),
      maxPlayers: dto.maxPlayers ?? maxPlayersDefault,
      status: SessionStatus.WAITING,
    });

    const savedSession = await this.sessionRepository.save(session);

    const host = this.playerRepository.create({
      displayName: dto.hostDisplayName,
      isHost: true,
      sessionId: savedSession.id,
    });

    const savedHost = await this.playerRepository.save(host);

    savedSession.hostPlayerId = savedHost.id;
    await this.sessionRepository.save(savedSession);

    this.logger.log(
      `Session created: ${savedSession.code} by ${savedHost.displayName}`,
    );

    return { session: savedSession, host: savedHost };
  }

  async findByCode(code: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { code },
      relations: { players: true, rounds: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with code "${code}" not found`);
    }

    return session;
  }

  async join(code: string, dto: JoinSessionDto): Promise<Player> {
    const session = await this.findByCode(code);

    if (session.status !== SessionStatus.WAITING) {
      throw new BadRequestException('Session is not accepting new players');
    }

    if (session.players.length >= session.maxPlayers) {
      throw new BadRequestException('Session is full');
    }

    const player = this.playerRepository.create({
      displayName: dto.displayName,
      isHost: false,
      sessionId: session.id,
    });

    const savedPlayer = await this.playerRepository.save(player);

    this.logger.log(
      `Player "${savedPlayer.displayName}" joined session ${code}`,
    );

    return savedPlayer;
  }

  async updateStatus(
    sessionId: string,
    status: SessionStatus,
  ): Promise<Session> {
    await this.sessionRepository.update(sessionId, { status });
    return this.sessionRepository.findOneOrFail({ where: { id: sessionId } });
  }

  async markPlayerDisconnected(playerId: string): Promise<void> {
    await this.playerRepository.update(playerId, { isConnected: false });
    this.logger.log(`Player ${playerId} marked as disconnected`);
  }

  async markPlayerConnected(playerId: string): Promise<void> {
    await this.playerRepository.update(playerId, { isConnected: true });
    this.logger.log(`Player ${playerId} marked as connected`);
  }

  async getDisconnectedPlayers(code: string): Promise<Player[]> {
    const session = await this.findByCode(code);
    return this.playerRepository.find({
      where: { sessionId: session.id, isConnected: false },
    });
  }

  async allPlayersConnected(sessionCode: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: { code: sessionCode },
    });
    if (!session) return false;

    const disconnected = await this.playerRepository.count({
      where: { sessionId: session.id, isConnected: false },
    });
    return disconnected === 0;
  }

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
