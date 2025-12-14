# Outrinsic Lead Generation Platform

AI-Powered Lead Generation Application targeting Scandinavian startups (Sweden, Norway, Denmark, Finland).

Built with **Next.js 14**, **Prisma**, **Neon PostgreSQL**, and **Resend** for email.

![Outrinsic](https://img.shields.io/badge/Outrinsic-Lead%20Gen-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-5-blue)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7)

## 🚀 Quick Deploy to Netlify

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/outrinsic-leadgen.git
git push -u origin main
```

### Step 2: Deploy on Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variables (see below)
6. Click **Deploy**

### Step 3: Environment Variables (Netlify Dashboard)

Go to **Site settings** → **Environment variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_ec3R4mAnMlvz@ep-rough-paper-adwof7s3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Neon PostgreSQL connection |
| `RESEND_API_KEY` | `re_L5r1XE9b_CJJmAutUVcEfDSEcjdmxXZEF` | Resend API key for emails |
| `DEEPSEEK_API_KEY` | `sk-b07618e5177e4d1bb3db717b5b412500` | DeepSeek AI for analysis |
| `FROM_EMAIL` | `Outrinsic <onboarding@resend.dev>` | Default from email |
| `JWT_SECRET` | `outrinsic-secret-key-2024` | JWT signing secret |

### Step 4: Database (Auto-configured)

The build automatically runs `prisma db push` to create tables with `leadgen_2_` prefix in your Neon database.

Tables created:
- `leadgen_2_companies`
- `leadgen_2_leads`
- `leadgen_2_tags`
- `leadgen_2_lead_tags`
- `leadgen_2_email_templates`
- `leadgen_2_email_logs`
- `leadgen_2_scraping_jobs`
- And more...

## 🔐 Login Credentials

```
Username: admin
Password: outrinsic
```

## ✨ Features

### Lead Management
- ✅ Add/Edit/Delete leads manually
- ✅ Lead statuses: Hot, In Progress, Qualified, Disqualified, Future, New
- ✅ Lead scoring (0-100) and priority levels
- ✅ Custom tags with colors
- ✅ Bulk actions (status update, delete)
- ✅ Export to Excel
- ✅ Search and filter

### Web Scraping
- ✅ Scrape TheHub.se (Scandinavian startups)
- ✅ General website scraping
- ✅ Auto-extract emails, phones, LinkedIn
- ✅ Background processing
- ✅ Preset URLs for 🇸🇪 🇳🇴 🇩🇰 🇫🇮

### Email System (Resend)
- ✅ Email templates with variables
- ✅ Send personalized emails
- ✅ Email history/logs
- ✅ Template variables: `{{first_name}}`, `{{company}}`, etc.

### AI Integration (DeepSeek)
- ✅ Company analysis & pain point identification
- ✅ Service recommendation engine
- ✅ Personalized email generation
- ✅ Lead analysis with talking points
- ✅ Objection handling suggestions
- ✅ Next steps recommendations

### Dashboard
- ✅ Real-time statistics
- ✅ Pipeline visualization
- ✅ Recent leads
- ✅ Lead sources chart

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL + Prisma ORM
- **Email**: Resend API
- **AI**: DeepSeek API (for analysis & email generation)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Hosting**: Netlify

## 💼 Outrinsic Services

The platform is pre-configured to promote these services:

| Service | Description | Cost Savings |
|---------|-------------|--------------|
| **Customer Support** | 24/7 ticket management, live chat, email support | 60-70% |
| **Social Media** | Content creation, posting, engagement, analytics | 70% |
| **Content Generation** | Blog posts, newsletters, SEO content | 65% |
| **Lead Generation** | Prospect research, email outreach, LinkedIn | 70% |
| **Payment & Refunds** | Payment verification, refund management | 60% |
| **Community Management** | Forum moderation, user engagement | 65% |

**Resources located in:** India & Indonesia

## 📁 Project Structure

```
outrinsic-leadgen/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Login, logout, me
│   │   ├── leads/          # Lead CRUD, export, enrich
│   │   ├── companies/      # Company management
│   │   ├── emails/         # Templates, send, logs
│   │   ├── scraper/        # Web scraping
│   │   ├── tags/           # Tag management
│   │   └── dashboard/      # Stats
│   ├── (dashboard)/        # Protected pages
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── companies/
│   │   ├── scraper/
│   │   ├── emails/
│   │   └── settings/
│   ├── login/              # Login page
│   └── layout.tsx          # Root layout
├── components/             # React components
├── lib/                    # Utilities
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # JWT auth
│   └── resend.ts          # Email service
├── prisma/
│   └── schema.prisma      # Database schema
├── netlify.toml           # Netlify config
└── package.json
```

## 🏃 Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📧 Email Templates

Use these variables in your templates:

| Variable | Description |
|----------|-------------|
| `{{first_name}}` | Contact's first name |
| `{{last_name}}` | Contact's last name |
| `{{full_name}}` | Full name |
| `{{email}}` | Email address |
| `{{company}}` | Company name |
| `{{job_title}}` | Job title |

Example:
```html
<p>Hi {{first_name}},</p>
<p>I noticed {{company}} is doing amazing work...</p>
<p>Best regards,<br/>Outrinsic Team</p>
```

## 🎯 Scandinavian Focus

Pre-configured scraping for:
- 🇸🇪 **Sweden** - TheHub.se/companies/sweden
- 🇳🇴 **Norway** - TheHub.se/companies/norway
- 🇩🇰 **Denmark** - TheHub.se/companies/denmark
- 🇫🇮 **Finland** - TheHub.se/companies/finland

## 🔄 Lead Statuses

| Status | Color | Use Case |
|--------|-------|----------|
| NEW | Cyan | Freshly added |
| HOT | Red | High priority, ready to close |
| IN_PROGRESS | Blue | Currently working on |
| QUALIFIED | Green | Verified and interested |
| FUTURE | Purple | Potential for later |
| DISQUALIFIED | Gray | Not a fit |

## 📝 License

Private - Outrinsic © 2024

## 🆘 Support

For questions, contact the Outrinsic team.
