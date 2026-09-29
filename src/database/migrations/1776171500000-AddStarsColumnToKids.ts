import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStarsColumnToKids1776171500000 implements MigrationInterface {
  name = 'AddStarsColumnToKids1776171500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD \`stars\` int NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`stars\``);
  }
}
