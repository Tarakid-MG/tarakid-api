import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKidAvatarSelectionFields1778000000000
  implements MigrationInterface
{
  name = 'AddKidAvatarSelectionFields1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `kids` ADD COLUMN `avatarKey` varchar(255) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `kids` ADD COLUMN `purchasedAvatarKeys` text NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `kids` DROP COLUMN `purchasedAvatarKeys`',
    );
    await queryRunner.query('ALTER TABLE `kids` DROP COLUMN `avatarKey`');
  }
}
