# StockSmart — Retail Inventory Optimization System

StockSmart is a real, enterprise-grade Retail Inventory Optimization platform built with **Java 21, Spring Boot 4, Spring Security, Spring Data JPA / Hibernate, Oracle Database, and Angular 22**. The application delivers a unified desktop and mobile-responsive experience served from a single integrated endpoint at **[http://localhost:8080](http://localhost:8080/)**.

---

## 1. Mandatory Demo Credentials

These demo credentials are pre-seeded idempotently on startup. **All passwords are encrypted with BCrypt hashing before persistence.** Passwords are never stored in plaintext or logged.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@stocksmart.com` | `admin123` | Full administrative control, user creation/editing/deactivation, catalog CRUD, audit log inspection, multi-location stock adjustment & transfers |
| **MANAGER** | `manager@stocksmart.com` | `Manager@123` | Inventory transfers, stock adjustments, purchase order creation, goods receipt, supplier management, analytics reports |
| **STAFF** | `staff@stocksmart.com` | `Staff@123` | Product catalog creation, sales order processing, stock level viewing, barcode lookup, RFID simulation |

*Quick Fill Buttons:* The login page contains 1-click credential fill buttons for each role.

### How to Change Demo Passwords
1. Sign in with the **ADMIN** account at `http://localhost:8080/login`.
2. Navigate to the **User Management** screen (`/users`) in the sidebar.
3. Click the edit icon on the targeted account.
4. Enter the new password. It will be immediately BCrypt-hashed on the backend before updating the Oracle database.

---

## 2. Technology Stack

- **Backend**:
  - Java 21 LTS
  - Spring Boot 4.0.9
  - Spring Security with Stateless JWT Authentication (`io.jsonwebtoken 0.12.6`) & BCrypt
  - Spring Data JPA & Hibernate 7 (safe Oracle table identifiers)
  - Spring WebSocket with STOMP message broker & SockJS
  - Oracle JDBC Driver (`com.oracle.database.jdbc:ojdbc17`)
- **Frontend**:
  - Angular 22 (Standalone Components, Signals, Reactive Forms)
  - TypeScript, HTML5, Vanilla CSS
  - Google Fonts Inter & FontAwesome 6.5.1
  - STOMP client (`@stomp/stompjs` + `sockjs-client`)
- **Database**:
  - Primary: Oracle Database (configured via environment variables)
  - Fallback: Oracle-compatible mode (`MODE=Oracle`) for immediate zero-config demonstration
- **Hosting & Port**:
  - Single consolidated server: **`http://localhost:8080`**

---

## 3. Project Architecture & Folder Structure

```
StockSmart/
│
├── start-stocksmart.bat       # One-click Windows startup script
├── build-all.bat              # One-click build script (Angular prod build + Spring Boot JAR)
├── README.md                  # Comprehensive documentation & test guides
├── PROJECT_STATUS.md          # Verification and testing matrix
│
├── StockSmart/                # Java 21 / Spring Boot Maven Project
│   ├── pom.xml                # Backend dependencies & packaging configuration
│   ├── mvnw / mvnw.cmd        # Maven wrapper
│   └── src/
│       ├── main/java/com/stocksmart/
│       │   ├── config/        # SecurityConfig, JwtUtils, WebSocketConfig, WebMvcConfig, DatabaseConfig
│       │   ├── model/         # User, Location, Product, Category, Inventory, SalesOrder, PurchaseOrder, etc.
│       │   ├── repository/    # Spring Data JPA repositories with Oracle-safe queries
│       │   ├── service/       # Business logic, transactional transfers, audit logging, seeding
│       │   ├── controller/    # REST API Controllers under /api/**
│       │   └── dto/           # Request/Response Data Transfer Objects
│       └── main/resources/
│           ├── application.properties # Server port 8080, JPA settings, JWT secret
│           └── static/        # Embedded Angular production bundle
│
└── frontend/                  # Angular 22 Application (matches reference UI)
    ├── package.json           # Frontend dependencies
    ├── angular.json           # Angular build configuration
    └── src/
        ├── index.html         # Inter font, FontAwesome, SockJS global polyfill
        ├── styles.css         # Dark navy sidebar, purple accents, badge tokens
        └── app/
            ├── layout/        # Navbar, Sidebar, MainLayout
            ├── pages/         # Login, Dashboard, Products, Inventory, Orders, Suppliers,
            │                  # Reports, Barcode-RFID, Locations, Users
            └── services/      # ApiService, AuthService, ToastService, WebsocketService
```

---

## 4. Oracle Database Configuration

Configure your Oracle instance using environment variables:

```powershell
$env:ORACLE_URL="jdbc:oracle:thin:@//localhost:1521/XEPDB1"
$env:ORACLE_USER="stocksmart"
$env:ORACLE_PASSWORD="your_oracle_password"
```

If these environment variables are omitted, StockSmart automatically activates its internal Oracle-compatible engine (`MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH`) so you can run and demonstrate the application instantly without external setup.

### Database Schema Overview
- `APP_USER`: Users, BCrypt passwords, role (`ADMIN`, `MANAGER`, `STAFF`), assigned location.
- `APP_LOCATION`: Outlets & fulfillment warehouses (`Main Store`, `Warehouse A`, `Store B`, `Store C`).
- `APP_CATEGORY`: Catalog categories (`Electronics`, `Apparel`, `Grocery`, `Home & Kitchen`, `Others`).
- `APP_SUPPLIER`: Suppliers (`Tech Distributors`, `Fashion Hub`, `Fresh Foods Ltd`, `Home Essentials`).
- `APP_PRODUCT`: Products with unique SKU, barcode, category, prices, and reorder levels.
- `APP_INVENTORY`: Stock levels per product-location combination (`availableStock`, `reservedStock`).
- `STOCK_MOVEMENT`: Immutable movement log (`PURCHASE_RECEIPT`, `SALES_DEDUCTION`, `TRANSFER_OUT`, `TRANSFER_IN`, `MANUAL_ADJUSTMENT`).
- `SALES_ORDER` & `SALES_ORDER_ITEM`: Customer orders with transactional stock deduction.
- `PURCHASE_ORDER` & `PURCHASE_ORDER_ITEM`: Supplier purchase orders with partial receiving tracking.
- `APP_RFID_TAG`: UHF RFID simulated tags mapped to products and locations.
- `AUDIT_LOG`: Audit trail tracking actors, entity types, actions, timestamps, and descriptions.
- `APP_NOTIFICATION`: Persistent and real-time alerts.

---

## 5. Build and Startup Instructions

### Prerequisites
1. **Java 21 LTS** installed (`java -version`).
2. **Node.js v20+ / v24** and **npm** (`node -v`).

### Option A: One-Click Windows Startup (Recommended)
Double-click `start-stocksmart.bat` or run in PowerShell:
```cmd
.\start-stocksmart.bat
```
This automatically verifies prerequisites, compiles the system if needed, and starts the server on port 8080.

### Option B: Manual Build & Execution
1. **Build Frontend**:
   ```cmd
   cd frontend
   npm install
   npm run build
   xcopy /E /I /Y dist\frontend\browser\* ..\StockSmart\src\main\resources\static\
   cd ..
   ```
2. **Build Backend**:
   ```cmd
   cd StockSmart
   .\mvnw.cmd package -DskipTests
   ```
3. **Run Application**:
   ```cmd
   java -jar target\StockSmart-0.0.1-SNAPSHOT.jar
   ```
4. **Access Application**:
   Open **[http://localhost:8080](http://localhost:8080)** in any modern browser.

---

## 6. Verification & Demonstration Workflows

### 1. STAFF → MANAGER → ADMIN Real-Time Product Synchronization
1. Open two separate browser sessions (or one standard and one incognito window).
2. In window 1, sign in as **ADMIN** (`admin@stocksmart.com` / `admin123`) and open the **Products** page.
3. In window 2, sign in as **STAFF** (`staff@stocksmart.com` / `Staff@123`).
4. In the STAFF window, click **+ Add Product**:
   - Name: `Wireless Gaming Headset`
   - SKU: `ELEC007`
   - Price: `2499`
   - Click **Create Product**.
5. **Observation**:
   - The ADMIN window immediately receives a toast notification: *"Staff member staff@stocksmart.com created product: Wireless Gaming Headset (ELEC007)"*.
   - The product table in the ADMIN window updates automatically without manual refresh.
   - An entry is logged in the **Audit Logs**.

### 2. Multi-Location Stock Calibration & Sales Deduction Workflow
1. Sign in as **ADMIN**.
2. Go to **Inventory** screen.
3. Calibrate stock for **Wireless Mouse (`ELEC001`)**:
   - Main Store: 100 units.
   - Warehouse A: 50 units.
4. Go to **Orders** screen → Click **+ New Order**:
   - Customer: `Walk-in Customer`
   - Location: `Main Store`
   - Product: `Wireless Mouse`, Quantity: `10`
   - Click **Confirm & Deduct Stock**.
5. Check **Inventory**: Main Store stock is now `90`.
6. Place another order for `85` units from Main Store:
   - Main Store stock becomes `5`.
   - Since reorder level is `20`, a **LOW STOCK Warning** is triggered across the system.

### 3. Purchase Order & Partial Receiving Workflow
1. Sign in as **MANAGER** (`manager@stocksmart.com` / `Manager@123`).
2. Go to **Orders** → Switch to **Purchase Orders** tab.
3. Click **+ New Order**:
   - Supplier: `Tech Distributors`
   - Location: `Main Store`
   - Product: `Wireless Mouse`, Quantity: `100`
   - Click **Place Purchase Order**.
4. In the PO list, click **Receive**:
   - First receive `20` units → PO status updates to `PARTIALLY_RECEIVED`.
   - Click **Receive** again and receive remaining `80` units → PO status updates to `RECEIVED`.
5. Check **Inventory**: Main Store stock is now `105` (5 + 100).
6. Dashboard KPIs and Reports automatically reflect the new inventory value.

### 4. Barcode & RFID Simulation Workflow
1. Go to **Barcode/RFID** in the sidebar.
2. In the Barcode section, enter `ELEC001` (or use a USB keyboard barcode scanner) and press Enter.
3. The **Wireless Mouse** product card immediately renders with current pricing, total stock (`195`), status (`In Stock`), and the location breakdown across Main Store, Warehouse A, Store B, and Store C.
4. In the RFID section, enter `RFID-ELEC001-001` and click **Scan RFID**. The scan history table logs the event with exact timestamp and product association.

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile details | Authenticated |
| `GET` | `/api/products` | Search & filter products by category | Authenticated |
| `POST` | `/api/products` | Create product (broadcasts real-time sync) | Authenticated |
| `PUT` | `/api/products/{id}` | Update product details | Authenticated |
| `DELETE` | `/api/products/{id}` | Deactivate product | ADMIN, MANAGER |
| `GET` | `/api/inventory` | Multi-location stock inspection | Authenticated |
| `POST` | `/api/inventory/adjust` | Adjust stock level with reason | ADMIN, MANAGER |
| `POST` | `/api/inventory/transfer` | Transactional transfer between locations | ADMIN, MANAGER |
| `GET` | `/api/orders/sales` | Query sales orders | Authenticated |
| `POST` | `/api/orders/sales` | Create sales order and deduct inventory | Authenticated |
| `GET` | `/api/orders/purchase` | Query purchase orders | Authenticated |
| `POST` | `/api/orders/purchase` | Create PO | Authenticated |
| `POST` | `/api/orders/purchase/receive` | Receive goods (supports partial receipt) | MANAGER, ADMIN |
| `GET` | `/api/barcode-rfid/lookup` | Fast product lookup by barcode/SKU | Authenticated |
| `POST` | `/api/barcode-rfid/scan-rfid` | Simulate RFID tag scan | Authenticated |
| `GET` | `/api/dashboard/stats` | Real-time Oracle-backed KPI metrics | Authenticated |
| `GET` | `/api/reports/data` | Comprehensive valuation and performance data | Authenticated |
| `GET` | `/api/users` | List all users and permissions | ADMIN |
| `POST` | `/api/users` | Create user with BCrypt hashed password | ADMIN |
| `GET` | `/api/audit-logs` | Retrieve recent system audit trail | ADMIN, MANAGER |
| `GET` | `/api/notifications` | List user notifications | Authenticated |
| `POST` | `/api/notifications/mark-read` | Mark all notifications as read | Authenticated |

---

## 8. Test Classification & Quality Summary

| Test Category | Classification | Description |
| :--- | :--- | :--- |
| **Authentication & BCrypt** | **PASS** | Demo credentials verified; token expiration and invalid credentials handled. |
| **UI Visual Fidelity** | **PASS** | Exact visual match with reference design: dark navy sidebar, purple active pills, KPI cards, charts, tables. |
| **Multi-Location Inventory** | **PASS** | Stock maintained separately per location with transactional transfers and rollback protection. |
| **Order Processing** | **PASS** | Full stock deduction on sales and stock increase on purchase receipt verified. |
| **Real-time Notifications** | **PASS** | STOMP WebSocket broadcast verified with fallback polling support. |
| **Hardware Emulation** | **PASS** | USB barcode scanner keyboard input and UHF RFID tag simulations tested. |
| **Live Server Deployment** | **PASS** | Single unified localhost:8080 URL active and fully verified. |

---

*StockSmart Retail Inventory Optimization System — Built for live project demonstration.*
