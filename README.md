# EcoWatch - Smart Environment Activists Waste Complaint & Monitoring System

A web application that enables citizens to report waste-related issues by uploading photos with automatic geotagging. The system captures complaint locations, identifies the responsible Environment Activists Corporation, and routes complaints to the appropriate administrator for review and resolution.

## Features

### Citizen Portal
- Register and log in
- Capture photos via device camera or upload existing images
- Raise complaints: Overflowing Dustbin, Unauthorized Garbage Dumping, Damaged Dustbin, Missing Dustbin
- Automatic GPS coordinate and address capture on photo upload
- Manual selection of Environment Activists Corporation and Ward
- Complaint tracking and history with status updates

### Admin Dashboard
- Complaint management with interactive GIS map
- Filter complaints by Ward, Date, Complaint Type, and Status
- Search by Complaint ID, Citizen Name, Ward, or Address
- Update complaint status and add remarks
- Upload verification photos and mark complaints resolved
- Analytics dashboard with visualizations

### Super Admin
- Full system access across all corporations
- Create, edit, and manage Environment Activists Corporations
- Create, edit, and manage Administrator accounts
- Global analytics dashboard
- System audit logs
- Organization-wide report generation

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend:** Next.js API Routes, Server Actions
- **Database:** MongoDB, Mongoose ODM
- **Authentication:** NextAuth.js (Auth.js), JWT Session Management, Role-Based Access Control
- **Maps & Geolocation:** Leaflet.js, OpenStreetMap, Browser Geolocation API, Nominatim Reverse Geocoding
- **Image Storage:** Local uploads/, Multer (file uploads), file path stored in MongoDB

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Installation

```bash
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/smart-environmental-portal` |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `NEXT_PUBLIC_BASE_URL` | Application base URL | `http://localhost:3000` |
| `SEED_ADMIN_NAME` | Auto-seeded admin name | `Super_Admin` |
| `SEED_ADMIN_EMAIL` | Auto-seeded admin email | `admin@admin.com` |
| `SEED_ADMIN_PASSWORD` | Auto-seeded admin password | `Admin@12345` |
| `SEED_ADMIN_ROLE` | Auto-seeded admin role | `super_admin` |
| `RESEND_API_KEY` | Resend API key for email | (optional) |
| `RESEND_FROM_EMAIL` | Sender email address | `onboarding@resend.dev` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (optional, uses local uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (optional) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | (optional) |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA secret key | (optional) |

## Running the Application

**Development:**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Production:**

```bash
npm run build
npm start
```

The production server auto-seeds the super admin user on startup and runs on port 8000.

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@admin.com | Admin@12345 |

> Change these credentials before deploying to production.

## Project Structure

```
draft/
├── app/                      # Next.js App Router pages
├── components/               # React components
│   └── dashboard/            # Dashboard panels (complaints, analytics, GIS, etc.)
├── controllers/              # Business logic for API routes
├── lib/                      # Core utilities (auth, db, config)
├── middlewares/               # Auth and role middleware
├── models/                   # Mongoose schemas (Complaint, User, Corporation, Ward, etc.)
├── pages/                    # Next.js Pages Router
│   └── api/                  # API route handlers
├── public/                   # Static assets and uploads
├── scripts/                  # Seed and utility scripts
├── styles/                   # CSS modules
├── utils/                    # Helper functions
├── server.start.js           # Production startup script (seed + server)
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vercel.json               # Vercel deployment config
└── .env.example              # Environment variable template
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current user |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Submit a new complaint |
| GET | `/api/complaints` | List complaints |
| GET | `/api/complaints/:id` | Get complaint details |
| PUT | `/api/complaints/:id` | Update complaint status |

### Corporations & Wards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/corporations` | List corporations |
| GET | `/api/wards` | List wards |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/audit-logs` | View audit logs |
| GET | `/api/notifications` | View notifications |

## Complaint Workflow

1. Citizen captures or uploads a photo
2. GPS location is automatically captured
3. System retrieves latitude, longitude, address, date, and time
4. Citizen selects the Ward and Corporation
5. Citizen selects complaint category and adds description
6. System generates a Complaint ID
7. Complaint is routed to the appropriate administrator
8. Administrator reviews, updates status, and resolves

## License

Private Project - All Rights Reserved
