-- =====================================================================
-- FILE: 02_StoredProcedures.sql
-- PURPOSE: Creates all stored procedures the API uses to read/write data.
--          Stored procedures with parameters protect us from SQL injection.
-- HOW TO RUN: Run this AFTER 01_CreateTables.sql, in the same way (Execute in SSMS).
-- =====================================================================

USE FinanceDb;   -- Make sure we are working inside our database.
GO

-- =====================================================================
-- USERS / AUTHENTICATION
-- =====================================================================

-- Create a new user account. Returns the new user's Id.
CREATE OR ALTER PROCEDURE dbo.usp_CreateUser   -- "CREATE OR ALTER" lets us re-run this file safely.
    @Email        NVARCHAR(256),               -- The login email passed in from the API.
    @FullName     NVARCHAR(100),               -- The display name passed in from the API.
    @PasswordHash NVARCHAR(256)                -- The already-hashed password passed in from the API.
AS
BEGIN
    SET NOCOUNT ON;                            -- Do not send extra "rows affected" messages (cleaner output).

    -- Insert the new user row into the Users table.
    INSERT INTO dbo.Users (Email, FullName, PasswordHash)
    VALUES (@Email, @FullName, @PasswordHash);

    -- Return the id of the row we just inserted, so the API knows the new user's id.
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewUserId;
END
GO

-- Look up a user by their email (used during login). Returns their stored hash to verify the password.
CREATE OR ALTER PROCEDURE dbo.usp_GetUserByEmail
    @Email NVARCHAR(256)                       -- The email the person typed on the login screen.
AS
BEGIN
    SET NOCOUNT ON;                            -- Suppress extra messages.

    -- Return the user's core fields for the given email (or nothing if not found).
    SELECT Id, Email, FullName, PasswordHash
    FROM dbo.Users
    WHERE Email = @Email;                      -- Parameterized filter = safe from SQL injection.
END
GO

-- =====================================================================
-- CATEGORIES
-- =====================================================================

-- Get all categories that belong to one user.
CREATE OR ALTER PROCEDURE dbo.usp_GetCategories
    @UserId INT                                -- Only fetch categories owned by this user.
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, UserId, Name, Type
    FROM dbo.Categories
    WHERE UserId = @UserId                     -- Enforce per-user data isolation.
    ORDER BY Name;                             -- Return them in alphabetical order for a tidy list.
END
GO

-- Create a new category for a user. Returns the new category's Id.
CREATE OR ALTER PROCEDURE dbo.usp_CreateCategory
    @UserId INT,                               -- The owner of the new category.
    @Name   NVARCHAR(50),                      -- The category name.
    @Type   NVARCHAR(10)                       -- "Income" or "Expense".
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Categories (UserId, Name, Type)
    VALUES (@UserId, @Name, @Type);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewCategoryId;   -- Hand back the new id.
END
GO

-- Delete a category, but only if it belongs to the requesting user (security check).
CREATE OR ALTER PROCEDURE dbo.usp_DeleteCategory
    @Id     INT,                               -- The category to delete.
    @UserId INT                                -- The user asking to delete it.
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Categories
    WHERE Id = @Id AND UserId = @UserId;       -- The UserId check stops users deleting others' data.
END
GO

-- =====================================================================
-- TRANSACTIONS
-- =====================================================================

-- Get all transactions for one user, newest first, including the category name.
CREATE OR ALTER PROCEDURE dbo.usp_GetTransactions
    @UserId INT                                -- Only fetch this user's transactions.
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.Id, t.UserId, t.CategoryId, t.Amount, t.Type, t.Description, t.[Date],
           c.Name AS CategoryName             -- Join in the category name for display convenience.
    FROM dbo.Transactions t
    INNER JOIN dbo.Categories c ON c.Id = t.CategoryId   -- Match each transaction to its category.
    WHERE t.UserId = @UserId                   -- Enforce per-user data isolation.
    ORDER BY t.[Date] DESC;                    -- Show the most recent transactions first.
END
GO

-- Create a new transaction for a user. Returns the new transaction's Id.
CREATE OR ALTER PROCEDURE dbo.usp_CreateTransaction
    @UserId      INT,                          -- The owner of the transaction.
    @CategoryId  INT,                          -- The category it belongs to.
    @Amount      DECIMAL(18,2),                -- The money amount.
    @Type        NVARCHAR(10),                 -- "Income" or "Expense".
    @Description NVARCHAR(250),                -- Optional note.
    @Date        DATETIME2                     -- When it happened.
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Transactions (UserId, CategoryId, Amount, Type, Description, [Date])
    VALUES (@UserId, @CategoryId, @Amount, @Type, @Description, @Date);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewTransactionId;   -- Hand back the new id.
END
GO

-- Update an existing transaction, only if it belongs to the requesting user.
CREATE OR ALTER PROCEDURE dbo.usp_UpdateTransaction
    @Id          INT,                          -- Which transaction to update.
    @UserId      INT,                          -- The user asking to update it (security check).
    @CategoryId  INT,                          -- New category.
    @Amount      DECIMAL(18,2),                -- New amount.
    @Type        NVARCHAR(10),                 -- New type.
    @Description NVARCHAR(250),                -- New note.
    @Date        DATETIME2                     -- New date.
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Transactions
    SET CategoryId  = @CategoryId,             -- Apply the new category.
        Amount      = @Amount,                 -- Apply the new amount.
        Type        = @Type,                   -- Apply the new type.
        Description = @Description,            -- Apply the new note.
        [Date]      = @Date                    -- Apply the new date.
    WHERE Id = @Id AND UserId = @UserId;       -- Only if this user owns the row.
END
GO

-- Delete a transaction, only if it belongs to the requesting user.
CREATE OR ALTER PROCEDURE dbo.usp_DeleteTransaction
    @Id     INT,                               -- Which transaction to delete.
    @UserId INT                                -- The user asking (security check).
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Transactions
    WHERE Id = @Id AND UserId = @UserId;       -- The UserId check protects other users' data.
END
GO

-- =====================================================================
-- BUDGETS
-- =====================================================================

-- Get all budgets for one user.
CREATE OR ALTER PROCEDURE dbo.usp_GetBudgets
    @UserId INT                                -- Only fetch this user's budgets.
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, UserId, CategoryId, MonthlyLimit, [Month], [Year]
    FROM dbo.Budgets
    WHERE UserId = @UserId;                    -- Enforce per-user data isolation.
END
GO

-- Create a new budget for a user. Returns the new budget's Id.
CREATE OR ALTER PROCEDURE dbo.usp_CreateBudget
    @UserId       INT,                         -- The owner of the budget.
    @CategoryId   INT,                         -- The category it limits.
    @MonthlyLimit DECIMAL(18,2),               -- The spending limit.
    @Month        INT,                         -- Month number (1-12).
    @Year         INT                          -- Year.
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Budgets (UserId, CategoryId, MonthlyLimit, [Month], [Year])
    VALUES (@UserId, @CategoryId, @MonthlyLimit, @Month, @Year);
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewBudgetId;   -- Hand back the new id.
END
GO

-- Delete a budget, only if it belongs to the requesting user.
CREATE OR ALTER PROCEDURE dbo.usp_DeleteBudget
    @Id     INT,                               -- Which budget to delete.
    @UserId INT                                -- The user asking (security check).
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Budgets
    WHERE Id = @Id AND UserId = @UserId;       -- Protect other users' data.
END
GO

-- =====================================================================
-- DASHBOARD / REPORTS
-- =====================================================================

-- Summarize a user's money per category between two dates (used for charts and reports).
CREATE OR ALTER PROCEDURE dbo.usp_GetDashboardSummary
    @UserId    INT,                            -- Whose data to summarize.
    @StartDate DATETIME2,                       -- Start of the period (inclusive).
    @EndDate   DATETIME2                        -- End of the period (inclusive).
AS
BEGIN
    SET NOCOUNT ON;
    -- Group all transactions in the date range by category, adding up the amounts.
    SELECT c.Name AS CategoryName,             -- The category name for the chart label.
           t.Type,                             -- Whether the group is income or expense.
           SUM(t.Amount) AS Total              -- The total money for this category.
    FROM dbo.Transactions t
    INNER JOIN dbo.Categories c ON c.Id = t.CategoryId   -- Attach the category name.
    WHERE t.UserId = @UserId                   -- Only this user's data.
      AND t.[Date] >= @StartDate               -- On or after the start date.
      AND t.[Date] <= @EndDate                 -- On or before the end date.
    GROUP BY c.Name, t.Type                    -- One row per category + type.
    ORDER BY Total DESC;                       -- Biggest amounts first.
END
GO

PRINT 'Stored procedures created successfully.';   -- Friendly message when the script finishes.
GO
