import { MigrationInterface, QueryRunner } from 'typeorm';

export class KidLevelHistory1776083913701 implements MigrationInterface {
  name = 'KidLevelHistory1776083913701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`kid_level_history\` (\`id\` uuid NOT NULL, \`kidId\` uuid NOT NULL, \`performerId\` int NOT NULL, \`oldLevel\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL, \`newLevel\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL, \`reason\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kid_level_history\` ADD CONSTRAINT \`FK_112c6a0180ce4d984ca0362e09d\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kid_level_history\` ADD CONSTRAINT \`FK_470f44524d362d943683c43ff8a\` FOREIGN KEY (\`performerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`kid_level_history\` DROP FOREIGN KEY \`FK_470f44524d362d943683c43ff8a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`kid_level_history\` DROP FOREIGN KEY \`FK_112c6a0180ce4d984ca0362e09d\``,
    );
    await queryRunner.query(`DROP TABLE \`kid_level_history\``);
  }
}
