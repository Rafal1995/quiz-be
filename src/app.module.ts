import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, gameConfig } from './config/index.js';
import { Session } from './session/session.entity.js';
import { Player } from './player/player.entity.js';
import { Round } from './round/round.entity.js';
import { Answer } from './round/answer.entity.js';
import { SessionModule } from './session/session.module.js';
import { GameModule } from './game/game.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, gameConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [Session, Player, Round, Answer],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    SessionModule,
    GameModule,
    HealthModule,
  ],
})
export class AppModule {}
