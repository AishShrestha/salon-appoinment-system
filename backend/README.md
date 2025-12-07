# Salon Appointment System - Backend

A robust NestJS-based backend API for managing salon appointments with features including user authentication, appointment scheduling, email notifications, and bulk appointment processing.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Email verification system
  - Secure password hashing with bcrypt

- **Appointment Management**
  - Create, read, update, and delete appointments
  - Real-time availability checking
  - Time slot management with break periods
  - Status tracking (pending, confirmed, completed, cancelled)
  - Admin approval workflow

- **Service Management**
  - CRUD operations for salon services
  - Duration and pricing management

- **Notification System**
  - Email notifications for appointment events
  - Customizable email templates
  - Queue-based email processing with Bull

- **Bulk Operations**
  - Bulk appointment upload via CSV
  - Real-time progress tracking via WebSocket
  - Detailed job logs and status reporting

- **API Documentation**
  - Interactive Swagger/OpenAPI documentation
  - Comprehensive endpoint descriptions

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (for Bull queue processing)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd salon-appoinment-system/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the backend root directory:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=salon_db

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # Email Configuration (SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@salon.com

   # Redis Configuration (for Bull Queue)
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Application
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**

   Create the PostgreSQL database:

   ```bash
   psql -U postgres
   CREATE DATABASE salon_db;
   \q
   ```

5. **Run Migrations**
   ```bash
   npm run migration:run
   ```

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

Once the application is running, access the interactive Swagger documentation at:

```
http://localhost:3001/api
```

## 🗄️ Database Migrations

### Generate a new migration

```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### Create an empty migration

```bash
npm run migration:create -- src/database/migrations/MigrationName
```

### Run pending migrations

```bash
npm run migration:run
```

### Revert last migration

```bash
npm run migration:revert
```

### Show migration status

```bash
npm run migration:show
```

## 🔑 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Verify email with token

### Appointments

- `GET /appointment/availability` - Check available time slots
- `POST /appointment` - Create appointment (User)
- `GET /appointment/my-appointments` - Get user's appointments (User)
- `GET /appointment` - Get all appointments (Admin)
- `GET /appointment/:id` - Get appointment details
- `DELETE /appointment/:id` - Cancel appointment
- `PATCH /appointment/:id/approve` - Approve appointment (Admin)
- `PATCH /appointment/:id/complete` - Mark as completed (Admin)

### Services

- `GET /service` - Get all services
- `GET /service/:id` - Get service by ID
- `POST /service` - Create service (Admin)
- `PATCH /service/:id` - Update service (Admin)
- `DELETE /service/:id` - Delete service (Admin)

### Break Periods

- `GET /break-period` - Get all break periods
- `POST /break-period` - Create break period (Admin)
- `DELETE /break-period/:id` - Delete break period (Admin)

### Bulk Operations

- `POST /bulk-appointment/upload` - Upload CSV for bulk appointments (Admin)
- `GET /bulk-appointment/job/:id/status` - Get job status
- `GET /bulk-appointment/job/:id/logs` - Get job logs
- `GET /bulk-appointment/jobs` - Get all jobs (Admin)

### Notification Templates

- `GET /notification/templates` - Get all templates (Admin)
- `GET /notification/templates/:id` - Get template by ID (Admin)
- `POST /notification/templates` - Create template (Admin)
- `PATCH /notification/templates/:id` - Update template (Admin)
- `DELETE /notification/templates/:id` - Delete template (Admin)

## 🧪 Testing

### Run all tests

```bash
npm run test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run test coverage

```bash
npm run test:cov
```

### Run e2e tests

```bash
npm run test:e2e
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/              # Shared utilities and decorators
│   │   ├── decorators/      # Custom decorators
│   │   ├── enums/          # Enums (roles, statuses)
│   │   ├── filters/        # Exception filters
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration files
│   ├── database/           # Database configuration
│   │   ├── migrations/     # TypeORM migrations
│   │   └── seeds/          # Database seeds
│   ├── modules/            # Feature modules
│   │   ├── appointment/    # Appointment management
│   │   ├── auth/          # Authentication & authorization
│   │   ├── break-period/  # Break period management
│   │   ├── bulk-appointment/ # Bulk operations
│   │   ├── email/         # Email service
│   │   ├── notification/  # Notification templates
│   │   ├── queue/         # Queue management
│   │   ├── service/       # Service management
│   │   └── user/          # User management
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── test/                   # E2E tests
├── .env                    # Environment variables
├── nest-cli.json          # NestJS CLI configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🔐 Authentication & Authorization

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **User**: Can create appointments, view own appointments, cancel own pending appointments
- **Admin**: Full access to all features including approval, management, and bulk operations

## 📧 Email Configuration

For Gmail SMTP:

1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app password in `EMAIL_PASSWORD`

## 🐛 Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Redis Connection Issues

- Verify Redis is running: `redis-cli ping`
- Check Redis configuration in `.env`

### Migration Issues

- Ensure database is accessible
- Check TypeORM data source configuration
- Review migration files for syntax errors

## 📝 License

This project is licensed under the UNLICENSED license.

## 👥 Support

For issues and questions, please open an issue in the repository.
