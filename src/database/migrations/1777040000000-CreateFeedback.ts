import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedback1777040000000 implements MigrationInterface {
  name = 'CreateFeedback1777040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`feedback\` (\`id\` uuid NOT NULL, \`bookingId\` uuid NOT NULL, \`rating\` enum ('LIKE', 'DISLIKE') NOT NULL, \`comment\` text NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_feedback_bookingId\` (\`bookingId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`feedback\` ADD CONSTRAINT \`FK_feedback_bookingId\` FOREIGN KEY (\`bookingId\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`feedback\` DROP FOREIGN KEY \`FK_feedback_bookingId\``,
    );
    await queryRunner.query(`DROP TABLE \`feedback\``);
  }
}
