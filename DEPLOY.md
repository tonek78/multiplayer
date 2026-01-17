# Deployment Guide (twitch.tonekvagyok.hu)

Ez a leírás specifikusan a **twitch.tonekvagyok.hu** domain beállítását tartalmazza HTTPS-sel.

## 1. Fájlok másolása és Indítás
*(Lásd az általános lépéseket: Fájlok felmásolása, `npm install`, `pm2 start`)*

## 2. Nginx Beállítása (Domain)

1. Lépj be a szerverre SSH-n.
2. Hozz létre egy új konfigurációs fájlt:
   ```bash
   sudo nano /etc/nginx/sites-available/twitch.tonekvagyok.hu
   ```
3. Másold bele ezt a tartalmat:

```nginx
server {
    server_name twitch.tonekvagyok.hu;

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
4. Mentés (`Ctrl+O`, `Enter`) és Kilépés (`Ctrl+X`).

5. Aktiváld az oldalt:
   ```bash
   sudo ln -s /etc/nginx/sites-available/twitch.tonekvagyok.hu /etc/nginx/sites-enabled/
   ```

6. Ellenőrizd a szintaxist és indítsd újra az Nginx-et:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

Most az oldal elérhető a `http://twitch.tonekvagyok.hu` címen.

## 3. HTTPS Beállítása (Ingyenes SSL) ✅
A leggyorsabb módja a biztonságos `https://` elérésnek a **Certbot**.

1. Telepítsd a Certbot-ot (ha még nincs):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Generáld le a tanúsítványt:
   ```bash
   sudo certbot --nginx -d twitch.tonekvagyok.hu
   ```
   *Kérdezni fogja, hogy átirányítsa-e a forgalmat HTTPS-re (Redirect HTTP to HTTPS). Válaszd a **2-es (Redirect)** opciót.*

Kész! Most már a **https://twitch.tonekvagyok.hu/** címen fut a MultiTwitch oldalad biztonságosan.
