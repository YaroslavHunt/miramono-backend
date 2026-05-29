import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentEngagement1780054351821 implements MigrationInterface {
    name = 'ContentEngagement1780054351821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."articles_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "excerpt" character varying(500), "content" text NOT NULL, "cover_image_url" character varying(500), "status" "public"."articles_status_enum" NOT NULL DEFAULT 'DRAFT', "published_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1123ff6815c5b8fec0ba9fec37" ON "articles"  ("slug") `);
        await queryRunner.query(`CREATE TABLE "gallery_cases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(200), "description" text, "before_image_url" character varying(500) NOT NULL, "after_image_url" character varying(500) NOT NULL, "is_published" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "doctor_id" uuid, "service_id" uuid, CONSTRAINT "PK_b822f6bdd5c188ef5072f2d566e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "author_name" character varying(160) NOT NULL, "rating" integer NOT NULL, "text" text NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "doctor_id" uuid, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gallery_cases" ADD CONSTRAINT "FK_622e48f903b8987c1d6969ec221" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gallery_cases" ADD CONSTRAINT "FK_5e4f5f3ee96f375e246fa4ea860" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_eefa239f3536811d445eae9250b" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_eefa239f3536811d445eae9250b"`);
        await queryRunner.query(`ALTER TABLE "gallery_cases" DROP CONSTRAINT "FK_5e4f5f3ee96f375e246fa4ea860"`);
        await queryRunner.query(`ALTER TABLE "gallery_cases" DROP CONSTRAINT "FK_622e48f903b8987c1d6969ec221"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "gallery_cases"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1123ff6815c5b8fec0ba9fec37"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TYPE "public"."articles_status_enum"`);
    }

}
