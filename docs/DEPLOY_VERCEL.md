# Deploy Kairos to Vercel (Midnight Preprod)

The site can be publicly viewed and searched after you deploy it. Wallet transactions still require each participant's own compatible Preprod wallet and local proof servers. This guide does not claim a deployment has happened.

## 1. Use the verified contract or deploy a replacement

The current eight-circuit contract is finalized on Preprod at `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`. Its deployment transaction **hash** is `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc` (block 2,686,941, full `SUCCESS`). The verifier matches all eight deployed keys to the current artifact. Use these values unless you intentionally deploy a new contract.

For the verified contract, copy `.env.example` to `.env.local`, compile the current artifact, and go directly to step 5. Steps 1–4 below are for deploying a replacement.

1. Install Node.js 22.22 or newer within the 22.x line, npm, Docker, Chrome with Midnight Lace, and Compact devtools 0.5.1/compiler 0.31.1. On Windows, install Compact in WSL. Have Preprod DUST and the required unshielded NIGHT for trades.
2. Copy `.env.example` to `.env.local`. Keep `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod`. Run `npm ci`, `npm run compact:compile`, `npm run proof:up`, and `npm run proof:status`.
3. Start Lace's separate local proof server on port 6300 (if one is not already running, `docker run -d --name lace-proof -p 127.0.0.1:6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v`) and set Lace's Midnight proving URL to `http://localhost:6300`. Kairos uses its own proof server on `127.0.0.1:6301`.
4. Run `npm run dev`; open `http://localhost:3000` in the Chrome profile with funded Preprod Lace. Connect, set a strong local storage password in **Settings**, and click **Deploy new Preprod contract**. Save the **finalized** 64-hex contract address and transaction ID. If finalization is uncertain, check the Preprod transaction before retrying.
5. Run `npm run verify:preprod -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc`. This must report a successful Preprod deployment whose eight verifier keys match the freshly compiled contract. The verifier accepts the transaction hash shown by Kairos or an indexer transaction identifier. An older seven-circuit Kairos address will fail and cannot be reused.
6. Keep the verified `NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS` in `.env.local` for local use, rebuild/restart, and confirm public state loads automatically. If you deployed a replacement, update both address and transaction hash. Exercise the user flow in [USAGE.md](USAGE.md). Only claim each Preprod circuit call that you independently verify with `npm run verify:activity -- <address> <transaction-hash-or-identifier> <circuit-id>`.

The `.env.example` and README contain the verified address and hash. Production Vercel builds still fail closed if the configured pair does not match a finalized deployment of the current artifact.

## 2. Configure the Vercel project

1. Push the reviewed repository to a Git provider you control, then import its root into Vercel. Select the **Next.js** framework, **Node.js 22.x** (22.22 or newer), and the intended Production Branch. Leave the output directory at the Next.js default. `vercel.json` supplies `npm ci` and `bash scripts/vercel/build.sh`.
2. In **Project Settings → Environment Variables**, enable **access to System Environment Variables**. The build uses Vercel's `VERCEL_ENV` to distinguish production from preview and fails if it is absent. Then add the following to **Production** before starting a production build:

   | Variable | Exact value | Exposure |
   | --- | --- | --- |
   | `NEXT_PUBLIC_MIDNIGHT_NETWORK` | `preprod` | Browser-visible; required for every environment |
   | `NEXT_PUBLIC_KAIROS_CONTRACT_ADDRESS` | `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f` | Browser-visible public identifier |
   | `KAIROS_DEPLOYMENT_TX_ID` | `ef335e98a0e96f5ee07563a89465a20acad0bcedb9adf8518cb533ff4bb2f6cc` | Build-time public transaction hash |
   | `KAIROS_SITE_URL` | `https://<your production domain>` with no path or trailing content | Server/build metadata |

3. For **Preview**, set only `NEXT_PUBLIC_MIDNIGHT_NETWORK=preprod`. Preview builds can render without an address for UI review and are marked `noindex`; they are not a live market until a valid address is supplied. Do not put seeds, private openings, local storage passwords, or API keys in Vercel variables. `MIDNIGHT_PROOF_SERVER_URL` is only for local scripts and is **not** a Vercel server setting.
4. Configure the production domain in **Project Settings → Domains**. Use that exact HTTPS origin for `KAIROS_SITE_URL`. In **Project Settings → Deployment Protection**, choose **None** or **Standard Protection**, which leaves production domains public; do not choose **All Deployments** or a production-only restriction. A protected production domain cannot be publicly used or indexed.
5. Deploy it yourself. The build installs pinned Compact devtools/compiler, compiles the contract, emits the public proving assets, runs contract tests, verifies the supplied deployment against the live Preprod indexer, and builds Next.js. A missing or mismatched address, transaction, network, or domain fails the build. If the Preprod indexer is temporarily unavailable, the deployment build fails safely; retry after service returns.

The generated `contracts/managed` and `public/zk` folders are ignored by Git. The Vercel build recreates them; do not upload them manually or store private witnesses in `public`.

## 3. Verify the production URL

1. Open the production URL in an ordinary browser and check `https://<domain>/api/health` returns JSON with `ok: true`. This checks the app route, not Preprod connectivity. Check `/robots.txt` allows `/` while excluding `/api/` and `/zk/`, and `/sitemap.xml` lists the production homepage. View page source for the canonical URL and an indexable robots meta tag. Search engines decide when to crawl; these settings make the site eligible, not instantly indexed. Submit the sitemap in your search engine webmaster tools if desired.
2. Confirm the homepage loads without a wallet and displays the verified contract's live Preprod state. Check the generated artifact URLs such as `/zk/kairos/keys/commitPosition.verifier` return HTTP 200; a 404 means the build did not publish proving assets.
3. In Chrome with funded Preprod Lace, grant the **production origin** wallet access. On **that user's device**, run `npm run proof:up` from a clone of this repository, or run `docker run -d --name kairos-proof -p 127.0.0.1:6301:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v`. Start Lace's separate local proof server on port 6300 as in step 1 and configure Lace to use it. Click **Settings → Check local proof server**. Grant Chrome's **Local Network Access** prompt for the production site if asked. Then follow [USAGE.md](USAGE.md) for connect, commitment, resolution, token issuance, trading, and treasury actions. Verify each receipt against the Preprod indexer and updated public state.
4. Repeat the read-only homepage check on mobile and in a private window. Transaction flows require a browser with the compatible wallet, local proof services, and network permission; do not treat a walletless/mobile read-only visit as transaction proof.

## Boundaries and troubleshooting

- Vercel runs the Next.js page, health route, metadata routes, and static proving assets. It does **not** run Midnight's proof server, hold wallet keys, persist private state, or submit transactions. There is no database, paid API, API key, or Vercel secret needed for this architecture.
- Each participant proves locally at `http://127.0.0.1:6301`; Lace separately uses `http://localhost:6300`. Chrome can require Local Network Access approval from the public HTTPS origin. If the check fails, inspect both local services, site permission, browser console, and extension access. A Docker proof server on the operator's computer cannot serve arbitrary users' localhost.
- Private opening files are stored or shared by users, never uploaded to Vercel. The trusted resolver sees the openings it collects. The loopback proof server sees the witness it proves. Public quote trades and transaction timing remain visible on Preprod.
- Public proof availability and end-to-end transaction success **cannot be verified before you deploy and exercise the production origin**. Local compilation, tests, browser mocks, and a successful Vercel build are separate evidence.
- Changing any `NEXT_PUBLIC_*` value requires a new Vercel build because Next.js embeds it in client assets. A new Compact contract requires a new compatible deployment and verifier check before updating the production address.
