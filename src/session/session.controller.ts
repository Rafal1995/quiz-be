import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { SessionService } from './session.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { JoinSessionDto } from './dto/join-session.dto.js';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    const { session, host } = await this.sessionService.create(dto);
    return {
      sessionCode: session.code,
      sessionId: session.id,
      maxPlayers: session.maxPlayers,
      hostPlayerId: host.id,
      hostDisplayName: host.displayName,
    };
  }

  @Get(':code')
  async findByCode(@Param('code') code: string) {
    const session = await this.sessionService.findByCode(code);
    return {
      id: session.id,
      code: session.code,
      status: session.status,
      maxPlayers: session.maxPlayers,
      hostPlayerId: session.hostPlayerId,
      players: session.players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
    };
  }

  @Get(':code/disconnected')
  async getDisconnectedPlayers(@Param('code') code: string) {
    const players = await this.sessionService.getDisconnectedPlayers(code);
    return players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
    }));
  }

  @Post(':code/join')
  async join(@Param('code') code: string, @Body() dto: JoinSessionDto) {
    const player = await this.sessionService.join(code, dto);
    return {
      playerId: player.id,
      displayName: player.displayName,
      sessionCode: code,
    };
  }
}
