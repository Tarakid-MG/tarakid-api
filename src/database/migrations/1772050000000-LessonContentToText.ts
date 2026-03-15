import { MigrationInterface, QueryRunner } from 'typeorm';

export class LessonContentToText1772050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`lessons\` MODIFY COLUMN \`content\` TEXT NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`lessons\` MODIFY COLUMN \`content\` VARCHAR(255) NOT NULL`,
    );
  }
}
