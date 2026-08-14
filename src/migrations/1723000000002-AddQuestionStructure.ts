import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionStructure1723000000002 implements MigrationInterface {
  name = 'AddQuestionStructure1723000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add questionData column to round table
    await queryRunner.query(`
      ALTER TABLE "round" ADD COLUMN "questionData" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // Add new columns to answer table
    await queryRunner.query(`
      ALTER TABLE "answer" ADD COLUMN "selectedOptionKey" text NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "answer" ADD COLUMN "isCorrect" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "answer" ADD COLUMN "points" integer NOT NULL DEFAULT 0
    `);

    // Make content column optional (keep for backward compat)
    await queryRunner.query(`
      ALTER TABLE "round" ALTER COLUMN "content" SET DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "answer" ALTER COLUMN "content" SET DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answer" DROP COLUMN "points"`);
    await queryRunner.query(`ALTER TABLE "answer" DROP COLUMN "isCorrect"`);
    await queryRunner.query(
      `ALTER TABLE "answer" DROP COLUMN "selectedOptionKey"`,
    );
    await queryRunner.query(`ALTER TABLE "round" DROP COLUMN "questionData"`);
  }
}
