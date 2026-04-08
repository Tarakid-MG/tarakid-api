import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLoginAndActivityToUsers1774444356284 implements MigrationInterface {
  name = 'AddLastLoginAndActivityToUsers1774444356284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (table && !table.findColumnByName('lastLogin')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`lastLogin\` timestamp NULL`,
      );
    }
    if (table && !table.findColumnByName('lastActivity')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`lastActivity\` timestamp NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (table && table.findColumnByName('lastActivity')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`lastActivity\``,
      );
    }
    if (table && table.findColumnByName('lastLogin')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`lastLogin\``,
      );
    }
  }
}
