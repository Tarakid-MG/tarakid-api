import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsers1768745580765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                    { name: 'email', type: 'varchar', isUnique: true },
                    { name: 'password', type: 'varchar' },
                    { name: 'role', type: 'enum', enum: ['admin', 'teacher', 'staff', 'client'] },
                    { name: 'accountType', type: 'enum', enum: ['parent', 'kid'], isNullable: true },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
    }

}
