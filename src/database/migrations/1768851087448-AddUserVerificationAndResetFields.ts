import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserVerificationAndResetFields1768851087448 implements MigrationInterface {
  name = 'AddUserVerificationAndResetFields1768851087448';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`isVerified\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`verificationToken\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`resetPasswordToken\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`resetPasswordExpires\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`resetPasswordExpires\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`resetPasswordToken\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`verificationToken\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isVerified\``);
  }
}
