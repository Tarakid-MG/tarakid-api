import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFreeTrialTables1769107999977 implements MigrationInterface {
  name = 'CreateFreeTrialTables1769107999977';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if kids table exists before trying to drop foreign key
    const tableExists = await queryRunner.hasTable('kids');
    if (tableExists) {
      // Only drop the foreign key if the table exists
      const table = await queryRunner.getTable('kids');
      const foreignKey = table?.foreignKeys.find(
        (fk) => fk.name === 'FK_cf8fb9893a4760316466f0cac97',
      );
      if (foreignKey) {
        await queryRunner.query(
          `ALTER TABLE \`kids\` DROP FOREIGN KEY \`FK_cf8fb9893a4760316466f0cac97\``,
        );
      }
    } else {
      // Create the kids table if it doesn't exist
      await queryRunner.query(
        `CREATE TABLE \`kids\` (
          \`id\` uuid NOT NULL PRIMARY KEY,
          \`name\` varchar(255) NOT NULL,
          \`age\` int NOT NULL,
          \`gender\` enum('BOY', 'GIRL', 'OTHER') NOT NULL,
          \`motherTongueProficiency\` enum('NONE', 'SOME', 'FLUENT') NOT NULL,
          \`englishReadingLevel\` enum('NONE', 'WORDS', 'SENTENCES', 'FLUENT') NOT NULL,
          \`englishSpeakingLevel\` enum('NONE', 'WORDS', 'SENTENCES', 'FLUENT') NOT NULL,
          \`learningDuration\` varchar(255) NOT NULL,
          \`hobbies\` text NOT NULL,
          \`userId\` int NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
        ) ENGINE=InnoDB`,
      );
    }

    // Only create free_trial_bookings if it doesn't exist
    const hasBookingsTable = await queryRunner.hasTable('free_trial_bookings');
    if (!hasBookingsTable) {
      await queryRunner.query(
        `CREATE TABLE \`free_trial_bookings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`sessionId\` int NOT NULL, \`status\` enum ('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
      );
    }

    // Only create free_trial_sessions if it doesn't exist
    const hasSessionsTable = await queryRunner.hasTable('free_trial_sessions');
    if (!hasSessionsTable) {
      await queryRunner.query(
        `CREATE TABLE \`free_trial_sessions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` date NOT NULL, \`startTime\` time NOT NULL, \`endTime\` time NOT NULL, \`capacity\` int NOT NULL DEFAULT '5', \`bookedSlots\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
      );
    }

    // Only modify kids table structure if it already existed
    if (tableExists) {
      await queryRunner.query(`ALTER TABLE \`kids\` DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`id\``);
      await queryRunner.query(
        `ALTER TABLE \`kids\` ADD \`id\` uuid NOT NULL PRIMARY KEY`,
      );
      await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`createdAt\``);
      await queryRunner.query(
        `ALTER TABLE \`kids\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
      );
      await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`updatedAt\``);
      await queryRunner.query(
        `ALTER TABLE \`kids\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
      );
    }

    // Get users table info for checking indexes and columns
    const usersTable = await queryRunner.getTable('users');

    // Check if unique index already exists before creating it
    const emailIndex = usersTable?.indices.find(
      (idx) => idx.name === 'IDX_97672ac88f789774dd47f7c8be',
    );
    if (!emailIndex) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`,
      );
    }

    // Check if createdAt and updatedAt columns exist before modifying them
    const hasCreatedAt = usersTable?.columns.find(
      (col) => col.name === 'createdAt',
    );
    const hasUpdatedAt = usersTable?.columns.find(
      (col) => col.name === 'updatedAt',
    );

    if (hasCreatedAt) {
      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`createdAt\``,
      );
    }
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );

    if (hasUpdatedAt) {
      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``,
      );
    }
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD CONSTRAINT \`FK_cf8fb9893a4760316466f0cac97\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` ADD CONSTRAINT \`FK_24c5b36cb4b5519684e50c54c41\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` ADD CONSTRAINT \`FK_bbcc32847ea82c4147ecafd2a3e\` FOREIGN KEY (\`sessionId\`) REFERENCES \`free_trial_sessions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP FOREIGN KEY \`FK_bbcc32847ea82c4147ecafd2a3e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP FOREIGN KEY \`FK_24c5b36cb4b5519684e50c54c41\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`kids\` DROP FOREIGN KEY \`FK_cf8fb9893a4760316466f0cac97\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP()`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``,
    );
    await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`,
    );
    await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP()`,
    );
    await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD \`id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`kids\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`DROP TABLE \`free_trial_sessions\``);
    await queryRunner.query(`DROP TABLE \`free_trial_bookings\``);
    await queryRunner.query(
      `ALTER TABLE \`kids\` ADD CONSTRAINT \`FK_cf8fb9893a4760316466f0cac97\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`,
    );
  }
}
