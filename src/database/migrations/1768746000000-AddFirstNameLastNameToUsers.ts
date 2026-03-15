import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirstNameLastNameToUsers1768746000000 implements MigrationInterface {
  name = 'AddFirstNameLastNameToUsers1768746000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`firstName\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`lastName\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`lastName\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`firstName\``);
  }
}
