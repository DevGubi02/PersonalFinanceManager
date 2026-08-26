# 💰 Personal Finance Tracker

A simple, secure personal finance tracker for everyday people. Track your income and expenses, organise them into categories, set monthly budgets, see a dashboard with charts, and export your data to CSV.

This project has **two parts**:

| Part | Folder | Technology |
| --- | --- | --- |
| **Backend (the API)** | `PersonalFinanceManager/FinanceTrackerAPI` | ASP.NET Core Web API (.NET 10) + SQL Server + stored procedures |
| **Frontend (the website)** | `personal-finance-manager` | Angular 21 + Bootstrap 5 |

> **Note:** There is also an unused `FinanceManagerWebApi` folder from an earlier attempt. You can ignore it, or remove it from the solution in Visual Studio (right-click → Remove). Only `FinanceTrackerAPI` is used.

---

## 🔒 How your data is kept safe

- **Passwords are never stored as plain text.** They are hashed with **BCrypt** (a slow, salted hashing algorithm designed for passwords).
- **Login uses JWT tokens.** After you log in, the app gets a signed token and sends it with every request. The server verifies the signature.
- **Every page except login/register requires a valid token** (enforced by `[Authorize]`).
- **Each user only sees their own data.** Every database query filters by the user id taken from the *token* (never from anything the browser sends), so no one can read or change another person's data.
- **No SQL injection.** All database access goes through **stored procedures with parameters** — user input is never concatenated into SQL text.
- **HTTPS is enforced** and the API only accepts requests from the Angular app (CORS).

---

## ✅ What you need to install first

1. **.NET 10 SDK** — [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
2. **SQL Server** — either:- SQL Server Express (free), or
- SQL Server LocalDB (comes with Visual Studio), or
- the full SQL Server.
3. **Node.js 20+** (includes npm) — [https://nodejs.org](https://nodejs.org)
4. A tool to run SQL scripts: **SQL Server Management Studio (SSMS)** or **Azure Data Studio** (both free).

---

## 🗄️ Step 1 — Set up the database

1. Open **SSMS** (or Azure Data Studio) and connect to your SQL Server.
2. Open and **Execute** these scripts from `FinanceTrackerAPI/Sql/` **in order**:1. `01_CreateTables.sql` → creates the `FinanceDb` database and all tables.
2. `02_StoredProcedures.sql` → creates every stored procedure the API uses.
3. `03_SeedData.sql` → *(optional)* run this **after** you register a user, to add some starter categories. Follow the comments inside it.

### Check your connection string

Open `FinanceTrackerAPI/appsettings.json` and make sure `DefaultConnection` points at your SQL Server. Common examples:

```jsonc
// LocalDB (Visual Studio):
"DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=FinanceDb;Trusted_Connection=True;TrustServerCertificate=True;"

// SQL Server Express:
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=FinanceDb;Trusted_Connection=True;TrustServerCertificate=True;"

```

---

## 🔧 Step 2 — Run the backend (API)

Open a terminal in the `FinanceTrackerAPI` folder and run:

```bash
dotnet restore    # download the packages (BCrypt, JWT, EF Core)
dotnet run        # start the API

```

The terminal will print the address it is listening on, for example `https://localhost:7000`. **Note that port number** — you need it in the next step.

> **Change the JWT secret before real use.** In `appsettings.json`, replace `"Jwt:Key": "dev_secret_key_please_change"` with a long, random secret.

---

## 🖥️ Step 3 — Run the frontend (website)

1. Open `personal-finance-manager/src/environments/environment.ts` and set `apiUrl` to match the port your API printed, e.g.:```ts
apiUrl: 'https://localhost:7000/api'

```
2. Open a terminal in the `personal-finance-manager` folder and run:```bash
npm install      # download the Angular packages
npm start        # start the website (ng serve)

```
3. Open your browser at **[http://localhost:4200](http://localhost:4200)**.

---

## 🚀 Step 4 — Use the app

1. Click **Create an account** and register (name, email, password of 8+ characters).
2. You are taken to the **Dashboard**.
3. Go to **Categories** and add a few (e.g. Food, Salary) — or run `03_SeedData.sql`.
4. Go to **Transactions** and add income/expense entries.
5. Come back to the **Dashboard** to see totals and a per-category chart.
6. Set spending limits on the **Budgets** page.
7. On **Transactions**, click **Export CSV** to download your data for Excel.

---

## 📁 Project structure

```
PersonalFinanceManager/               ← Backend solution
└── FinanceTrackerAPI/
    ├── Controllers/    ← API endpoints (Auth, Transactions, Categories, Budgets, Dashboard)
    ├── Data/           ← Repositories that call stored procedures
    ├── Models/         ← Data classes (User, Category, Budget, Transaction, reports)
    ├── Services/       ← PasswordHasher (BCrypt) + TokenService (JWT)
    ├── Sql/            ← Database scripts: run 01, then 02, then 03
    ├── Program.cs      ← App startup: wires up auth, CORS, DB, services
    └── appsettings.json← Connection string + JWT secret + allowed origin

personal-finance-manager/             ← Frontend (Angular)
└── src/app/
    ├── auth/login/     ← Login page
    ├── create-users/   ← Registration page
    ├── dashboard/      ← Totals + charts
    ├── transactions/   ← Add/list/delete + CSV export
    ├── categories/     ← Manage categories
    ├── budgets/        ← Manage monthly budgets
    ├── shared/nav/     ← Top navigation bar
    ├── services/       ← auth, api, interceptor (adds token), guard (protects pages)
    └── models/         ← TypeScript data shapes

```

---

## 💬 A note on the code comments

Every code file is commented line-by-line to explain what each part does, so you can read through it and learn how a real full-stack app is built. Start with:

- `Program.cs` — how the backend starts and what security is turned on.
- `services/auth.ts` and `services/api.ts` — how the website talks to the API.
- `Sql/01_CreateTables.sql` — how the data is stored.

Happy tracking! 🎉

```


```

