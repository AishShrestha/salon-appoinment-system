import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedPaymentEntity1768711350539 implements MigrationInterface {
    name = 'AddedPaymentEntity1768711350539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "pidx" character varying(64) NOT NULL, "gateway" character varying(32) NOT NULL, "amount" numeric(10,2) NOT NULL, "status" character varying(32) NOT NULL, "rawResponse" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_49c8b1ee118d5792240e7a1eb84" UNIQUE ("pidx"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "payment_id" integer`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_c10bb3b24a5c2886176240bbd4e" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_c10bb3b24a5c2886176240bbd4e"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "payment_id"`);
        await queryRunner.query(`DROP TABLE "payments"`);
    }

}
