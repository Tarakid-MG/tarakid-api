import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPlan1769581693847 implements MigrationInterface {
  name = 'AddSubscriptionPlan1769581693847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`free_trial_sessions\` ADD \`type\` enum ('FREE_TRIAL', 'REGULAR') NOT NULL DEFAULT 'FREE_TRIAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`subscriptionPlan\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`credits\` int NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`credits\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`subscriptionPlan\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_sessions\` DROP COLUMN \`type\``,
    );
  }
}
