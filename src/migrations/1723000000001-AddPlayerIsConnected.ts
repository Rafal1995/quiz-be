import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerIsConnected1723000000001 implements MigrationInterface {
  name = 'AddPlayerIsConnected1723000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "player" ADD COLUMN "isConnected" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "player" DROP COLUMN "isConnected"
    `);
  }
}
