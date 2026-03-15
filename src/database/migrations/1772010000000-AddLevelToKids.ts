import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLevelToKids1772010000000 implements MigrationInterface {
  name = 'AddLevelToKids1772010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `kids` ADD `level` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL DEFAULT 'L0'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `kids` DROP COLUMN `level`');
  }
}
