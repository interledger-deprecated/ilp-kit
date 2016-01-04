# Five Bells Ledger UI

An example UI implementation for Five Bells Ledger

## Installation

```bash
npm install
```

## Running Dev Server

```bash
npm run dev
```

If you create a database, you must run the migration files
```bash
export postgres://<user>:<password>@localhost/<db_name>
```
```bash
npm run migrate
```
```bash
LEDGER_UI_DB_URI=postgres://<user>:<password>@localhost/<db_name> npm run dev
```


### Using Redux DevTools

In development, Redux Devtools are enabled by default. You can toggle visibility and move the dock around using the following keyboard shortcuts:

- <kbd>Ctrl+H</kbd> Toggle DevTools Dock
- <kbd>Ctrl+Q</kbd> Move Dock Position
- see [redux-devtools-dock-monitor](https://github.com/gaearon/redux-devtools-dock-monitor) for more detail information.

## Building and Running Production Server

```bash
npm run build
npm run start
```
