# Pianolatron

Development repository for the CIDR Pianolatron application.

## Run Locally

1. `git clone` this repository

### Live Updating Development Build

1. `yarn`
1. `yarn dev` (This will run the development server and reflect your changes to the page as you save files)
1. Visit `localhost:8080` in your browser

### Static Build

1. `yarn build`
1. Serve `build/` using an http server

## Linting and Testing

- `yarn lint` to run eslint
- `yarn test` to run jest
- `yarn coverage` to run code coverage check

## GitHub Pages Deployment

Users with write permissions to the repo can deploy to GitHub Pages with `yarn gh-deploy`.
