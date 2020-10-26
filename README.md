# Pianolatron

Development repository for the CIDR Pianolatron application.

## Run Locally

1. `git clone` this repository

### Live Updating Development Build

1. `yarn`
1. `yarn dev` (This will run the development server and reflect your changes to the page as you save files)
1. Visit `localhost:1234` in your browser

### Static Build

1. `yarn build` for a development build (with sourcemaps), `yarn build:production` for a production build
1. Serve `dist/` using an http server

## Linting and Testing

- `yarn lint` to run eslint
- `yarn test` to run jest
- `yarn coverage` to run code coverage check
