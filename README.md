Clinic Desk by Platanist  
Copyright (C) 2025 Anzar

This program is free software: you can redistribute it and/or modify  
it under the terms of the GNU Affero General Public License as published  
by the Free Software Foundation, either version 3 of the License, or  
(at your option) any later version.

This program is distributed in the hope that it will be useful,  
but WITHOUT ANY WARRANTY; without even the implied warranty of  
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License  
along with this program. If not, see <https://www.gnu.org/licenses/>.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Option 1: Run with Docker (Recommended for Quick Setup)

The easiest way to get started is with Docker. This will set up both the application and MongoDB database automatically.

```bash
# 1. Clone the repository
git clone <repository-url>
cd opd-platanist

# 2. Create and configure environment file
cp .env.example .env
# Edit .env with your configuration (see DOCKER_SETUP.md)

# 3. Start with Docker Compose
docker-compose up -d

# 4. Access the application at http://localhost:3000
```

For detailed Docker setup instructions, security best practices, and troubleshooting, see **[DOCKER_SETUP.md](DOCKER_SETUP.md)**.

### Option 2: Run Locally (Development)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT authentication (generate with `openssl rand -base64 32`)
- `SUPER_ADMIN_USERNAME` - Optional super admin fallback username
- `SUPER_ADMIN_PASSWORD` - Optional super admin fallback password

Super admin access is now bootstrapped in the application itself. On a fresh install without super admin environment variables, open `/admin` and sign in with the default credentials `admin` / `admin123`, then change them immediately on first login.

See `.env.example` for a complete configuration template.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/abdullahanzar/clinic-desk-platanist) - your feedback and contributions are welcome!


## Desktop App (Electron)

You can package Clinic Desk as a desktop app for Windows, macOS, and Linux using Electron.

### Development mode

```bash
pnpm install
pnpm electron:dev
```

This starts the Next.js dev server and opens Electron pointed at a local loopback URL.

### Build desktop packages

```bash
# Build unpacked binaries
pnpm electron:pack

# Build distributable installers/packages
pnpm electron:dist
```

Generated artifacts are written to `electron-dist/` and include targets for:

- Windows: NSIS installer and portable executable
- macOS: DMG and ZIP
- Linux: AppImage and DEB

> Note: This app still requires runtime environment variables such as `MONGODB_URI` and `JWT_SECRET`. Super admin credentials can be bootstrapped from the login flow, while `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` remain available as an optional fallback for server-style deployments.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy with Docker

For Docker-based deployment, see **[DOCKER_SETUP.md](DOCKER_SETUP.md)** for comprehensive instructions including:

- Quick start with Docker Compose
- Production deployment guidelines
- Security best practices
- Backup and restore procedures
- Troubleshooting guide

## License

Clinic Desk by Platanist is licensed under the
GNU Affero General Public License v3.0 (AGPL-3.0).

If you modify this software and deploy it for others
(including as a hosted service), you must make your source code
and modifications available under the same license.

See the LICENSE file for full details.

## Disclaimer

This project is a clinic workflow and billing assistance tool only.
It is not a medical device or EHR system.

See DISCLAIMER.md for full details.

## Feedback & Improvements

Clinic Desk by Platanist is intentionally scoped to remain simple,
reliable, and clinic-realistic.

If you are a doctor, clinic staff member, or developer using this
project and have feedback or improvement ideas, please use:

- GitHub Issues for bugs or discussions
- Pull Requests for proposed improvements

When suggesting changes, please keep the scope in mind:
- No patient accounts
- No email or SMS delivery
- No automated messaging
- No expansion into EHR or hospital-scale systems

The goal is to improve clinic desk workflows without increasing
operational, legal, or compliance complexity.

