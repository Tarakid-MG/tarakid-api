import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLevelEntity1773250000000 implements MigrationInterface {
  name = 'CreateLevelEntity1773250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create levels table
    await queryRunner.query(
      "CREATE TABLE `levels` (`id` varchar(36) NOT NULL, `name` varchar(255) NOT NULL, `code` varchar(255) NOT NULL, `order` int NOT NULL DEFAULT '0', UNIQUE INDEX `IDX_levels_code` (`code`), PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );

    // 2. Insert default levels
    // L0 -> Beginner, L1 -> Junior, L2 -> Explorer, L3 -> Master, L4 -> Expert, L5 -> Elite
    // (Names are approximate, user specified L1 is Junior)
    const levels = [
      { id: 'level-0', name: 'Starter', code: 'L0', order: 0 },
      { id: 'level-1', name: 'Junior', code: 'L1', order: 1 },
      { id: 'level-2', name: 'Explorer', code: 'L2', order: 2 },
      { id: 'level-3', name: 'Master', code: 'L3', order: 3 },
      { id: 'level-4', name: 'Expert', code: 'L4', order: 4 },
      { id: 'level-5', name: 'Elite', code: 'L5', order: 5 },
    ];

    for (const l of levels) {
      await queryRunner.query(
        `INSERT INTO \`levels\` (\`id\`, \`name\`, \`code\`, \`order\`) VALUES ('${l.id}', '${l.name}', '${l.code}', ${l.order})`,
      );
    }

    // 3. Add levelId to kids and units
    await queryRunner.query(
      'ALTER TABLE `kids` ADD `levelId` varchar(36) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `units` ADD `levelId` varchar(36) NULL',
    );

    // 4. Update levelId based on old level enum
    for (const l of levels) {
      await queryRunner.query(
        `UPDATE \`kids\` SET \`levelId\` = '${l.id}' WHERE \`level\` = '${l.code}'`,
      );
      await queryRunner.query(
        `UPDATE \`units\` SET \`levelId\` = '${l.id}' WHERE \`level\` = '${l.code}'`,
      );
    }

    // 5. Add foreign key constraints
    await queryRunner.query(
      'ALTER TABLE `kids` ADD CONSTRAINT `FK_kids_levels` FOREIGN KEY (`levelId`) REFERENCES `levels`(`id`) ON DELETE SET NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `units` ADD CONSTRAINT `FK_units_levels` FOREIGN KEY (`levelId`) REFERENCES `levels`(`id`) ON DELETE SET NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `units` DROP FOREIGN KEY `FK_units_levels`',
    );
    await queryRunner.query(
      'ALTER TABLE `kids` DROP FOREIGN KEY `FK_kids_levels`',
    );
    await queryRunner.query('ALTER TABLE `units` DROP COLUMN `levelId`');
    await queryRunner.query('ALTER TABLE `kids` DROP COLUMN `levelId`');
    await queryRunner.query('DROP TABLE `levels`');
  }
}
