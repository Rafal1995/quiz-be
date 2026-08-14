import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity.js';
import { Player } from '../player/player.entity.js';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Player])],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
