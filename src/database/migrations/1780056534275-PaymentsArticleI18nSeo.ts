import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentsArticleI18nSeo1780056534275 implements MigrationInterface {
    name = 'PaymentsArticleI18nSeo1780056534275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILURE')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "liqpay_order_id" character varying(100) NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'UAH', "description" character varying(255) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "appointment_id" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_262145a4352328ae619a6e0ba4" ON "payments"  ("liqpay_order_id") `);
        await queryRunner.query(`ALTER TABLE "articles" ADD "meta_title" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "meta_description" character varying(300)`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "translations" jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9f49987820da519f855d04c82bd" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9f49987820da519f855d04c82bd"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "translations"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "meta_description"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "meta_title"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_262145a4352328ae619a6e0ba4"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    }

}
