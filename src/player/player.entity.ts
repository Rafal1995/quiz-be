import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Session } from '../session/session.entity.js';
import { Answer } from '../round/answer.entity.js';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  displayName: string;

  @Column({ default: false })
  isHost: boolean;

  @Column({ default: true })
  isConnected: boolean;

  @ManyToOne(() => Session, (session) => session.players)
  session: Session;

  @Column()
  sessionId: string;

  @OneToMany(() => Answer, (answer) => answer.player)
  answers: Answer[];

  @CreateDateColumn()
  joinedAt: Date;
}
