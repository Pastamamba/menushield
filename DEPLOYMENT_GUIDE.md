# 🚀 MenuShield Deployment Guide - ILMAINEN ratkaisu

## 📋 Yhteenveto kustannuksista
- **Frontend:** Netlify - ILMAINEN
- **Backend:** Railway - ILMAINEN tier (500h/kk)
- **Tietokanta:** MongoDB Atlas - ILMAINEN (512MB)
- **Yhteensä:** 0€/kk

## 🗄️ 1. MongoDB Atlas Setup (ILMAINEN)

### 1.1 Luo MongoDB Atlas tili
1. Mene osoitteeseen: https://cloud.mongodb.com/
2. Klikkaa "Try Free"
3. Rekisteröidy Google/GitHub tilillä tai sähköpostilla
4. **ÄLÄ** syötä luottokorttia - pysyt ilmaisessa tierissä

### 1.2 Luo cluster
1. Valitse "Build a Database"
2. Valitse "M0 Sandbox" (FREE FOREVER)
3. Valitse Region: Europe (Frankfurt tai Amsterdam)
4. Cluster Name: `menushield-cluster`
5. Klikkaa "Create"

### 1.3 Luo database user
1. Database Access → Add New Database User
2. Username: `menushield-user`
3. Password: Generoi vahva salasana (tallenna se!)
4. Database User Privileges: "Read and write to any database"
5. Add User

### 1.4 Whitelist IP-osoitteet
1. Network Access → Add IP Address
2. Klikkaa "Allow Access from Anywhere" (0.0.0.0/0)
3. Confirm

### 1.5 Hae connection string
1. Database → Connect → Drivers
2. Kopioi connection string:
```
mongodb+srv://menushield-user:<password>@menushield-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 🚂 2. Railway Backend Deployment (ILMAINEN)

### 2.1 Luo Railway tili
1. Mene: https://railway.app/
2. Klikkaa "Start a New Project"
3. Kirjaudu GitHub tilillä
4. Ilmainen tier: 500 tuntia/kk, 512MB RAM

### 2.2 Deploy backend
1. "Deploy from GitHub repo"
2. Valitse `menushield` repository
3. Valitse `backend` folder as root
4. Railway automaattisesti tunnistaa Node.js projektin

### 2.3 Aseta environment variables
Railway dashboardissa:
```bash
DATABASE_URL=mongodb+srv://menushield-user:YOUR_PASSWORD@menushield-cluster.xxxxx.mongodb.net/menushield?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
PORT=4000
ADMIN_EMAIL=admin@yourrestaurant.com
ADMIN_PASSWORD=your-strong-admin-password
```

### 2.4 Deploy
1. Railway automaattisesti deployaa
2. Saat URL: `https://your-app-name.railway.app`
3. Kokeile: `https://your-app-name.railway.app/health`

## 🌐 3. Netlify Frontend Deployment (ILMAINEN)

### 3.1 Päivitä backend URL
Ensin päivitä netlify.toml backend URL:

```toml
# Korvaa "your-backend-url" Railway URL:llä
[[redirects]]
  from = "/api/*"
  to = "https://your-app-name.railway.app/api/:splat"
  status = 200
  force = true
```

### 3.2 Luo Netlify tili
1. Mene: https://netlify.com/
2. "Sign up" → GitHub tilillä
3. Ilmainen tier: 100GB bandwidth/kk

### 3.3 Deploy site
1. "Add new site" → "Import an existing project"
2. Valitse GitHub → `menushield` repo
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (jätä tyhjäksi)
4. Deploy site

### 3.4 Päivitä CORS backend server.js
Korvaa `your-app-name.netlify.app` oikealla Netlify URL:llä:

```javascript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://your-actual-netlify-url.netlify.app']
  : [...]
```

### 3.5 Redeploy backend
Railway automaattisesti uudelleendeployaa kun pushaat muutokset GitHubiin.

## 🗃️ 4. Tietokannan alustaminen

### 4.1 Päivitä Prisma clientti Railway consolessa
```bash
npm run build
npm run db:seed
```

Tai Railway dashboard → Deployments → viimeisin deployment → View Logs

### 4.2 Testaa toimivuus
1. Mene Netlify URL:ään
2. Kirjaudu admin-tilillä (ADMIN_EMAIL/ADMIN_PASSWORD)
3. Tarkista että kategoriat ja ainekset näkyvät

## 🎯 5. Automaattinen deployment (vapaaehtoinen)

### 5.1 Railway auto-deploy
Railway automaattisesti deployaa kun pushaat `backend/` kansioon

### 5.2 Netlify auto-deploy  
Netlify automaattisesti deployaa kun pushaat frontendin muutoksia

## 💰 Kustannusseuranta

### Ilmaisten tierien rajat:
- **Railway:** 500h/kk (riittää pienelle sovellukselle)
- **MongoDB Atlas:** 512MB storage (riittää alkuun)
- **Netlify:** 100GB bandwidth/kk (riittää hyvin)

### Jos rajat tulevat vastaan:
- Railway Pro: $5/kk
- MongoDB Atlas M2: $9/kk
- Netlify Pro: $19/kk

## 🔧 Ylläpito

### Lokien tarkastelu:
- **Railway:** Dashboard → Deployments → View Logs
- **Netlify:** Dashboard → Functions → Function logs
- **MongoDB:** Atlas → Monitoring

### Backup:
- MongoDB Atlas tekee automaattiset backupit
- Koodi on GitHubissa

## 🆘 Ongelmatilanteita

### Backend ei käynnisty:
1. Tarkista environment variables Railway dashboardissa
2. Tarkista MongoDB connection string
3. Katso Railway logeista virheviestejä

### Frontend ei yhdistä backendiin:
1. Tarkista netlify.toml redirect URL
2. Tarkista server.js CORS asetukset
3. Tarkista Network tab browser dev toolsissa

### Tietokanta ei toimi:
1. Tarkista MongoDB Atlas user permissions
2. Tarkista IP whitelist (0.0.0.0/0)
3. Tarkista connection string salasana

Tämä ratkaisu on täysin ilmainen ja riittää hyvin pienelle-keskikokoiselle ravintolasovellukselle!
