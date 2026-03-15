import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherStatsToUsers1773220563197 implements MigrationInterface {
  name = 'AddTeacherStatsToUsers1773220563197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only add the missing columns to avoid foreign key and UUID migration issues
    // Check if columns exist first to be safe
    const columns = (await queryRunner.query(
      `SHOW COLUMNS FROM \`users\``,
    )) as { Field: string }[];
    const hasCommitmentScore = columns.some(
      (col) => col.Field === 'commitmentScore',
    );
    const hasCompetenceLevel = columns.some(
      (col) => col.Field === 'competenceLevel',
    );

    if (!hasCommitmentScore) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`commitmentScore\` int NOT NULL DEFAULT '10'`,
      );
    }
    if (!hasCompetenceLevel) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`competenceLevel\` varchar(255) NOT NULL DEFAULT 'average'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`competenceLevel\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`commitmentScore\``,
    );
  }
}
