import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberAndAddressToUsers1772000222546 implements MigrationInterface {
  name = 'AddPhoneNumberAndAddressToUsers1772000222546';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`phoneNumber\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`address\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`address\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``,
    );
  }
}
