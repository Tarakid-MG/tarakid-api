import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLessonIdToBookings1776087260317 implements MigrationInterface {
    name = 'AddLessonIdToBookings1776087260317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_lessons_units\` ON \`lessons\``);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` ADD \`lessonId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD \`lessonId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`id\` uuid NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`type\` enum ('genially', 'pdf', 'video') NOT NULL DEFAULT 'genially'`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`unitId\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`unitId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`units\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`units\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`units\` ADD \`id\` uuid NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`units\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NULL`);
        await queryRunner.query(`ALTER TABLE \`units\` DROP COLUMN \`levelId\``);
        await queryRunner.query(`ALTER TABLE \`units\` ADD \`levelId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`levels\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`levels\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`levels\` ADD \`id\` uuid NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`levels\` ADD UNIQUE INDEX \`IDX_b6ff16b45a526088d58a0bdc59\` (\`code\`)`);
        await queryRunner.query(`ALTER TABLE \`kids\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NULL DEFAULT 'L0'`);
        await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`levelId\``);
        await queryRunner.query(`ALTER TABLE \`kids\` ADD \`levelId\` uuid NULL`);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` CHANGE \`status\` \`status\` enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'REPORTED') NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`hearts\` \`hearts\` int NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`isOnline\` \`isOnline\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`bookings\` CHANGE \`status\` \`status\` enum ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED', 'ABSENT', 'REPORTED', 'DONE_BUT_MISSING') NOT NULL DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD CONSTRAINT \`FK_7c9fe457707c44ae26910acf6c5\` FOREIGN KEY (\`unitId\`) REFERENCES \`units\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`units\` ADD CONSTRAINT \`FK_88f14a360b83826b58b3b467554\` FOREIGN KEY (\`levelId\`) REFERENCES \`levels\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`kids\` ADD CONSTRAINT \`FK_a6e783c69e62616ec389eb72751\` FOREIGN KEY (\`levelId\`) REFERENCES \`levels\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` ADD CONSTRAINT \`FK_797e5941e789aafdd759acf70e2\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lessons\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_fbdba4e2ac694cf8c9cecf4dc84\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_028c55fd27ab60554f7ea3c911b\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_bcf6bcc68388b8e161a8a346871\` FOREIGN KEY (\`subscriptionId\`) REFERENCES \`subscriptions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_c4ff02f32638c0bef91fcde559d\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_38a69a58a323647f2e75eb994de\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_e8fae540cc1ffefd9e417afa865\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lessons\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_e8fae540cc1ffefd9e417afa865\``);
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_38a69a58a323647f2e75eb994de\``);
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_c4ff02f32638c0bef91fcde559d\``);
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_bcf6bcc68388b8e161a8a346871\``);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_028c55fd27ab60554f7ea3c911b\``);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_fbdba4e2ac694cf8c9cecf4dc84\``);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` DROP FOREIGN KEY \`FK_797e5941e789aafdd759acf70e2\``);
        await queryRunner.query(`ALTER TABLE \`kids\` DROP FOREIGN KEY \`FK_a6e783c69e62616ec389eb72751\``);
        await queryRunner.query(`ALTER TABLE \`units\` DROP FOREIGN KEY \`FK_88f14a360b83826b58b3b467554\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP FOREIGN KEY \`FK_7c9fe457707c44ae26910acf6c5\``);
        await queryRunner.query(`ALTER TABLE \`bookings\` CHANGE \`status\` \`status\` enum COLLATE "utf8mb4_unicode_ci" ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED') NOT NULL DEFAULT 'SCHEDULED'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`isOnline\` \`isOnline\` tinyint(1) NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`hearts\` \`hearts\` int NULL DEFAULT 5`);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` CHANGE \`status\` \`status\` enum ('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE \`kids\` DROP COLUMN \`levelId\``);
        await queryRunner.query(`ALTER TABLE \`kids\` ADD \`levelId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`kids\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL DEFAULT 'L0'`);
        await queryRunner.query(`ALTER TABLE \`levels\` DROP INDEX \`IDX_b6ff16b45a526088d58a0bdc59\``);
        await queryRunner.query(`ALTER TABLE \`levels\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`levels\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`levels\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`units\` DROP COLUMN \`levelId\``);
        await queryRunner.query(`ALTER TABLE \`units\` ADD \`levelId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`units\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`units\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`units\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`units\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`unitId\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`unitId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`type\` varchar(255) NOT NULL DEFAULT 'genially'`);
        await queryRunner.query(`ALTER TABLE \`lessons\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`lessons\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`bookings\` DROP COLUMN \`lessonId\``);
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` DROP COLUMN \`lessonId\``);
        await queryRunner.query(`CREATE INDEX \`FK_lessons_units\` ON \`lessons\` (\`unitId\`)`);
    }

}
