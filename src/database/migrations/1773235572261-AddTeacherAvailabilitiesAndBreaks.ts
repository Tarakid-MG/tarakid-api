import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherAvailabilitiesAndBreaks1773235572261 implements MigrationInterface {
  name = 'AddTeacherAvailabilitiesAndBreaks1773235572261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`teacher_availabilities\` (\`id\` uuid NOT NULL, \`teacherId\` int NOT NULL, \`dayOfWeek\` int NOT NULL, \`startTime\` time NOT NULL, \`endTime\` time NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`teacher_breaks\` (\`id\` uuid NOT NULL, \`teacherId\` int NOT NULL, \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`reason\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teacher_availabilities\` ADD CONSTRAINT \`FK_2c468ea827510cde781fdb87b0a\` FOREIGN KEY (\`teacherId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`teacher_breaks\` ADD CONSTRAINT \`FK_a952f00f1b6b68b64609b9e7d10\` FOREIGN KEY (\`teacherId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`teacher_breaks\` DROP FOREIGN KEY \`FK_a952f00f1b6b68b64609b9e7d10\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`teacher_availabilities\` DROP FOREIGN KEY \`FK_2c468ea827510cde781fdb87b0a\``,
    );
    await queryRunner.query(`DROP TABLE \`teacher_breaks\``);
    await queryRunner.query(`DROP TABLE \`teacher_availabilities\``);
  }
}
