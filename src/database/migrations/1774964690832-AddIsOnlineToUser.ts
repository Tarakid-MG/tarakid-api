import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsOnlineToUser1774964690832 implements MigrationInterface {
  name = 'AddIsOnlineToUser1774964690832';

  public async up(queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
