# MenuShield - Käynnistysohje

## Vaihe 1: Riippuvuuksien asennus

1. Asenna backend-riippuvuudet:

```bash
cd backend
pnpm install
```

2. Generoi Prisma client:

```bash
npx prisma generate
```

## Vaihe 2: Tietokannan käynnistys

Käynnistä MySQL Docker-kontainerissa:

```bash
docker-compose up -d mysql
```

Odota hetki että tietokanta käynnistyy (noin 30 sekuntia).

## Vaihe 3: Tietokannan alustus

1. Aja migraatiot:

```bash
cd backend
npx prisma migrate dev --name init
```

2. Täytä tietokanta testidata:

```bash
pnpm run db:seed
```

## Vaihe 4: Käynnistä palvelut

1. Käynnistä backend (terminaali 1):

```bash
cd backend
pnpm run dev
```

2. Käynnistä frontend (terminaali 2):

```bash
cd ..
pnpm run dev
```

## Vaihe 5: Testaa sovellus

1. Avaa selain osoitteeseen: http://localhost:5176
2. Testaa guest-näkymä
3. Siirry admin-paneeliin: http://localhost:5176/admin/login
4. Kirjaudu sisään:
   - Email: admin@example.com
   - Password: supersecret

## Tuotantokäyttöönotto

Koko sovelluksen käynnistys Docker Compose:lla:

```bash
docker-compose up -d
```

Sovellus on saatavilla:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MySQL: localhost:3306

## Ongelmanratkaisu

Jos kohtaat ongelmia:

1. Tarkista että Docker on käynnissä
2. Tarkista että portit 3000, 4000, 3306 ja 5176 ovat vapaana
3. Katso lokeja: `docker-compose logs`
4. Käynnistä palvelut uudelleen: `docker-compose restart`
