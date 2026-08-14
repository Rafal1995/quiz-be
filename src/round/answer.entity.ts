import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Round } from './round.entity.js';
import { Player } from '../player/player.entity.js';

@Entity()
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The option key the player selected (e.g. "a", "b", "c") */
  @Column({ type: 'text' })
  selectedOptionKey: string;

  /** Whether this answer was correct */
  @Column({ default: false })
  isCorrect: boolean;

  /** Points awarded for this answer. Currently 1 for correct, 0 for wrong.
   *  Open for future scoring modes (time-based, first-correct bonus, etc.) */
  @Column({ type: 'int', default: 0 })
  points: number;

  /**
   * @deprecated Kept for migration compatibility. Use selectedOptionKey instead.
   */
  @Column({ type: 'text', default: '' })
  content: string;

  @ManyToOne(() => Round, (round) => round.answers)
  round: Round;

  @Column()
  roundId: string;

  @ManyToOne(() => Player, (player) => player.answers)
  player: Player;

  @Column()
  playerId: string;

  @CreateDateColumn()
  submittedAt: Date;
}
