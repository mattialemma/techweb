# REGEXLAB

REGEXLAB è una piattaforma web per proporre e risolvere enigmi testuali basati su espressioni regolari.  
L'idea è separare bene le responsabilità: il front-end gestisce l'interfaccia e l'esperienza utente, mentre il back-end espone API REST, valida le operazioni principali e salva i dati su database.

Il progetto è organizzato come monorepo Dockerizzato:

- `backend/`: applicazione Django con Django REST Framework.
- `frontend/`: applicazione React + TypeScript avviata con Vite.
- `nginx/`: configurazioni nginx per lo stack di produzione.
- `env/`: esempi di variabili d'ambiente per sviluppo e produzione.
- `media/`: file caricati o generati dall'applicazione.

## Tecnologie usate

### Back-end

Il back-end usa Django come base dell'applicazione e Django REST Framework per esporre le API.  
PostgreSQL è il database principale, Simple JWT gestisce l'autenticazione tramite token e Gunicorn viene usato nello stack orientato alla produzione. La documentazione delle API è supportata da `drf-spectacular`.

### Front-end

Il front-end è sviluppato con React e TypeScript. Vite viene usato per il server di sviluppo e per la build finale, Tailwind CSS per lo stile, React Router per la navigazione, Axios e TanStack Query per comunicare con le API e gestire i dati lato client.

### Ambiente

Docker Compose avvia insieme database, back-end e front-end. In questo modo non serve configurare tutto a mano sulla macchina locale: basta preparare il file `.env` e lanciare lo stack.

## Avvio in sviluppo

Per prima cosa crea il file `.env` partendo dall'esempio:

```bash
cp env/dev.example .env
```

Poi avvia i servizi:

```bash
docker compose up --build
```

Questo comando costruisce le immagini se necessario e avvia:

- PostgreSQL sulla porta `5432`;
- Django sulla porta `8000`;
- Vite/React sulla porta `5173`.

URL utili:

- Front-end: http://localhost:5173
- Health check back-end: http://localhost:8000/api/health
- Health check tramite proxy front-end: http://localhost:5173/api/health

Per avviare tutto in background:

```bash
docker compose up --build -d
```

Per fermare i container:

```bash
docker compose down
```

Per fermare i container e cancellare anche i volumi del database:

```bash
docker compose down -v
```

Usa `down -v` solo se vuoi ripartire da un database vuoto.

## Comandi Docker utili

Vedere lo stato dei servizi:

```bash
docker compose ps
```

Leggere i log di tutto lo stack:

```bash
docker compose logs -f
```

Leggere solo i log del back-end:

```bash
docker compose logs -f backend
```

Leggere solo i log del front-end:

```bash
docker compose logs -f frontend
```

Entrare nel container Django:

```bash
docker compose exec backend sh
```

Entrare nel container front-end:

```bash
docker compose exec frontend sh
```

Eseguire le migrazioni manualmente:

```bash
docker compose exec backend python manage.py migrate
```

Creare un superutente Django:

```bash
docker compose exec backend python manage.py createsuperuser
```

Aprire una shell Django:

```bash
docker compose exec backend python manage.py shell
```

## Test e controlli

Controllo configurazione Django:

```bash
docker compose exec backend python manage.py check
```

Test back-end:

```bash
docker compose exec backend python manage.py test
```

Build front-end:

```bash
docker compose exec frontend npm run build
```

Lint front-end:

```bash
docker compose exec frontend npm run lint
```

Test end-to-end con Playwright:

```bash
docker compose exec frontend npm run test:e2e
```

I test end-to-end usano come base `http://localhost:5173`, quindi prima conviene avere lo stack di sviluppo già avviato con `docker compose up --build`.

Per aprire Playwright in modalità interattiva:

```bash
docker compose exec frontend npm run test:e2e:ui
```

## Stack di produzione

Per provare la configurazione più vicina alla produzione, prepara il file `.env` partendo dal template:

```bash
cp env/prod.example .env
```

Poi avvia lo stack dedicato:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

In questa modalità:

- Django viene servito da Gunicorn;
- il front-end viene compilato e servito come app statica;
- nginx fa da punto di ingresso;
- le migrazioni vengono eseguite all'avvio del container back-end;
- i file statici Django vengono raccolti con `collectstatic`.

Per leggere i log dello stack di produzione:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Per fermarlo:

```bash
docker compose -f docker-compose.prod.yml down
```

## Quando qualcosa non parte

Se il front-end non risponde, controlla prima:

```bash
docker compose logs -f frontend
```

Se il back-end non risponde o `/api/health` fallisce:

```bash
docker compose logs -f backend
docker compose exec backend python manage.py check
```

Se il database sembra non aggiornato:

```bash
docker compose exec backend python manage.py migrate
```

Se vuoi ricostruire tutto da zero, mantenendo comunque i file del progetto:

```bash
docker compose down -v
docker compose up --build
```

## Note rapide

- In sviluppo il back-end parte con `runserver`.
- In produzione il back-end parte con Gunicorn.
- Le variabili d'ambiente principali sono in `.env`.
- Il front-end comunica con il back-end tramite `/api` e proxy Vite/nginx.
- I dati PostgreSQL vengono salvati in un volume Docker, quindi restano anche dopo `docker compose down`.
