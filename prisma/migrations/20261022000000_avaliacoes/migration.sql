-- AlterTable
ALTER TABLE "professionals" ADD COLUMN     "ask_reviews" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "review_requested_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "professional_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_appointment_id_key" ON "reviews"("appointment_id");

-- CreateIndex
CREATE INDEX "reviews_professional_id_hidden_created_at_idx" ON "reviews"("professional_id", "hidden", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Regras que o Prisma não expressa
ALTER TABLE "reviews"
  ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_comment_len CHECK (char_length(comment) <= 1000);
