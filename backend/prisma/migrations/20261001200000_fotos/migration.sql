-- CreateTable
CREATE TABLE "Foto" (
    "id" SERIAL NOT NULL,
    "dados" BYTEA NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);
