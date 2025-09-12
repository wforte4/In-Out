# In&Out - Time Tracking Application

A modern, full-stack time tracking application built for teams and organizations. Track time, manage schedules, assign projects, and generate reports with role-based access control.

## 🚀 Features

- **Time Tracking**: Clock in/out with project assignment and descriptions
- **Organization Management**: Create and join organizations with role-based permissions
- **Schedule Management**: Create shifts, assign team members, and manage schedules
- **Project Tracking**: Organize time entries by projects with cost analysis
- **User Management**: Admin controls for team invitations and user roles
- **Reporting**: Export timesheets and analyze productivity data
- **Authentication**: Secure sign-up/sign-in with password reset functionality
- **Email Integration**: Automated invitations and notifications via Mailgun

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Email**: Mailgun for transactional emails
- **State Management**: Redux Toolkit for global UI state
- **Package Manager**: Bun (fast JavaScript runtime)

## 📋 Prerequisites

Before setting up the project, ensure you have:

- [Bun](https://bun.sh/) installed (v1.0 or higher)
- [PostgreSQL](https://postgresql.org/) database running
- [Mailgun](https://mailgun.com/) account for email functionality

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd in-and-out
```

### 2. Install Dependencies

We use **Bun** as our package manager for faster installs and builds:

```bash
bun install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inandout_db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
BASE_URL="http://localhost:3000"

# Mailgun (for email functionality)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain.com"
MAILGUN_URL="https://api.mailgun.net"
```

### 4. Database Setup

Initialize and configure your PostgreSQL database:

```bash
# Generate Prisma client
bunx prisma generate

# Push schema to database (creates tables)
bunx prisma db push

# Optional: View your database in Prisma Studio
bunx prisma studio
```

### 5. Run the Development Server

```bash
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Commands

### Common Prisma Commands

```bash
# Generate Prisma client after schema changes
bunx prisma generate

# Push schema changes to database
bunx prisma db push

# Create and apply migrations (production)
bunx prisma migrate dev --name your-migration-name

# Deploy migrations (production)
bunx prisma migrate deploy

# View database in browser
bunx prisma studio

# Reset database (development only - DESTRUCTIVE)
bunx prisma migrate reset
```

### When to Use Each Command

- **`bunx prisma generate`**: After making changes to `prisma/schema.prisma`
- **`bunx prisma db push`**: Development - quick schema sync without migrations
- **`bunx prisma migrate dev`**: Create new migration files for schema changes
- **`bunx prisma migrate deploy`**: Production - apply pending migrations

## 🚀 Available Scripts

```bash
# Development
bun dev              # Start development server with Turbopack
bun run build        # Build for production
bun start            # Start production server
bun run lint         # Run ESLint

# Database
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database
bun run db:migrate   # Deploy migrations
bun run db:studio    # Open Prisma Studio
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── organization/   # Organization management
│   │   ├── time/           # Time tracking
│   │   ├── projects/       # Project management
│   │   └── shifts/         # Schedule management
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main dashboard
│   ├── timesheet/          # Time tracking interface
│   ├── organization/       # Organization settings
│   └── projects/           # Project management
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
├── store/                  # Redux store and slices
└── types/                  # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migration files
```

## 🔐 Authentication & Authorization

### User Roles

- **ADMIN**: Full access to organization management, user invitations, and all data
- **EMPLOYEE**: Access to personal time tracking and assigned projects

### Features by Role

| Feature | Employee | Admin |
|---------|----------|-------|
| Clock In/Out | ✅ | ✅ |
| View Personal Timesheet | ✅ | ✅ |
| View Team Timesheets | ❌ | ✅ |
| Create Projects | ❌ | ✅ |
| Invite Users | ❌ | ✅ |
| Manage Schedules | ❌ | ✅ |
| Export Reports | ❌ | ✅ |

## 📧 Email Configuration

The application uses Mailgun for sending emails:

1. **Account Invitations**: Sent when admins invite new team members
2. **Password Reset**: Sent when users request password resets
3. **Schedule Reminders**: Automated notifications for upcoming shifts

### Setting up Mailgun

1. Create a [Mailgun](https://mailgun.com/) account
2. Add and verify your domain
3. Get your API key from the dashboard
4. Configure the environment variables in `.env`

## 🚨 Troubleshooting

### Common Issues

**Prisma Client Not Found**
```bash
bunx prisma generate
```

**Database Connection Issues**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists

**Email Not Sending**
- Verify Mailgun API key and domain
- Check environment variables
- Ensure domain is verified in Mailgun

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
bunx prisma generate
```

## 📝 Development Workflow

1. **Making Database Changes**:
   ```bash
   # 1. Update prisma/schema.prisma
   # 2. Generate new client
   bunx prisma generate
   # 3. Push changes (development)
   bunx prisma db push
   # 4. Restart dev server if needed
   ```

2. **Adding New Features**:
   ```bash
   # 1. Create feature branch
   git checkout -b feature/new-feature
   # 2. Make changes and test
   bun dev
   # 3. Run linting
   bun run lint
   # 4. Commit and push
   ```

## 🌟 Key Features in Detail

### Time Tracking
- One-click clock in/out functionality
- Project assignment with descriptions
- Automatic hour calculations
- Edit capabilities for admins

### Organization Management
- Unique join codes for team invitations
- Role-based access control
- Multi-organization support per user

### Project Management
- Create and assign projects
- Track time per project
- Cost analysis and reporting

### Schedule Management
- Create shifts with recurring patterns
- Assign team members to shifts
- Calendar views (day, week, month)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests and linting (`bun run lint`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section above

---

Built with ❤️ using Next.js, TypeScript, and Bun