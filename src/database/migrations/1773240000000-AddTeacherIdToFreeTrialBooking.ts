import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherIdToFreeTrialBooking1773240000000 implements MigrationInterface {
  name = 'AddTeacherIdToFreeTrialBooking1773240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists first to be safe
    const columns = (await queryRunner.query(
      `SHOW COLUMNS FROM \`free_trial_bookings\``,
    )) as { Field: string }[];
    const hasTeacherId = columns.some((col) => col.Field === 'teacherId');

    if (!hasTeacherId) {
      await queryRunner.query(
        `ALTER TABLE \`free_trial_bookings\` ADD \`teacherId\` int NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE \`free_trial_bookings\` ADD CONSTRAINT \`FK_FREE_TRIAL_BOOKING_TEACHER\` FOREIGN KEY (\`teacherId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP FOREIGN KEY \`FK_FREE_TRIAL_BOOKING_TEACHER\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`free_trial_bookings\` DROP COLUMN \`teacherId\``,
    );
  }
}
