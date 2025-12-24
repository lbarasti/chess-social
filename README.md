# Chess Tournament Tracker

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment on Fly.io

This project is configured for deployment on [Fly.io](https://fly.io).

1.  Install flyctl (if not installed).
2.  Login: `fly auth login`.
3.  Launch the app:
    ```bash
    fly launch
    ```
    This will detect the `Dockerfile` and configure the app.
4.  Deploy updates:
    ```bash
    fly deploy
    ```
