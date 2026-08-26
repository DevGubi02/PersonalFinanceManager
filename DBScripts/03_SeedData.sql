-- =====================================================================
-- FILE: 03_SeedData.sql  (OPTIONAL)
-- PURPOSE: Adds a few starter categories for a given user so the app is
--          not completely empty the first time you log in.
-- HOW TO RUN: Run this AFTER you have registered a user in the app.
--             First find your user id (see the query below), then set
--             @UserId and run the rest.
-- =====================================================================

USE FinanceDb;   -- Work inside our database.
GO

-- STEP 1: Find your user id by looking at the Users table.
--         Run just this line, note your Id, then continue below.
SELECT Id, Email, FullName FROM dbo.Users;
GO

-- STEP 2: Put your user id here (replace the 1 with your real Id from above).
DECLARE @UserId INT = 1;

-- Add some common expense categories (only if they do not already exist for this user).
INSERT INTO dbo.Categories (UserId, Name, Type)
SELECT @UserId, v.Name, v.Type
FROM (VALUES
    ('Food', 'Expense'),          -- Groceries and eating out.
    ('Rent', 'Expense'),          -- Housing rent.
    ('Transport', 'Expense'),     -- Bus, fuel, taxi, etc.
    ('Utilities', 'Expense'),     -- Electricity, water, internet.
    ('Entertainment', 'Expense'), -- Movies, subscriptions.
    ('Salary', 'Income'),         -- Monthly salary.
    ('Other Income', 'Income')    -- Any other money coming in.
) AS v(Name, Type)
-- Only insert a category if the user does not already have one with the same name.
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Categories c
    WHERE c.UserId = @UserId AND c.Name = v.Name
);
GO

PRINT 'Seed categories added (if they were missing).';   -- Friendly confirmation.
GO
