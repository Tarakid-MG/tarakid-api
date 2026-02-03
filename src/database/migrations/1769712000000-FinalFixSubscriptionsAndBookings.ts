import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinalFixSubscriptionsAndBookings1769712000000 implements MigrationInterface {
  name = 'FinalFixSubscriptionsAndBookings1769712000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscriptions table with exact matching types
    await queryRunner.query(`
            CREATE TABLE \`subscriptions\` (
                \`id\` uuid NOT NULL,
                \`userId\` int(11) NOT NULL,
                \`kidId\` uuid NULL,
                \`planName\` varchar(255) NOT NULL,
                \`frequency\` int NOT NULL,
                \`commitmentType\` enum ('MONTHLY', 'THREE_MONTHS', 'SIX_MONTHS') NOT NULL,
                \`creditsPerMonth\` int NOT NULL,
                \`totalCredits\` int NOT NULL,
                \`remainingCredits\` int NOT NULL,
                \`pricePerMonth\` int NOT NULL,
                \`startDate\` date NOT NULL,
                \`endDate\` date NOT NULL,
                \`status\` enum ('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

    // Create bookings table
    await queryRunner.query(`
            CREATE TABLE \`bookings\` (
                \`id\` uuid NOT NULL,
                \`subscriptionId\` uuid NOT NULL,
                \`kidId\` uuid NOT NULL,
                \`userId\` int(11) NOT NULL,
                \`sessionDate\` date NOT NULL,
                \`startTime\` time NOT NULL,
                \`endTime\` time NOT NULL,
                \`dayOfWeek\` int NOT NULL,
                \`isRecurring\` tinyint NOT NULL DEFAULT 0,
                \`recurrencePattern\` json NULL,
                \`status\` enum ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED') NOT NULL DEFAULT 'SCHEDULED',
                \`teacherId\` int NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

    // Add constraints separately to help with debugging if it fails
    await queryRunner.query(
      `ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_SUBSCRIPTION_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_SUBSCRIPTION_KID\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_BOOKING_SUBSCRIPTION\` FOREIGN KEY (\`subscriptionId\`) REFERENCES \`subscriptions\`(\`id\`) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_BOOKING_KID\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_BOOKING_USER\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_BOOKING_USER\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_BOOKING_KID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_BOOKING_SUBSCRIPTION\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_SUBSCRIPTION_KID\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_SUBSCRIPTION_USER\``,
    );
    await queryRunner.query(`DROP TABLE \`bookings\``);
    await queryRunner.query(`DROP TABLE \`subscriptions\``);
  }
}
