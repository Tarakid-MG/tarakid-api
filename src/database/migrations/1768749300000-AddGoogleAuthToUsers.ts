import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleAuthToUsers1768749300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'googleId',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'googleId');

    // Reverting password to not null might fail if there are null values,
    // but for down migration we assume we want to restore schema.
    // In a real scenario, we'd need to handle null passwords (e.g. delete those users or set a dummy password).
    // For now, we will try to set it back to not null.
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
