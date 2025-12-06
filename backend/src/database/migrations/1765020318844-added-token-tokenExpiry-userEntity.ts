import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTokenTokenExpiryUserEntity1765020318844 implements MigrationInterface {
    name = 'AddedTokenTokenExpiryUserEntity1765020318844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "verification_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verification_token_expiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_token_expiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_token"`);
    }

}
