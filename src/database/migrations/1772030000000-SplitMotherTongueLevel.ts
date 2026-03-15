import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitMotherTongueLevel1772030000000 implements MigrationInterface {
  name = 'SplitMotherTongueLevel1772030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add motherTongueSpeakingLevel column
    await queryRunner.query(
      "ALTER TABLE `kids` ADD `motherTongueSpeakingLevel` enum ('NONE', 'SOME', 'FLUENT') NOT NULL",
    );

    // 2. Add motherTongueReadingLevel column
    await queryRunner.query(
      "ALTER TABLE `kids` ADD `motherTongueReadingLevel` enum ('NONE', 'SOME', 'FLUENT') NOT NULL",
    );

    // 3. Copy values from motherTongueProficiency to both new columns
    // We use motherTongueProficiency as the initial level for both speaking and reading
    await queryRunner.query(
      'UPDATE `kids` SET `motherTongueSpeakingLevel` = `motherTongueProficiency`, `motherTongueReadingLevel` = `motherTongueProficiency`',
    );

    // 4. Drop the old motherTongueProficiency column
    await queryRunner.query(
      'ALTER TABLE `kids` DROP COLUMN `motherTongueProficiency`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add motherTongueProficiency column
    await queryRunner.query(
      "ALTER TABLE `kids` ADD `motherTongueProficiency` enum ('NONE', 'SOME', 'FLUENT') NOT NULL",
    );

    // 2. Restore values from motherTongueSpeakingLevel (as fallback)
    await queryRunner.query(
      'UPDATE `kids` SET `motherTongueProficiency` = `motherTongueSpeakingLevel`',
    );

    // 3. Drop the new columns
    await queryRunner.query(
      'ALTER TABLE `kids` DROP COLUMN `motherTongueSpeakingLevel`',
    );
    await queryRunner.query(
      'ALTER TABLE `kids` DROP COLUMN `motherTongueReadingLevel`',
    );
  }
}
