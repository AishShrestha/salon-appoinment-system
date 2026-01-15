import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedRescheduleEnumTypeAppoinmentLogEntity1768490443361 implements MigrationInterface {
    name = 'AddedRescheduleEnumTypeAppoinmentLogEntity1768490443361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."appointment_logs_status_enum" RENAME TO "appointment_logs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_logs_status_enum" AS ENUM('success', 'failure', 'rescheduled')`);
        await queryRunner.query(`ALTER TABLE "appointment_logs" ALTER COLUMN "status" TYPE "public"."appointment_logs_status_enum" USING "status"::"text"::"public"."appointment_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_logs_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."bulk_job_logs_status_enum" RENAME TO "bulk_job_logs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."bulk_job_logs_status_enum" AS ENUM('success', 'failure', 'rescheduled')`);
        await queryRunner.query(`ALTER TABLE "bulk_job_logs" ALTER COLUMN "status" TYPE "public"."bulk_job_logs_status_enum" USING "status"::"text"::"public"."bulk_job_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bulk_job_logs_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."bulk_job_logs_status_enum_old" AS ENUM('success', 'failure')`);
        await queryRunner.query(`ALTER TABLE "bulk_job_logs" ALTER COLUMN "status" TYPE "public"."bulk_job_logs_status_enum_old" USING "status"::"text"::"public"."bulk_job_logs_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."bulk_job_logs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."bulk_job_logs_status_enum_old" RENAME TO "bulk_job_logs_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_logs_status_enum_old" AS ENUM('success', 'failure')`);
        await queryRunner.query(`ALTER TABLE "appointment_logs" ALTER COLUMN "status" TYPE "public"."appointment_logs_status_enum_old" USING "status"::"text"::"public"."appointment_logs_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_logs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."appointment_logs_status_enum_old" RENAME TO "appointment_logs_status_enum"`);
    }

}
