-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxPricePerHour" DOUBLE PRECISION,
    "minRating" DOUBLE PRECISION,
    "onlyVerified" BOOLEAN NOT NULL DEFAULT false,
    "preferOnline" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelMode" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreference_clientId_key" ON "ClientPreference"("clientId");

-- CreateIndex
CREATE INDEX "TravelMode_active_startsAt_endsAt_idx" ON "TravelMode"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "TravelMode_city_idx" ON "TravelMode"("city");

-- CreateIndex
CREATE INDEX "TravelMode_professionalId_idx" ON "TravelMode"("professionalId");

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelMode" ADD CONSTRAINT "TravelMode_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

