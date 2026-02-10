# Docker Setup Guide

This guide will help you run the Clinic Desk application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)
- At least 2GB of free disk space

## Quick Start

### Option 1: Using Docker Compose (Recommended)

This method sets up both the application and MongoDB database automatically.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd opd-platanist
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file with your configuration**
   ```bash
   nano .env  # or use your preferred editor
   ```
   
   **Required environment variables:**
   - `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongodb:27017/clinic_desk`)
   - `JWT_SECRET`: Secret key for JWT authentication (MUST change in production)
   - `SUPER_ADMIN_USERNAME`: Super admin username
   - `SUPER_ADMIN_PASSWORD`: Super admin password

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

6. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Only (External MongoDB Required)

If you already have a MongoDB instance running, you can run just the application container.

1. **Build the Docker image**
   ```bash
   docker build -t clinic-desk:latest .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e MONGODB_URI="your-mongodb-connection-string" \
     -e JWT_SECRET="your-secret-key" \
     -e SUPER_ADMIN_USERNAME="admin" \
     -e SUPER_ADMIN_PASSWORD="your-password" \
     --name clinic-desk \
     clinic-desk:latest
   ```

3. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/clinic_desk` |
| `JWT_SECRET` | Secret key for JWT tokens | Use `openssl rand -base64 32` to generate |
| `SUPER_ADMIN_USERNAME` | Super admin username | `admin` |
| `SUPER_ADMIN_PASSWORD` | Super admin password | Strong password |

### Generating a Secure JWT Secret

Use one of these methods to generate a secure random string:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using /dev/urandom (Linux/Mac)
head -c 32 /dev/urandom | base64
```

## Configuration Examples

### Development Environment

```env
MONGODB_URI=mongodb://mongodb:27017/clinic_desk_dev
JWT_SECRET=dev-secret-key-for-testing-only
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=admin123
```

> ⚠️ **Warning**: Never use weak credentials in production!

### Production Environment

```env
MONGODB_URI=mongodb://username:password@your-mongodb-host:27017/clinic_desk?authSource=admin
JWT_SECRET=<generated-with-openssl-rand-base64-32>
SUPER_ADMIN_USERNAME=<strong-username>
SUPER_ADMIN_PASSWORD=<strong-password>
```

## Docker Compose Commands

### View logs
```bash
# All services
docker-compose logs -f

# Application only
docker-compose logs -f app

# MongoDB only
docker-compose logs -f mongodb
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart app only
docker-compose restart app
```

### Stop and remove containers
```bash
# Stop containers (preserves data)
docker-compose stop

# Stop and remove containers (preserves data volumes)
docker-compose down

# Stop, remove containers AND delete data
docker-compose down -v
```

### Update application
```bash
# Rebuild and restart
docker-compose up -d --build
```

## Port Configuration

By default, the application uses the following ports:

- **Application**: `3000` (can be changed in `docker-compose.yml`)
- **MongoDB**: `27017` (can be changed in `docker-compose.yml`)

To change the application port, edit `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8080:3000"  # Access on port 8080
```

## Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`. This ensures your data persists even if containers are stopped or removed.

### Backup MongoDB Data

```bash
# Export database
docker-compose exec mongodb mongodump --archive=/data/backup.archive --db=clinic_desk

# Copy backup to host
docker cp clinic_desk_mongodb:/data/backup.archive ./backup.archive
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./backup.archive clinic_desk_mongodb:/data/backup.archive

# Import database
docker-compose exec mongodb mongorestore --archive=/data/backup.archive
```

## Troubleshooting

### Container fails to start

1. Check logs:
   ```bash
   docker-compose logs app
   ```

2. Verify environment variables are set correctly:
   ```bash
   docker-compose config
   ```

3. Ensure MongoDB is running:
   ```bash
   docker-compose ps
   ```

### Cannot connect to MongoDB

1. Verify MongoDB container is running:
   ```bash
   docker-compose ps mongodb
   ```

2. Check MongoDB logs:
   ```bash
   docker-compose logs mongodb
   ```

3. Verify `MONGODB_URI` in `.env` file uses `mongodb://mongodb:27017/...` (not `localhost`)

### Port already in use

If port 3000 or 27017 is already in use, either:

1. Stop the service using that port
2. Change the port mapping in `docker-compose.yml`

### Permission issues

If you encounter permission issues:

```bash
# Reset permissions
sudo chown -R $USER:$USER .

# Rebuild without cache
docker-compose build --no-cache
```

## Security Best Practices

1. **Change default credentials**: Always change `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD`
2. **Generate strong JWT secret**: Use `openssl rand -base64 32`
3. **Use environment variables**: Never commit `.env` file to version control
4. **Update regularly**: Keep Docker images and dependencies up to date
5. **Secure MongoDB**: Use authentication for MongoDB in production
6. **Use HTTPS**: Deploy behind a reverse proxy with SSL/TLS (nginx, Caddy, Traefik)

## Production Deployment

For production deployment:

1. Use a managed MongoDB service or secure your MongoDB instance
2. Set up SSL/TLS certificates
3. Configure a reverse proxy (nginx, Caddy)
4. Enable firewall rules
5. Set up automated backups
6. Monitor logs and application health
7. Use Docker secrets or a secret management service for sensitive data

### Example nginx reverse proxy configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Initial Setup

After starting the application for the first time:

1. Access the super admin panel at: `http://localhost:3000/admin`

2. Login with your `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` credentials

3. Create a new clinic and configure your clinic settings

4. Add staff members (doctors, front desk)

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Ensure Docker and Docker Compose are up to date
4. Review this documentation carefully

## License

See [LICENSE](LICENSE) file for details.

## Disclaimer

See [DISCLAIMER.md](DISCLAIMER.md) for important information about using this software.
