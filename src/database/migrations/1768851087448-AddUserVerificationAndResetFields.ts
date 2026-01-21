import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserVerificationAndResetFields1768851087448 implements MigrationInterface {
    name = 'AddUserVerificationAndResetFields1768851087448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`isVerified\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`verificationToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`resetPasswordToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`resetPasswordExpires\` timestamp NULL`);

        // Handling createdAt and updatedAt specifically since they might exist but need update or addition
        // I'll try to add them if they don't exist, or just leave them if they do.
        // Given the previous migration didn't have them, they might have been created by TypeORM automatically if synchronize was true once.
        // But the safest is to only add what's missing.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`resetPasswordExpires\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`resetPasswordToken\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`verificationToken\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`isVerified\``);
    }

}
