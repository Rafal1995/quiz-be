import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Player } from '../player/player.entity.js';
import { Round } from '../round/round.entity.js';

export enum SessionStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 8 })
  code: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.WAITING,
  })
  status: SessionStatus;

  @Column({ default: 5 })
  maxPlayers: number;

  @Column({ nullable: true })
  hostPlayerId: string;

  @OneToMany(() => Player, (player) => player.session)
  players: Player[];

  @OneToMany(() => Round, (round) => round.session)
  rounds: Round[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
