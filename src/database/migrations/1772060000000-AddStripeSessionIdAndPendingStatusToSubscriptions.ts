import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeSessionIdAndPendingStatusToSubscriptions1772060000000 implements MigrationInterface {
  name = 'AddStripeSessionIdAndPendingStatusToSubscriptions1772060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add stripeSessionId column
    await queryRunner.query(`
      ALTER TABLE \`subscriptions\` 
      ADD \`stripeSessionId\` varchar(255) NULL
    `);

    // Update status enum to include PENDING_PAYMENT
    // Note: MariaDB/MySQL doesn't support easy ALTER EXTEND for ENUM,
    // we have to redefine the whole column.
    await queryRunner.query(`
      ALTER TABLE \`subscriptions\` 
      MODIFY \`status\` enum ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_PAYMENT') 
      NOT NULL DEFAULT 'PENDING_PAYMENT'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert status enum (reverting PENDING_PAYMENT to ACTIVE as default if we roll back)
    await queryRunner.query(`
      ALTER TABLE \`subscriptions\` 
      MODIFY \`status\` enum ('ACTIVE', 'EXPIRED', 'CANCELLED') 
      NOT NULL DEFAULT 'ACTIVE'
    `);

    // Remove stripeSessionId column
    await queryRunner.query(`
      ALTER TABLE \`subscriptions\` 
      DROP COLUMN \`stripeSessionId\`
    `);
  }
}
