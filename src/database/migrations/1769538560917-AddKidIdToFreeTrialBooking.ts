import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKidIdToFreeTrialBooking1769538560917 implements MigrationInterface {
  name = 'AddKidIdToFreeTrialBooking1769538560917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` ADD \`kidId\` uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` ADD CONSTRAINT \`FK_019e160284bc47c171261fef690\` FOREIGN KEY (\`kidId\`) REFERENCES \`kids\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP FOREIGN KEY \`FK_019e160284bc47c171261fef690\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP COLUMN \`kidId\``,
    );
  }
}
