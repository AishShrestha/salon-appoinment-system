import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedResetPasswordToken1768353835481 implements MigrationInterface {
    name = 'AddedResetPasswordToken1768353835481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token_expiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token_expiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
    }

}
