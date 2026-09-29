import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseThumbnailUrlSize1774081363000 implements MigrationInterface {
  name = 'IncreaseThumbnailUrlSize1774081363000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`lessons\` MODIFY COLUMN \`thumbnailUrl\` TEXT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`lessons\` MODIFY COLUMN \`thumbnailUrl\` varchar(255) NULL`,
    );
  }
}
