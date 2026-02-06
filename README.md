# MortgagePros Holiday Calendar

A modern, employee-only Holiday Calendar Web App for MortgagePros. Features interactive calendar views with US Federal Holidays, Fun/National holidays, and custom company holidays.

![MortgagePros Calendar](https://img.shields.io/badge/MortgagePros-Holiday%20Calendar-06427F)

## Features

### Employee View
- 📅 Month, Week, and Day calendar views
- 🎨 Color-coded events by category
- 🔍 Filter holidays by category (Federal, Fun, Company)
- 📱 Fully mobile responsive
- 💡 Tooltip on hover with holiday details
- 📋 Modal view for full holiday information

### Admin Portal
- 🔐 Secure JWT authentication
- ➕ Add custom company holidays
- ✏️ Edit any holiday (title, date, color, category)
- 🗑️ Delete holidays
- 👁️ Toggle holiday visibility
- 🔄 Mark holidays as recurring yearly
- 📊 Dashboard with statistics
- 🖼️ Upload custom company logo
- 🔄 Manual sync with external APIs

### Holiday Sources
- **Federal Holidays**: Automatically fetched from [Nager.Date API](https://date.nager.at/)
- **Fun/National Days**: Fetched from [Calendarific API](https://calendarific.com/) (optional API key)
- **Company Holidays**: Custom holidays added by admin

## Tech Stack

### Frontend
- React 18 + Vite
- TypeScript
- TailwindCSS
- FullCalendar.io
- React Router
- Axios
- React Hot Toast

### Backend
- Node.js + Express
- TypeScript
- SQLite + Prisma ORM
- JWT Authentication
- Node-Cron (daily sync)
- Multer (file uploads)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup

1. **Clone and install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Configure environment**

```bash
# Copy example env file
cp .env.example server/.env

# Edit server/.env and add your Calendarific API key (optional)
```

3. **Initialize database**

```bash
cd server

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed default admin user and sample data
npm run seed
```

4. **Start development servers**

```bash
# Terminal 1 - Start backend (port 4000)
cd server
npm run dev

# Terminal 2 - Start frontend (port 3000)
cd client
npm run dev
```

5. **Access the app**
- Calendar: http://localhost:3000
- Admin Login: http://localhost:3000/admin/login

### Default Admin Credentials
```
Username: admin
Password: admin123
```
⚠️ **Change the password after first login!**

## Docker Deployment

### Using Docker Compose

```bash
# Build and start containers
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### Portainer Deployment

1. In Portainer, go to **Stacks** → **Add Stack**
2. Name: `mortgagepros-calendar`
3. Paste the contents of `docker-compose.yml`
4. Add environment variables:
   - `JWT_SECRET`: Your secure secret key
   - `CALENDARIFIC_API_KEY`: Your API key (optional)
5. Click **Deploy the stack**

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript definitions
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── lib/            # Prisma client
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── index.ts        # Entry point
│   │   └── seed.ts         # Database seeder
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── Dockerfile
│
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment template
└── README.md
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays` | Get all visible holidays |
| GET | `/api/holidays/:id` | Get single holiday |
| GET | `/api/settings/logo` | Get logo URL |
| GET | `/api/health` | Health check |

### Admin (Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current admin |
| POST | `/api/holidays` | Create holiday |
| PUT | `/api/holidays/:id` | Update holiday |
| DELETE | `/api/holidays/:id` | Delete holiday |
| PATCH | `/api/holidays/:id/visibility` | Toggle visibility |
| GET | `/api/holidays/stats/summary` | Dashboard stats |
| POST | `/api/sync-holidays` | Trigger manual sync |
| GET | `/api/sync-holidays/logs` | Get sync logs |
| POST | `/api/settings/logo` | Upload logo |
| DELETE | `/api/settings/logo` | Remove logo |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | SQLite path | `file:./dev.db` |
| `JWT_SECRET` | JWT signing key | (required) |
| `JWT_EXPIRES_IN` | Token expiry | `24h` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:3000` |
| `CALENDARIFIC_API_KEY` | Calendarific API key | (optional) |

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#06427F` | Headers, buttons, federal holidays |
| Grey | `#7B7E77` | Secondary text, fun holidays |
| White | `#FFFFFF` | Cards, backgrounds |
| Company Green | `#059669` | Company holidays |

## Daily Sync

The server automatically syncs holidays at 2 AM daily using node-cron:
- Federal holidays from Nager.Date
- Fun holidays from Calendarific (if API key provided)
- Recurring custom holidays for the new year

## License

Private - MortgagePros Internal Use Only
