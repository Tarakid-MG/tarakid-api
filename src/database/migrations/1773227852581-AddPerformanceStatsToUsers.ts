import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceStatsToUsers1773227852581 implements MigrationInterface {
  name = 'AddPerformanceStatsToUsers1773227852581';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only add the missing columns to avoid foreign key and UUID migration issues
    const columns = (await queryRunner.query(
      `SHOW COLUMNS FROM \`users\``,
    )) as { Field: string }[];
    const columnNames = columns.map((col) => col.Field);

    const newColumns = [
      'finishedCourses',
      'canceledCourses',
      'lateCourses',
      'thumbsUp',
      'thumbsDown',
      'star5',
      'star4',
      'star3',
      'star2',
      'star1',
    ];

    for (const col of newColumns) {
      if (!columnNames.includes(col)) {
        await queryRunner.query(
          `ALTER TABLE \`users\` ADD \`${col}\` int NOT NULL DEFAULT '0'`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnsToRemove = [
      'finishedCourses',
      'canceledCourses',
      'lateCourses',
      'thumbsUp',
      'thumbsDown',
      'star5',
      'star4',
      'star3',
      'star2',
      'star1',
    ];

    for (const col of columnsToRemove) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`${col}\``);
    }
  }
}
