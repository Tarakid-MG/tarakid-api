import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToKids1772001150792 implements MigrationInterface {
  name = 'AddAvatarUrlToKids1772001150792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD COLUMN IF NOT EXISTS \`avatarUrl\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`avatarUrl\``);
  }
}
