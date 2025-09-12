# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClockInOut is a Next.js full-stack time tracking application with organization management. Users can clock in/out, track hours, and manage organizations with role-based permissions.

## Common Commands

- Development server: `bun dev`
- Build: `bun run build`
- Start production: `bun start`
- Lint: `bun run lint`
- Database operations:
  - Generate Prisma client: `bunx prisma generate`
  - Push schema to database: `bunx prisma db push`
  - View database: `bunx prisma studio`

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Package Manager**: Bun

### Database Schema
- **Users**: Basic user info with hashed passwords
- **Organizations**: Companies/teams with unique join codes
- **Memberships**: Many-to-many relationship between users and orgs with roles (EMPLOYEE/ADMIN)
- **TimeEntries**: Clock in/out records with calculated hours

### Key Features
- Role-based access control (employees can only see their data, admins can see org-wide data)
- Real-time clock tracking with live hour calculation
- Organization creation and joining via codes
- Admin dashboard for viewing all team member timesheets

### File Structure
- `/src/app/api/auth/` - Authentication endpoints
- `/src/app/api/time/` - Time tracking endpoints
- `/src/app/api/organization/` - Organization management endpoints
- `/src/app/auth/` - Sign in/up pages
- `/src/app/dashboard/` - Main clock in/out interface
- `/src/app/timesheet/` - Time entry viewing (supports admin viewing others)
- `/src/app/organization/` - Organization management interface
- `/src/lib/` - Shared utilities (Prisma client, auth config)

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - PostgreSQL database URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `BASE_URL` - Application URL (http://localhost:3000 for dev)
- `MAILGUN_API_KEY` - Mailgun API key for sending emails
- `MAILGUN_DOMAIN` - Your Mailgun domain (e.g., inandout.work)
- `MAILGUN_URL` - Mailgun API URL (default: https://api.mailgun.net)

## Component Usage Guidelines

### Date/Time Input Components
**CRITICAL**: Always use the existing `DateTimePicker` component for date/time inputs, NOT `TextInput` with `type="datetime-local"`.

✅ **Correct:**
```jsx
import DateTimePicker from '../../components/DateTimePicker'

<DateTimePicker
  selected={formData.startTime}
  onChange={(date) => setFormData({...formData, startTime: date})}
  showTimeSelect={true}
  required
/>
```

❌ **Incorrect:**
```jsx
// DO NOT USE TextInput for dates/times
<TextInput
  type="datetime-local"
  value={formData.startTime}
  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
  required
/>
```

### Form Data Types
When using `DateTimePicker`, ensure form state uses `Date | null` types:
```jsx
const [formData, setFormData] = useState({
  startTime: null as Date | null,  // ✅ Correct
  endTime: null as Date | null     // ✅ Correct
  // NOT: startTime: ''            // ❌ Wrong for DateTimePicker
})
```

### API Submission
Convert Date objects to ISO strings when submitting to API:
```jsx
body: JSON.stringify({
  ...formData,
  startTime: formData.startTime?.toISOString(),
  endTime: formData.endTime?.toISOString()
})
```
- Always use svg library, don't create svgs -- they don't turn out right
- Always componetize things for better re-usability, readability, and consistency
- Add API calls into separate files to organize the code better, we shouldn't have tons of api calls just sitting at the top of the page. We could create thunks as well with redux if that makes it easier to manage. Then inside components we can just call one function unless it makes sense in that scenario to not over complicate things.
- Dont make chrome alerts, alerts are unprofessional. If we need a user to confirm something we can make a modal for it. If we need to notify someone we can use a snackbar
- Always use the ModalManager setup for modals