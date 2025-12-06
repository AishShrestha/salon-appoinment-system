import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1765010439472 implements MigrationInterface {
    name = 'Initial1765010439472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "duration" integer NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")); COMMENT ON COLUMN "services"."duration" IS 'Duration in minutes'`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_logs_status_enum" AS ENUM('success', 'failure')`);
        await queryRunner.query(`CREATE TABLE "appointment_logs" ("id" SERIAL NOT NULL, "appointment_id" integer NOT NULL, "status" "public"."appointment_logs_status_enum" NOT NULL, "message" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6cec5201edf8cab90b082d4e287" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('pending', 'confirmed', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "service_id" integer NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'pending', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bulk_job_logs_status_enum" AS ENUM('success', 'failure')`);
        await queryRunner.query(`CREATE TABLE "bulk_job_logs" ("id" SERIAL NOT NULL, "bulk_job_id" integer NOT NULL, "appointment_data" jsonb NOT NULL, "status" "public"."bulk_job_logs_status_enum" NOT NULL, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33cf44f98369d9bb1e6cbfb6439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bulk_jobs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "bulk_jobs" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "file_name" character varying(255) NOT NULL, "status" "public"."bulk_jobs_status_enum" NOT NULL DEFAULT 'pending', "total_appointments" integer NOT NULL DEFAULT '0', "success_count" integer NOT NULL DEFAULT '0', "failure_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ce068dac8365125a4ce2f94c23e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_templates" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "subject" character varying(500) NOT NULL, "body" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "break_periods" ("id" SERIAL NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "description" character varying(500), CONSTRAINT "PK_11afa71c0d8a4c14fd71cc7b283" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointment_logs" ADD CONSTRAINT "FK_b73bf9621ac547a1d6005178520" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_66dee3bea82328659a4db8e54b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_job_logs" ADD CONSTRAINT "FK_adef40b358aedb359f5b68a7ee5" FOREIGN KEY ("bulk_job_id") REFERENCES "bulk_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bulk_jobs" ADD CONSTRAINT "FK_6953810a149c234501b5764468c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bulk_jobs" DROP CONSTRAINT "FK_6953810a149c234501b5764468c"`);
        await queryRunner.query(`ALTER TABLE "bulk_job_logs" DROP CONSTRAINT "FK_adef40b358aedb359f5b68a7ee5"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_66dee3bea82328659a4db8e54b7"`);
        await queryRunner.query(`ALTER TABLE "appointment_logs" DROP CONSTRAINT "FK_b73bf9621ac547a1d6005178520"`);
        await queryRunner.query(`DROP TABLE "break_periods"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "bulk_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."bulk_jobs_status_enum"`);
        await queryRunner.query(`DROP TABLE "bulk_job_logs"`);
        await queryRunner.query(`DROP TYPE "public"."bulk_job_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`DROP TABLE "appointment_logs"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }

}
