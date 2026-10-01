-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoInteracao" AS ENUM ('FAVORITO', 'VOU', 'VISUALIZOU');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Local" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "endereco" VARCHAR(150) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "bairro" VARCHAR(80),
    "cidade" VARCHAR(80) NOT NULL,
    "foto" TEXT,
    "adminId" INTEGER NOT NULL,

    CONSTRAINT "Local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genero" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(40) NOT NULL,

    CONSTRAINT "Genero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" SERIAL NOT NULL,
    "atracao" VARCHAR(100) NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" VARCHAR(1000) NOT NULL,
    "generoId" INTEGER NOT NULL,
    "localId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha" TEXT NOT NULL,
    "preferenciasAtivas" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interacao" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoInteracao" NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "showId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PreferenciasCliente" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PreferenciasCliente_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Local_adminId_key" ON "Local"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Genero_nome_key" ON "Genero"("nome");

-- CreateIndex
CREATE INDEX "Show_dataHora_idx" ON "Show"("dataHora");

-- CreateIndex
CREATE INDEX "Show_generoId_idx" ON "Show"("generoId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE INDEX "Interacao_showId_idx" ON "Interacao"("showId");

-- CreateIndex
CREATE UNIQUE INDEX "Interacao_clienteId_showId_tipo_key" ON "Interacao"("clienteId", "showId", "tipo");

-- CreateIndex
CREATE INDEX "_PreferenciasCliente_B_index" ON "_PreferenciasCliente"("B");

-- AddForeignKey
ALTER TABLE "Local" ADD CONSTRAINT "Local_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "Genero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interacao" ADD CONSTRAINT "Interacao_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferenciasCliente" ADD CONSTRAINT "_PreferenciasCliente_A_fkey" FOREIGN KEY ("A") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreferenciasCliente" ADD CONSTRAINT "_PreferenciasCliente_B_fkey" FOREIGN KEY ("B") REFERENCES "Genero"("id") ON DELETE CASCADE ON UPDATE CASCADE;
