import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from '../round/round.entity.js';
import { Answer } from '../round/answer.entity.js';
import { Session } from '../session/session.entity.js';
import { Player } from '../player/player.entity.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { SessionModule } from '../session/session.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round, Answer, Session, Player]),
    SessionModule,
  ],
  providers: [GameGateway, GameService],
})
export class GameModule {}
