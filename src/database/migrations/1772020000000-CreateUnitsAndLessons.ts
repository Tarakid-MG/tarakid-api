import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnitsAndLessons1772020000000 implements MigrationInterface {
  name = 'CreateUnitsAndLessons1772020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `units` (`id` varchar(36) NOT NULL, `title` varchar(255) NOT NULL, `level` enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5') NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );
    await queryRunner.query(
      "CREATE TABLE `lessons` (`id` varchar(36) NOT NULL, `title` varchar(255) NOT NULL, `type` varchar(255) NOT NULL DEFAULT 'genially', `content` varchar(255) NOT NULL, `order` int NOT NULL, `thumbnailUrl` varchar(255) NULL, `unitId` varchar(36) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );
    await queryRunner.query(
      'ALTER TABLE `lessons` ADD CONSTRAINT `FK_lessons_units` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `lessons` DROP FOREIGN KEY `FK_lessons_units`',
    );
    await queryRunner.query('DROP TABLE `lessons`');
    await queryRunner.query('DROP TABLE `units`');
  }
}
