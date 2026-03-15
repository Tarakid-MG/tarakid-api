import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseAvatarUrlSize1772005327000 implements MigrationInterface {
  name = 'IncreaseAvatarUrlSize1772005327000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`kids\` MODIFY COLUMN \`avatarUrl\` TEXT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`kids\` MODIFY COLUMN \`avatarUrl\` varchar(255) NULL`,
    );
  }
}
