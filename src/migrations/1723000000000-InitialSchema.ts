import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1723000000000 implements MigrationInterface {
  name = 'InitialSchema1723000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create session_status enum
    await queryRunner.query(`
      CREATE TYPE "session_status_enum" AS ENUM ('waiting', 'in_progress', 'finished')
    `);

    // Create round_status enum
    await queryRunner.query(`
      CREATE TYPE "round_status_enum" AS ENUM ('pending', 'active', 'reveal', 'completed')
    `);

    // Create session table
    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(8) NOT NULL,
        "status" "session_status_enum" NOT NULL DEFAULT 'waiting',
        "maxPlayers" integer NOT NULL DEFAULT 5,
        "hostPlayerId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_session_code" UNIQUE ("code"),
        CONSTRAINT "PK_session" PRIMARY KEY ("id")
      )
    `);

    // Create player table
    await queryRunner.query(`
      CREATE TABLE "player" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "displayName" character varying(50) NOT NULL,
        "isHost" boolean NOT NULL DEFAULT false,
        "sessionId" uuid NOT NULL,
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player" PRIMARY KEY ("id"),
        CONSTRAINT "FK_player_session" FOREIGN KEY ("sessionId")
          REFERENCES "session"("id") ON DELETE CASCADE
      )
    `);

    // Create round table
    await queryRunner.query(`
      CREATE TABLE "round" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "roundNumber" integer NOT NULL,
        "content" text NOT NULL,
        "status" "round_status_enum" NOT NULL DEFAULT 'pending',
        "sessionId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_round" PRIMARY KEY ("id"),
        CONSTRAINT "FK_round_session" FOREIGN KEY ("sessionId")
          REFERENCES "session"("id") ON DELETE CASCADE
      )
    `);

    // Create answer table
    await queryRunner.query(`
      CREATE TABLE "answer" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "content" text NOT NULL,
        "roundId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_answer" PRIMARY KEY ("id"),
        CONSTRAINT "FK_answer_round" FOREIGN KEY ("roundId")
          REFERENCES "round"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_answer_player" FOREIGN KEY ("playerId")
          REFERENCES "player"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_player_sessionId" ON "player" ("sessionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_round_sessionId" ON "round" ("sessionId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_answer_roundId" ON "answer" ("roundId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_answer_playerId" ON "answer" ("playerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_answer_playerId"`);
    await queryRunner.query(`DROP INDEX "IDX_answer_roundId"`);
    await queryRunner.query(`DROP INDEX "IDX_round_sessionId"`);
    await queryRunner.query(`DROP INDEX "IDX_player_sessionId"`);
    await queryRunner.query(`DROP TABLE "answer"`);
    await queryRunner.query(`DROP TABLE "round"`);
    await queryRunner.query(`DROP TABLE "player"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TYPE "round_status_enum"`);
    await queryRunner.query(`DROP TYPE "session_status_enum"`);
  }
}
