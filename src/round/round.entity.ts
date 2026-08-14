import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Session } from '../session/session.entity.js';
import { Answer } from './answer.entity.js';

export enum RoundStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REVEAL = 'reveal',
  COMPLETED = 'completed',
}

export interface QuestionOption {
  key: string; // e.g. "a", "b", "c", "d", ...
  text: string;
}

export interface QuestionData {
  question: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctOptionKey: string;
}

@Entity()
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roundNumber: number;

  /** Structured question stored as JSON */
  @Column({ type: 'jsonb' })
  questionData: QuestionData;

  /**
   * @deprecated Kept for migration compatibility. Use questionData instead.
   */
  @Column({ type: 'text', default: '' })
  content: string;

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.PENDING,
  })
  status: RoundStatus;

  @ManyToOne(() => Session, (session) => session.rounds)
  session: Session;

  @Column()
  sessionId: string;

  @OneToMany(() => Answer, (answer) => answer.round)
  answers: Answer[];

  @CreateDateColumn()
  createdAt: Date;
}
