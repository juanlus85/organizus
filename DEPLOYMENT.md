# Despliegue de OrganizUS en un VPS mediante GitHub y SSH

Este proyecto está preparado para ejecutarse de forma **autónoma** en un VPS con Node.js, MySQL o MariaDB, almacenamiento persistente local para los archivos y un acceso de administrador mediante correo y contraseña. No requiere servicios gestionados externos para la autenticación ni para almacenar imágenes o PDFs.

> Esta guía asume Ubuntu 22.04/24.04, acceso SSH con privilegios `sudo`, Node.js 22 o superior, MySQL/MariaDB y un dominio que resuelva a la IP del servidor.

## 1. Crear la base de datos

En el VPS o desde Plesk, crea una base de datos y un usuario propios. Sustituye las contraseñas de ejemplo por valores únicos y seguros.

```sql
CREATE DATABASE organizus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'organizus_user'@'localhost' IDENTIFIED BY 'CONTRASENA_UNICA';
GRANT ALL PRIVILEGES ON organizus.* TO 'organizus_user'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Instalar paquetes necesarios en el VPS

Conéctate por SSH y ejecuta una sola vez:

```bash
sudo apt update
sudo apt install -y git chromium nginx certbot python3-certbot-nginx
corepack enable
```

Si el VPS usa Plesk, conserva el usuario de sistema asignado a la suscripción como `APP_USER` en los pasos siguientes.

## 3. Clonar el repositorio privado

Primero añade una clave SSH del VPS a tu cuenta de GitHub o crea una *Deploy Key* de solo lectura para el repositorio. Después:

```bash
sudo mkdir -p /var/www
sudo chown "$USER":"$USER" /var/www
git clone git@github.com:TU_USUARIO/organizus.git /var/www/organizus
cd /var/www/organizus
cp deploy/production.env.template .env
chmod 600 .env
```

Edita `.env` y completa como mínimo `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Genera el secreto JWT con:

```bash
openssl rand -hex 32
```

## 4. Instalar la aplicación y ejecutar las migraciones

```bash
cd /var/www/organizus
corepack enable
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
```

El primer inicio crea el usuario administrador con el correo y contraseña definidos en `.env`. Entra posteriormente en `https://organizus.es/login`.

## 5. Crear el servicio de systemd

Sustituye `APP_USER` por el usuario Linux que debe ejecutar la aplicación, normalmente el usuario de la suscripción Plesk o tu usuario SSH.

```bash
sudo sed "s/__APP_USER__/APP_USER/g" deploy/organizus.service | sudo tee /etc/systemd/system/organizus.service
sudo systemctl daemon-reload
sudo systemctl enable --now organizus
sudo systemctl status organizus --no-pager
```

## 6. Configurar Nginx y HTTPS

```bash
sudo cp deploy/nginx.organizus.es.conf /etc/nginx/sites-available/organizus.es
sudo ln -s /etc/nginx/sites-available/organizus.es /etc/nginx/sites-enabled/organizus.es
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d organizus.es -d www.organizus.es
```

Antes de emitir el certificado, confirma que los registros DNS `A` de `organizus.es` y `www.organizus.es` apuntan a la IP pública del VPS.

Si Plesk gestiona la configuración de Nginx, conserva su virtual host y añade las directivas de `deploy/nginx.organizus.es.conf` mediante la opción de configuración adicional de Nginx de la suscripción. No habilites dos virtual hosts distintos para el mismo dominio.

## Actualizaciones desde GitHub

En el VPS, ejecuta:

```bash
cd /var/www/organizus
bash deploy/update.sh
```

El script obtiene los cambios de la rama `main`, instala dependencias bloqueadas, aplica migraciones y reinicia el servicio. Los archivos subidos viven en `/var/www/organizus/data/uploads`, por lo que no se eliminan durante las actualizaciones. Incluye ese directorio y la base de datos en tu política de copias de seguridad.

## Verificación y diagnóstico

```bash
sudo systemctl status organizus --no-pager
sudo journalctl -u organizus -n 100 --no-pager
curl -I http://127.0.0.1:3000
```

Si la generación de PDF no funciona, verifica que Chromium esté instalado y disponible con `which chromium`. La ruta debe coincidir con `PUPPETEER_EXECUTABLE_PATH` en `.env`.
