import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingAssignmentHistory1775630553482 implements MigrationInterface {
  name = 'CreateBookingAssignmentHistory1775630553482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`booking_assignment_history\` (\`id\` uuid NOT NULL, \`bookingId\` varchar(255) NOT NULL, \`bookingType\` enum ('REGULAR', 'FREE_TRIAL') NOT NULL, \`previousTeacherId\` int NULL, \`newTeacherId\` int NULL, \`assignedById\` int NOT NULL, \`assignedByRole\` varchar(255) NOT NULL, \`assignedByName\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`booking_assignment_history\``);
  }
}
