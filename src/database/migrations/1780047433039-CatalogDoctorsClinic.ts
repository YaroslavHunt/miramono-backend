import { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogDoctorsClinic1780047433039 implements MigrationInterface {
    name = 'CatalogDoctorsClinic1780047433039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(160) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "duration_minutes" integer, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "category_id" uuid NOT NULL, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" text, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_fe4da5476c4ffe5aa2d3524ae68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_88a33271b3d94a0c4bc14db3b7" ON "service_categories"  ("slug") `);
        await queryRunner.query(`CREATE TABLE "clinic_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "phone" character varying(50) NOT NULL, "email" character varying(255), "address" character varying(300) NOT NULL, "working_hours" character varying(200) NOT NULL, "map_url" character varying(1000), "instagram_url" character varying(500), "facebook_url" character varying(500), "telegram_url" character varying(500), "years_experience" integer NOT NULL DEFAULT '0', "happy_patients" integer NOT NULL DEFAULT '0', "specialists_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_f8affb1a25ecc08164a2af34832" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "specialization" character varying(160) NOT NULL, "description" text, "photo_url" character varying(500), "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
        await queryRunner.query(`DROP TABLE "clinic_info"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88a33271b3d94a0c4bc14db3b7"`);
        await queryRunner.query(`DROP TABLE "service_categories"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }

}
