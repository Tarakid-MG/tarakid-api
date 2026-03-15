import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class SyncUserAndKidEntities1769112000000 implements MigrationInterface {
  name = 'SyncUserAndKidEntities1769112000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if kids table already exists
    const kidsTableExists = await queryRunner.hasTable('kids');

    if (!kidsTableExists) {
      // 1. Create 'kids' table only if it doesn't exist
      await queryRunner.createTable(
        new Table({
          name: 'kids',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'age',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'gender',
              type: 'enum',
              enum: ['BOY', 'GIRL', 'OTHER'],
              isNullable: false,
            },
            {
              name: 'motherTongueProficiency',
              type: 'enum',
              enum: ['NONE', 'SOME', 'FLUENT'],
              isNullable: false,
            },
            {
              name: 'englishReadingLevel',
              type: 'enum',
              enum: ['NONE', 'WORDS', 'SENTENCES', 'FLUENT'],
              isNullable: false,
            },
            {
              name: 'englishSpeakingLevel',
              type: 'enum',
              enum: ['NONE', 'WORDS', 'SENTENCES', 'FLUENT'],
              isNullable: false,
            },
            {
              name: 'learningDuration',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'hobbies',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'userId',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'now()',
              onUpdate: 'now()',
            },
          ],
        }),
        true,
      );

      // 2. Add Foreign Key
      await queryRunner.createForeignKey(
        'kids',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    } else {
      // If table exists, check if foreign key exists before adding it
      const table = await queryRunner.getTable('kids');
      const foreignKey = table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );

      if (!foreignKey) {
        await queryRunner.createForeignKey(
          'kids',
          new TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const table = await queryRunner.getTable('kids');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('kids', foreignKey);
      }
    }

    // Drop kids table
    await queryRunner.dropTable('kids');
  }
}
