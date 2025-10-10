-- Quick schema update for existing database
USE AlgorithmBattleArina;
GO

-- Add missing columns to Problems table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AlgorithmBattleArinaSchema.Problems') AND name = 'Slug')
    ALTER TABLE AlgorithmBattleArinaSchema.Problems ADD Slug NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AlgorithmBattleArinaSchema.Problems') AND name = 'IsPublic')
    ALTER TABLE AlgorithmBattleArinaSchema.Problems ADD IsPublic BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('AlgorithmBattleArinaSchema.Problems') AND name = 'IsActive')
    ALTER TABLE AlgorithmBattleArinaSchema.Problems ADD IsActive BIT DEFAULT 1;

-- Update existing rows to have default values
UPDATE AlgorithmBattleArinaSchema.Problems 
SET Slug = LOWER(REPLACE(REPLACE(Title, ' ', '-'), '''', ''))
WHERE Slug IS NULL;

UPDATE AlgorithmBattleArinaSchema.Problems 
SET IsPublic = 1 
WHERE IsPublic IS NULL;

UPDATE AlgorithmBattleArinaSchema.Problems 
SET IsActive = 1 
WHERE IsActive IS NULL;

-- Add unique constraint on Slug if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('AlgorithmBattleArinaSchema.Problems') AND name = 'UQ_Problems_Slug')
    ALTER TABLE AlgorithmBattleArinaSchema.Problems ADD CONSTRAINT UQ_Problems_Slug UNIQUE (Slug);