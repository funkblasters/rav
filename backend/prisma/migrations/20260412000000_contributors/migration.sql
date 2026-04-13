-- CreateTable: new contributors join table (replaces _TogetherWith)
CREATE TABLE "_FlagContributors" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FlagContributors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FlagContributors_B_index" ON "_FlagContributors"("B");

-- AddForeignKey
ALTER TABLE "_FlagContributors" ADD CONSTRAINT "_FlagContributors_A_fkey" FOREIGN KEY ("A") REFERENCES "flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlagContributors" ADD CONSTRAINT "_FlagContributors_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: seed contributors from existing primary adders
INSERT INTO "_FlagContributors" ("A", "B")
SELECT "id", "addedById" FROM "flags"
ON CONFLICT DO NOTHING;

-- MigrateData: seed contributors from existing togetherWith entries
INSERT INTO "_FlagContributors" ("A", "B")
SELECT "A", "B" FROM "_TogetherWith"
ON CONFLICT DO NOTHING;

-- DropTable: remove old togetherWith join table
DROP TABLE "_TogetherWith";
