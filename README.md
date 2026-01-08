# Øl på tapp App

En React web-app for å administrere og vise øl på tapp. Designet for tablet-bruk på localhost.

## Funksjoner

- Viser 3 øl på tapp i rekkefølge (Tapp 1, Tapp 2, Tapp 3)
- Tilstand lagres i `state.json`
- Tablet-optimalisert UI
- Støtte for hjem-skjerm (PWA manifest)

## Oppsett

1. Installer avhengigheter:
```bash
npm install
```

2. Start utviklingsserveren:
```bash
npm run dev
```

Dette starter:
- React app på http://localhost:3000
- Express API server på http://localhost:3001

## Bruk

- Åpne http://localhost:3000 i nettleseren på tablet
- Legg til på hjem-skjerm for enkel tilgang
- Appen leser fra `state.json` og viser de 3 ølene på tapp

## API Endepunkter

- `GET /api/state` - Hent nåværende tilstand fra state.json
- `PUT /api/state` - Oppdater state.json

