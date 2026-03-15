import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderToUnits1772040000000 implements MigrationInterface {
  name = 'AddOrderToUnits1772040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'units',
      new TableColumn({
        name: 'order',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('units', 'order');
  }
}
