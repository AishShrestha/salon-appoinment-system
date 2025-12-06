import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedPendingStatusAppoinmentEntity1765031080823 implements MigrationInterface {
    name = 'RemovedPendingStatusAppoinmentEntity1765031080823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."appointments_status_enum" RENAME TO "appointments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('confirmed', 'completed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointments_status_enum" USING "status"::"text"::"public"."appointments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'confirmed'`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum_old" AS ENUM('pending', 'confirmed', 'completed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointments_status_enum_old" USING "status"::"text"::"public"."appointments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."appointments_status_enum_old" RENAME TO "appointments_status_enum"`);
    }

}
