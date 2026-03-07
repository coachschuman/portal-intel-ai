
# PortalIntel AI: VPS Deployment Guide

This guide details how to deploy your scouting platform to a Virtual Private Server (VPS).

## 1. Prerequisites
- A VPS with Docker and Docker Compose installed.
- Your Gemini API Key (ensure it has a billing account attached for `gemini-3-pro` access).

## 2. Deployment via Docker (Recommended)
This is the cleanest method for a VPS.

1.  **Clone the code** to your server.
2.  **Build the image**:
    ```bash
    docker build --build-arg API_KEY=your_actual_key_here -t portal-intel .
    ```
3.  **Run the container**:
    ```bash
    docker run -d -p 80:80 --name portal-intel-app portal-intel
    ```

## 3. Manual Deployment (Nginx + Build)
If you prefer not to use Docker:

1.  **Install Node.js & Nginx** on your VPS.
2.  **Run Build**: `npm install && npm run build`.
3.  **Move Assets**: Copy the `build/` folder contents to `/var/www/html`.
4.  **Configure Nginx**: Copy the provided `nginx.conf` to `/etc/nginx/sites-available/default`.
5.  **Restart Nginx**: `sudo systemctl restart nginx`.

## 4. Domain & SSL
To access via a custom domain with HTTPS:
1.  Point your A record to the VPS IP.
2.  Use **Certbot** (Let's Encrypt) to secure the site:
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

---
*Authorized Scouting Intelligence Deployment Framework v2026.4*
