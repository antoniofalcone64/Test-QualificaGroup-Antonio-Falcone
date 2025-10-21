# Test Qualifica Group

Gestione dashboard corsi di formazione per Qualifica Group.  
Progetto React + Vite con TypeScript, Tailwind CSS, e componenti UI custom.

## Features

- **Dashboard full page** con filtri, analisi, e visualizzazioni (Recharts).
- **Gestione dati** tramite Context API (`JsonDataContext`), parsing semantico dei dati API.
- **Animazioni di caricamento** e gestione errori con componenti full page (`FullPageLoader`, `FullPageError`).
- **Filtri avanzati** (status, regione, società, sede) e ricerca globale.
- **Esportazione dati** (CSV, Excel).
- **UI moderna** con Tailwind CSS e icone Lucide.

## Struttura progetto

```
src/
  App.tsx                // Entry point React
  RowComponent.tsx       // Dashboard principale
  context/
    JsonDataContext.tsx  // Gestione fetch e parsing dati API
  utils/
    functions.tsx        // Helpers, parsing semantico dati
  components/
    ui/
      FullPageLoader.tsx // Loader full page (Tailwind)
      FullPageError.tsx  // Error full page (Tailwind)
      MultiSelect.tsx    // Select multipla custom
    ux/
      InfoTooltip.tsx    // Tooltip info
  pages/
    homepage/
      components/        // Analytics, DataTable, Overview, Detailed
```

## Avvio rapido

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
3. Apri [http://localhost:5173](http://localhost:5173) nel browser.

## Configurazione

- **Vite**: configurato per proxy API e hot reload.
- **Tailwind CSS**: già integrato, usa solo classi utility.
- **Recharts**: per grafici e visualizzazioni KPI.
- **Context API**: per gestione centralizzata dei dati.

## Componenti principali

- `FullPageLoader`: animazione di caricamento full screen.
- `FullPageError`: gestione errori full screen con messaggio.
- `MultiSelect`: filtro multiplo custom.
- `JsonDataContext`: fetch, parsing e fornitura dati a tutta l’app.

## API

- Autenticazione e fetch dati tramite endpoint `/api/login` e `/api/classi`.
- Parsing semantico dei dati per uniformare le chiavi e i valori.

## Personalizzazione

- Modifica i componenti in `src/components/ui` per personalizzare la UI.
- Aggiungi nuovi filtri o visualizzazioni in `RowComponent.tsx` e `pages/homepage/components`.

## Build produzione

```bash
npm run build
```
I file ottimizzati saranno in `dist/`.

## Contributi

1. Forka il repo
2. Crea un branch feature (`git checkout -b feature/nome`)
3. Fai commit e push (`git push origin feature/nome`)
4. Apri una Pull Request

## Licenza

MIT
