import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLessonIdToBookings1776087260317 implements MigrationInterface {
    name = 'AddLessonIdToBookings1776087260317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.dropLessonsUnitsForeignKeyAndIndex(queryRunner);
        await this.addColumnIfMissing(queryRunner, 'free_trial_bookings', 'lessonId', 'uuid NULL');
        await this.addColumnIfMissing(queryRunner, 'bookings', 'lessonId', 'uuid NULL');
        await queryRunner.query(`ALTER TABLE \`lessons\` CHANGE \`type\` \`type\` enum ('genially', 'pdf', 'video') NOT NULL DEFAULT 'genially'`);
        await queryRunner.query(`ALTER TABLE \`units\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NULL`);
        await this.addColumnIfMissing(queryRunner, 'units', 'levelId', 'uuid NULL');
        await this.addIndexIfMissing(queryRunner, 'levels', 'IDX_b6ff16b45a526088d58a0bdc59', 'UNIQUE', 'code');
        await queryRunner.query(`ALTER TABLE \`kids\` CHANGE \`level\` \`level\` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NULL DEFAULT 'L0'`);
        await this.addColumnIfMissing(queryRunner, 'kids', 'levelId', 'uuid NULL');
        await queryRunner.query(`ALTER TABLE \`free_trial_bookings\` CHANGE \`status\` \`status\` enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'REPORTED') NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`hearts\` \`hearts\` int NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`isOnline\` \`isOnline\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`bookings\` CHANGE \`status\` \`status\` enum ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'MISSED', 'ABSENT', 'REPORTED', 'DONE_BUT_MISSING') NOT NULL DEFAULT 'SCHEDULED'`);
        await this.addForeignKeyIfMissing(queryRunner, 'lessons', 'FK_7c9fe457707c44ae26910acf6c5', 'unitId', 'units', 'id', 'NO ACTION');
        await this.addForeignKeyIfMissing(queryRunner, 'units', 'FK_88f14a360b83826b58b3b467554', 'levelId', 'levels', 'id', 'NO ACTION');
        await this.addForeignKeyIfMissing(queryRunner, 'kids', 'FK_a6e783c69e62616ec389eb72751', 'levelId', 'levels', 'id', 'NO ACTION');
        await this.addForeignKeyIfMissing(queryRunner, 'free_trial_bookings', 'FK_797e5941e789aafdd759acf70e2', 'lessonId', 'lessons', 'id', 'NO ACTION');
        await this.addForeignKeyIfMissing(queryRunner, 'subscriptions', 'FK_fbdba4e2ac694cf8c9cecf4dc84', 'userId', 'users', 'id', 'CASCADE');
        await this.addForeignKeyIfMissing(queryRunner, 'subscriptions', 'FK_028c55fd27ab60554f7ea3c911b', 'kidId', 'kids', 'id', 'CASCADE');
        await this.addForeignKeyIfMissing(queryRunner, 'bookings', 'FK_bcf6bcc68388b8e161a8a346871', 'subscriptionId', 'subscriptions', 'id', 'CASCADE');
        await this.addForeignKeyIfMissing(queryRunner, 'bookings', 'FK_c4ff02f32638c0bef91fcde559d', 'kidId', 'kids', 'id', 'CASCADE');
        await this.addForeignKeyIfMissing(queryRunner, 'bookings', 'FK_38a69a58a323647f2e75eb994de', 'userId', 'users', 'id', 'CASCADE');
        await this.addForeignKeyIfMissing(queryRunner, 'bookings', 'FK_e8fae540cc1ffefd9e417afa865', 'lessonId', 'lessons', 'id', 'NO ACTION');
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

    private async dropLessonsUnitsForeignKeyAndIndex(queryRunner: QueryRunner): Promise<void> {
        const foreignKeys: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(
            `
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'lessons'
              AND COLUMN_NAME = 'unitId'
              AND REFERENCED_TABLE_NAME = 'units'
            `,
        );

        for (const foreignKey of foreignKeys) {
            await queryRunner.query(
                `ALTER TABLE \`lessons\` DROP FOREIGN KEY \`${foreignKey.CONSTRAINT_NAME}\``,
            );
        }

        const indexes: Array<{ INDEX_NAME: string }> = await queryRunner.query(
            `
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'lessons'
              AND INDEX_NAME = 'FK_lessons_units'
            `,
        );

        if (indexes.length > 0) {
            await queryRunner.query(`DROP INDEX \`FK_lessons_units\` ON \`lessons\``);
        }
    }

    private async addColumnIfMissing(
        queryRunner: QueryRunner,
        tableName: string,
        columnName: string,
        definition: string,
    ): Promise<void> {
        if (!(await queryRunner.hasColumn(tableName, columnName))) {
            await queryRunner.query(
                `ALTER TABLE \`${tableName}\` ADD \`${columnName}\` ${definition}`,
            );
        }
    }

    private async addIndexIfMissing(
        queryRunner: QueryRunner,
        tableName: string,
        indexName: string,
        indexType: 'UNIQUE' | '',
        columnName: string,
    ): Promise<void> {
        const indexes: Array<{ INDEX_NAME: string }> = await queryRunner.query(
            `
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND INDEX_NAME = ?
            `,
            [tableName, indexName],
        );

        if (indexes.length === 0) {
            await queryRunner.query(
                `ALTER TABLE \`${tableName}\` ADD ${indexType} INDEX \`${indexName}\` (\`${columnName}\`)`,
            );
        }
    }

    private async addForeignKeyIfMissing(
        queryRunner: QueryRunner,
        tableName: string,
        constraintName: string,
        columnName: string,
        referencedTableName: string,
        referencedColumnName: string,
        onDelete: 'CASCADE' | 'NO ACTION',
    ): Promise<void> {
        const foreignKeys: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(
            `
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME = ?
              AND REFERENCED_COLUMN_NAME = ?
            `,
            [tableName, columnName, referencedTableName, referencedColumnName],
        );

        if (foreignKeys.length === 0) {
            await queryRunner.query(
                `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`${referencedTableName}\`(\`${referencedColumnName}\`) ON DELETE ${onDelete} ON UPDATE NO ACTION`,
            );
        }
    }

}
