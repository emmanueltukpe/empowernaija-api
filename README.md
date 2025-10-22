# EmpowerNaija - Tax Compliance & Empowerment Platform

## 🎯 Project Overview

**EmpowerNaija** is a comprehensive tax compliance and empowerment platform designed to help Nigerians navigate the new 2026 tax reforms. The platform combines smart tax calculators, compliance tools, educational resources, and business growth features.

### Target Audience
- Business owners
- Freelancers
- Employees
- Employers
- Unemployed/Side-hustlers
- Gig economy workers

## ✨ Features

### Phase 1: MVP (Current)
- ✅ User Authentication (Google OAuth + Email/Password)
- ✅ User Profile Management with role selection
- ✅ Personal Income Tax Calculator (2026 rates)
- ✅ Income Record Tracking
- ✅ Tax Calculation Dashboard
- ✅ Basic Learning Hub
- ✅ Compliance Calendar & Notifications
- ✅ User Settings

### Phase 2: Business Features (Planned)
- Business Profile Setup
- Invoice Generation & Management
- VAT Calculator
- Company Income Tax Calculator
- Business Dashboard

### Phase 3: Advanced Features (Future)
- Community Forum
- NIN/TIN Verification Integration
- Document Management with OCR
- Advanced Analytics
- Mobile Applications (iOS/Android)

## 🏗️ Tech Stack

### Backend
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL
- **Cache:** Redis
- **Authentication:** Passport.js (Google OAuth + Local Strategy)
- **Validation:** class-validator, class-transformer
- **ORM:** TypeORM

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** TailwindCSS
- **State Management:** React Context + Hooks
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Forms:** React Hook Form
- **Icons:** FontAwesome

## 📁 Project Structure

```
webapp/
├── api/                          # Backend (NestJS)
│   ├── src/
│   │   ├── auth/                 # Authentication module
│   │   ├── users/                # User management
│   │   ├── tax-calculation/      # Tax calculation engine
│   │   ├── income/               # Income tracking
│   │   ├── business/             # Business management
│   │   ├── invoice/              # Invoice generation
│   │   ├── vat/                  # VAT calculations
│   │   ├── compliance/           # Compliance tracking
│   │   ├── notifications/        # Notification system
│   │   ├── learning/             # Learning hub
│   │   ├── forum/                # Community forum
│   │   ├── common/               # Shared utilities
│   │   ├── config/               # Configuration
│   │   └── database/             # Migrations & seeds
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── client/                       # Frontend (React)
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   ├── hooks/                # Custom hooks
│   │   ├── contexts/             # React contexts
│   │   ├── utils/                # Utility functions
│   │   ├── assets/               # Static assets
│   │   └── styles/               # Global styles
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── docs/                         # Documentation
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Google OAuth credentials (for authentication)

### Backend Setup

1. Navigate to the API directory:
```bash
cd api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=empowernaija

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

5. Run database migrations:
```bash
npm run migration:run
```

6. Seed the database (optional):
```bash
npm run seed:run
```

7. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📊 Database Schema

### Core Entities

1. **Users** - Authentication, profile, user role
2. **Businesses** - Business details, turnover, assets
3. **IncomeRecords** - Track income sources and amounts
4. **Invoices** - Digital invoicing with VAT
5. **TaxCalculations** - Computed tax liabilities
6. **LearningModules** - Educational content
7. **ForumPosts** - Community discussions
8. **Notifications** - Deadline reminders and alerts
9. **Documents** - Receipt/invoice uploads

## 💰 Tax Calculation Rules (2026)

### Personal Income Tax (PIT)
- ₦0 - ₦800,000: **0%**
- ₦800,001 - ₦3,000,000: **15%**
- ₦3,000,001 - ₦12,000,000: **18%**
- ₦12,000,001 - ₦25,000,000: **21%**
- ₦25,000,001 - ₦50,000,000: **23%**
- Above ₦50,000,000: **25%**

### Reliefs & Deductions
- **Rent Relief:** Lesser of ₦500,000 or 20% of rent paid
- **Pension Contributions:** Deductible (requires documentation)
- **Health Insurance:** Deductible (requires documentation)

### Company Income Tax (CIT)
- **0%** for small companies (turnover ≤ ₦50-100M, assets ≤ ₦250M)
- **30%** for others
- **15%** minimum effective rate for multinationals

### VAT
- **Standard Rate:** 7.5%
- **Zero-rated:** Basic foods, medical products, education materials, exports, electricity

### Capital Gains Tax (CGT)
- **Companies:** 30%
- **Individuals:** Progressive PIT rates
- **Exemptions:** Proceeds < ₦150M and gains < ₦10M

## 🧪 Testing

### Backend
```bash
cd api

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend
```bash
cd client

# Run tests
npm run test

# Test coverage
npm run test:coverage
```

## 📦 Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command:** `cd api && npm install && npm run build`
   - **Start Command:** `cd api && npm run start:prod`
4. Add environment variables from `.env`
5. Add PostgreSQL and Redis add-ons

### Frontend

1. Build the frontend:
```bash
cd client && npm run build
```

2. Deploy the `dist` folder to your preferred hosting (Vercel, Netlify, etc.)

## 📚 Documentation

### Comprehensive Guides Available

1. **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
2. **[Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)** - Complete technical documentation (35+ pages)
3. **[API Documentation](docs/API_DOCUMENTATION.md)** - All API endpoints with examples
4. **[Deployment Guide](docs/DEPLOYMENT_RENDER.md)** - Step-by-step deployment to Render
5. **[Project Summary](PROJECT_SUMMARY.md)** - Architecture overview and handoff document

### API Documentation (Live)

Once the backend is running, visit:
- **Swagger UI:** `http://localhost:3000/api/docs`
- **API Health:** `http://localhost:3000/api/health`

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (TypeORM)
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@empowernaija.com or join our community forum.

## 🙏 Acknowledgments

- Nigeria Revenue Service (NRS) for tax law documentation
- All contributors and beta testers

---

**Last Updated:** January 2025
**Version:** 1.0.0 (MVP)
