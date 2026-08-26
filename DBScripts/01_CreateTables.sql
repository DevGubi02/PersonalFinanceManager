-- =====================================================================
-- FILE: 01_CreateTables.sql
-- PURPOSE: Creates the database and all tables for the Finance Tracker.
-- HOW TO RUN: Open this file in SQL Server Management Studio (SSMS) or
--             Azure Data Studio, connect to your SQL Server, and click "Execute".
--             Run this file FIRST, before 02_StoredProcedures.sql.
-- =====================================================================

-- Create the database only if it does not already exist (safe to re-run).
IF DB_ID('FinanceDb') IS NULL          -- DB_ID returns NULL when the database is missing.
    CREATE DATABASE FinanceDb;         -- Create the database that holds all our tables.
GO                                     -- GO tells SQL Server to run the batch above before continuing.

-- Switch to our database so the following commands run inside it.
USE FinanceDb;
GO

-- ---------------------------------------------------------------------
-- TABLE: Users  (one row per person who signs up)
-- ---------------------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NULL          -- Only create the table if it does not exist yet.
BEGIN
    CREATE TABLE dbo.Users
    (
        Id           INT IDENTITY(1,1) PRIMARY KEY,   -- Auto-incrementing unique id for each user.
        Email        NVARCHAR(256) NOT NULL UNIQUE,   -- Login email; UNIQUE stops duplicate accounts.
        FullName     NVARCHAR(100) NOT NULL,          -- The user's display name.
        PasswordHash NVARCHAR(256) NOT NULL,          -- The scrambled password (never plain text).
        CreatedAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME() -- When the account was created (UTC).
    );
END
GO

-- ---------------------------------------------------------------------
-- TABLE: Categories  (spending/earning groups, e.g. Food, Salary)
-- ---------------------------------------------------------------------
IF OBJECT_ID('dbo.Categories', 'U') IS NULL          -- Only create if it does not exist yet.
BEGIN
    CREATE TABLE dbo.Categories
    (
        Id     INT IDENTITY(1,1) PRIMARY KEY,          -- Auto-incrementing unique id for each category.
        UserId INT NOT NULL,                           -- Which user owns this category.
        Name   NVARCHAR(50) NOT NULL,                  -- The category name shown in the app.
        Type   NVARCHAR(10) NOT NULL,                  -- "Income" or "Expense".
        -- Link each category to a real user; if the user is deleted, delete their categories too.
        CONSTRAINT FK_Categories_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
END
GO

-- ---------------------------------------------------------------------
-- TABLE: Transactions  (each income or expense entry)
-- ---------------------------------------------------------------------
IF OBJECT_ID('dbo.Transactions', 'U') IS NULL         -- Only create if it does not exist yet.
BEGIN
    CREATE TABLE dbo.Transactions
    (
        Id          INT IDENTITY(1,1) PRIMARY KEY,     -- Auto-incrementing unique id for each transaction.
        UserId      INT NOT NULL,                      -- Which user owns this transaction.
        CategoryId  INT NOT NULL,                      -- Which category this transaction belongs to.
        Amount      DECIMAL(18,2) NOT NULL,            -- The money amount, with 2 decimal places.
        Type        NVARCHAR(10) NOT NULL,             -- "Income" or "Expense".
        Description NVARCHAR(250) NULL,                -- Optional short note about the transaction.
        [Date]      DATETIME2 NOT NULL,                -- When the transaction happened.
        -- Link each transaction to a user; delete transactions if the user is deleted.
        CONSTRAINT FK_Transactions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        -- Link each transaction to a category (kept separate so we do not accidentally delete history).
        CONSTRAINT FK_Transactions_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
    );
END
GO

-- ---------------------------------------------------------------------
-- TABLE: Budgets  (monthly spending limits per category)
-- ---------------------------------------------------------------------
IF OBJECT_ID('dbo.Budgets', 'U') IS NULL              -- Only create if it does not exist yet.
BEGIN
    CREATE TABLE dbo.Budgets
    (
        Id           INT IDENTITY(1,1) PRIMARY KEY,    -- Auto-incrementing unique id for each budget.
        UserId       INT NOT NULL,                     -- Which user owns this budget.
        CategoryId   INT NOT NULL,                     -- Which category this budget limits.
        MonthlyLimit DECIMAL(18,2) NOT NULL,           -- The maximum amount planned for the month.
        [Month]      INT NOT NULL,                     -- Month number (1-12).
        [Year]       INT NOT NULL,                     -- Year (e.g. 2026).
        -- Link each budget to a user; delete budgets if the user is deleted.
        CONSTRAINT FK_Budgets_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        -- Link each budget to a category.
        CONSTRAINT FK_Budgets_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
    );
END
GO

PRINT 'Tables created successfully.';   -- Print a friendly message when the script finishes.
GO
