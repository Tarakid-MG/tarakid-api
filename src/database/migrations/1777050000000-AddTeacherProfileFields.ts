import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherProfileFields1777050000000 implements MigrationInterface {
  name = 'AddTeacherProfileFields1777050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      `SHOW COLUMNS FROM \`users\``,
    )) as { Field: string }[];
    const columnNames = columns.map((col) => col.Field);

    const additions: Array<{ name: string; definition: string }> = [
      { name: 'about', definition: 'text NULL' },
      { name: 'experienceYears', definition: 'int NULL' },
      { name: 'languages', definition: 'json NULL' },
      { name: 'specialties', definition: 'text NULL' },
      { name: 'teachingStyle', definition: 'text NULL' },
      { name: 'education', definition: 'text NULL' },
      { name: 'certifications', definition: 'text NULL' },
    ];

    for (const column of additions) {
      if (!columnNames.includes(column.name)) {
        await queryRunner.query(
          `ALTER TABLE \`users\` ADD \`${column.name}\` ${column.definition}`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      `SHOW COLUMNS FROM \`users\``,
    )) as { Field: string }[];
    const columnNames = columns.map((col) => col.Field);

    for (const column of [
      'certifications',
      'education',
      'teachingStyle',
      'specialties',
      'languages',
      'experienceYears',
      'about',
    ]) {
      if (columnNames.includes(column)) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`${column}\``);
      }
    }
  }
}
