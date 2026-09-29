import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToUsers1774084310000 implements MigrationInterface {
  name = 'AddIsActiveToUsers1774084310000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`isActive\` tinyint NOT NULL DEFAULT 1 AFTER \`accountType\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isActive\``);
  }
}
