# DAIIM requester prototype

A clickable React prototype of the DAIIM requester flow, built from the Figma file
**DAIIM Requester UI – Cognitive Walkthrough**. It is for the cognitive walkthrough
and early usability tests, so everything is mocked: there is no backend, no real wallet
and no blockchain. Balances, requests and history live in browser session storage.

## Run it

```bash
cd src/frontend
npm install
npm run dev      # http://localhost:5173
```

`npm run build` type-checks and builds to `dist/`.

## Walking through the flow

Start at `/` signed out and use the app as Priya would:

1. **Sign up / Log in** → enter any email → enter any 6-digit code → account setup → home.
2. **Deposit** (checklist or header) → pick an amount → deposit → confirmation.
3. **Marketplace** → a task card → **Request this task**.
4. Upload a CSV (or **type values instead**) → enter an amount → **Confirm payment and submit request** → **Confirm**.
5. Watch the request move through the stages (about 20 seconds) to the result.

Other paths: create a task (**+ New task**), Help, Profile, Transaction history,
Log out, and the cancelled request R3 (load a returning user from the panel).

## Walkthrough panel (for facilitators)

The dark **Walkthrough** button in the bottom-right corner opens a panel that:

- shows the Figma walkthrough note for the screen you are on;
- jumps to any of the Figma frames, loading the state that frame needs
  (screens 06–23 load a returning user with Figma's numbers: $13.39 available, $2.62 held, requests R1–R4);
- turns on **Force next payment to fail** to reach screen 16 naturally;
- finishes running requests instantly, resets to signed out, and downloads a correct and a wrong T1 CSV.

Press **Alt+Shift+H** to hide or show the panel button before a participant session.
Sign-in code `000000` shows the wrong-code error.

## Screen map

| Figma frame | URL |
|---|---|
| 01 Home (signed out) | `/` |
| 02 Sign in – choose a method | `/?modal=signin` |
| 03 Sign in – enter code | `/?modal=code` |
| 04 Sign in – setting up account | `/?modal=setup` |
| 05 Home (signed in) – profile menu open | `/?menu=open` |
| 06 Profile and settings | `/profile` |
| 07 Help | `/help` |
| 08 Marketplace (signed out / signed in) | `/marketplace` |
| 09 Task details | `/marketplace/tasks/T1` |
| 10 Provider details | `/marketplace/providers/P1` |
| 11 Create a task | `/tasks/new` |
| 12 New request form | `/requests` |
| 13 Upload rejected | `/requests` after a CSV with the wrong columns |
| 14 Not enough funds | `/requests` with an amount above available funds |
| 15 Confirm payment modal | `/requests?modal=confirm` |
| 16 Payment failed | `/requests?modal=payment-failed` |
| 17 Request in progress | `/requests/R5` |
| 18 Request result | `/requests/R5` once complete |
| 19 Cancelled and refunded | `/requests/R3` |
| 20 Deposit funds | `?modal=deposit` on any page |
| 21 Deposit complete | `?modal=deposit-done` |
| 22 Transaction history | `/history` |
| 23 Log out – payment still confirming | `?modal=logout` |

Modals are URL parameters, so every screen has its own link. Direct links to the
modal URLs only make sense with the right state; use the panel to jump with state loaded.

## Not in the Figma file yet (placeholders)

- **Create task review and success**: a confirm modal and a "Task created" page after "Review and create".
- **Use my own wallet instead**: wallet picker and a mock signature request with Approve / Reject.

## Code layout

```
src/
  data.ts            mock tasks, providers, user
  store.tsx          mock state: balances and request progress derived from a small ledger
  screens.ts         every Figma frame: note, URL, and the state needed to jump to it
  App.tsx            routes
  components/        header, requests sidebar, walkthrough panel
  modals/            all modals (sign-in, deposit, confirm payment, …)
  pages/             one file per page
```

Later, the mock wallet in `store.tsx` can be replaced with the MetaMask Embedded Wallets SDK on Solana devnet.
