import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsAndKidTeacher1775636863304 implements MigrationInterface {
  name = 'AddNotificationsAndKidTeacher1775636863304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (\`id\` uuid NOT NULL, \`userId\` int NOT NULL, \`title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`type\` enum ('BOOKING_CANCELLED', 'BOOKING_REPORTED', 'BOOKING_ASSIGNED') NOT NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, \`metadata\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD \`assignedTeacherId\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD CONSTRAINT \`FK_5894ad0973c2b11bb9a53e14399\` FOREIGN KEY (\`assignedTeacherId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_692a909ee0fa9383e7859f9b406\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_692a909ee0fa9383e7859f9b406\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` DROP FOREIGN KEY \`FK_5894ad0973c2b11bb9a53e14399\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` DROP COLUMN \`assignedTeacherId\``,
    );
    await queryRunner.query(`DROP TABLE \`notifications\``);
  }
}
