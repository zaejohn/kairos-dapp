# How to Use KAIROS

KAIROS lets you privately back one of two assets for a protocol treasury. When
the market closes, the treasury moves toward whichever side collected more
conviction.

---

## What You Need

1. **A browser with the 1AM wallet installed.** KAIROS talks to
   [1AM](https://1am.xyz/) through the Midnight DApp Connector. 1AM is
   Midnight's own wallet and is the supported one here; it injects itself at
   `window.midnight['1am']`, and KAIROS prefers it when several wallets are
   installed at once.
2. **1AM switched to the right network.** This build targets **Preprod** by
   default. Set the network in 1AM before connecting — if the wallet is on a
   different network, KAIROS will refuse to connect and tell you which network
   it found.
3. **Some testnet tNIGHT, plus DUST for fees.** Get tNIGHT from the Preprod
   faucet. DUST is generated from tNIGHT over time; without it, transactions
   cannot pay fees. Mainnet has no faucet, so use Preprod for testing.
4. **A local proof server running.** Proofs are generated on your own machine,
   never sent to anyone else. Start it with Docker:

   ```sh
   docker run -p 6300:6300 midnightntwrk/proof-server:8.1.0 midnight-proof-server -v
   ```

   The first run downloads public proving parameters (a few hundred MB, one
   time only). Leave the terminal open — the server needs to keep running.

   KAIROS proves against this local server on every wallet, including 1AM. 1AM
   *can* prove in-tab instead, but using your own proof server keeps the privacy
   guarantee uniform: whatever wallet is connected, the witness data behind your
   position never reaches a third party.

---

## Step-by-Step Guide

### 1. Connect your wallet

Open the app and click **Connect 1AM**. 1AM will ask you to approve the
connection.

Approve it promptly — the request has to come directly from your click, and a
pop-up that the browser treats as unsolicited will be blocked.

If the button reports a network mismatch, your wallet is on a different network
than the app. Switch networks in 1AM and reconnect.

### 2. Look at the treasury

The **Treasury** panel shows where the protocol's liquidity is allocated right
now, as a split between Token A and Token B. It also shows the two flip tax
rates and how much tax revenue the treasury has collected so far.

The split always adds up to 100%. That is enforced by the contract, not just
displayed.

### 3. Join the active market

The **Market** panel asks: *should the next treasury allocation favor Token A or
Token B?*

While the market shows **open**, you can take a position.

### 4. Express your conviction privately

In the **Your position** panel:

1. Pick **Back Token A** or **Back Token B**.
2. Enter a **conviction weight** — a whole number that says how strongly you
   feel. A bigger number pulls the result harder toward your side.
3. Click **Submit private position**.

Your browser generates a zero-knowledge proof locally, then submits it. This
takes a bit longer than a normal transaction — the status bar says *Generating a
zero-knowledge proof on your local proof server* while it works. Wait for the
confirmation before doing anything else.

**Your choice is not visible to anyone at this point.** The only thing that
reached the chain is a commitment hash and a nullifier, neither of which reveals
which side you picked or how much weight you attached.

You can only take one position per market. Trying again is rejected on-chain.
Once the market ends, you can take a position in the next one.

### 5. Wait for the market to close

Any participant can close the market by clicking **Close market**, which stops
new positions from being accepted.

### 6. Reveal your position

**This step is required or your position will not count.**

After the market closes, the **Reveal position** button becomes available.
Clicking it publishes your side and weight so they can be added to the tally.

Why this step exists: the winner is decided from a tally that has to be
computable by anyone reading the chain. A tally built from hidden values cannot
be verified by anyone else, so positions are revealed once the market has closed
and no more positions can be added.

**Positions that are never revealed are simply not counted.** If you submitted
but did not reveal, your conviction does not affect the outcome.

At this point, the side and weight you revealed become public. Your secret and
the salt stay private — they were never published and are never published.

### 7. Settle the market

Any participant can click **Settle & reallocate**. The contract:

1. Adds up the revealed conviction for each side.
2. Declares the side with more conviction the winner.
3. Moves the treasury's target allocation one step (20 percentage points) toward
   that side, up to a maximum tilt of 90%.

Example, starting from a balanced treasury:

```
Before:   A = 50%   B = 50%
A wins
After:    A = 70%   B = 30%
```

If the two sides tie, nothing moves and the market resolves with no winner —
the treasury is never tilted on a coin flip.

### 8. Flip reserves and generate tax revenue

The **Flip reserves** panel converts treasury reserves between A and B.

1. Choose a direction: **A → B** or **B → A**.
2. Enter an amount.
3. The panel shows the amount, the tax, and the net that will move.
4. Click **Flip**.

The two directions are taxed differently:

| Direction | Tax |
|---|---|
| A → B | 1% |
| B → A | 3% |

The tax does not leave the protocol — it is retained by the treasury as revenue.
Only the net amount changes hands, so total demo value is conserved. This is
what makes the loop self-funding: flips generate the revenue that shows up in
the treasury's tax figures.

### 9. Start the next market

Click **Finalize** to close out the settled market, then **Start next market**.
The previous market's tallies reset, but the treasury's allocation, reserves and
collected tax all carry forward. A new market opens with a new id.

Your nullifier is specific to each market, so the same wallet can participate
again without being linked to its previous position.

---

## What Gets Proved

Every action submits a zero-knowledge proof. Each proof demonstrates, without
revealing the underlying values:

- **You know the opening of the commitment you filed** — the side, weight and
  salt that hash to the commitment stored on-chain. You cannot reveal a
  different position than the one you committed to.
- **Your position was well-formed** — the side is one of the two valid options,
  and the weight is inside the accepted range. Invalid positions cannot be
  proven, so they cannot be submitted.
- **Your nullifier is legitimate for this market** — it is derived from your
  secret and the market id. The contract checks it has not been used before,
  which is what prevents a position from being submitted or revealed twice.

---

## What Stays Private

| | |
|---|---|
| **Private while the market is open** | Your side, your conviction weight, your salt, your secret |
| **Public** | Market id, market state, treasury allocation and reserves, tax rates and revenue, your commitment and nullifier as hashes, how many positions were filed |
| **Public once you reveal** | Your side and your weight |
| **Never public** | Your secret and your salt |

**What someone watching the chain can learn:** that a wallet submitted a
commitment to this market; how many commitments were submitted; and, after
reveals, the side and weight that were revealed.

**What someone watching the chain cannot learn:** which side you backed or how
much conviction you attached while the market is open.

**What KAIROS does not claim:** it does not hide that you participated, it does
not hide your wallet's transaction history, and it does not make you anonymous.
Submitting a position is a visible transaction. What is hidden is the *content*
of your position during the open phase — not the fact that you took part.

---

## Troubleshooting

**"No compatible Midnight wallet detected."**
1AM is not installed, or it has not finished injecting into the page. Install
1AM from <https://1am.xyz/> and reload. If it is installed, reload once —
extensions inject asynchronously and a cold page load can occasionally beat them
to it.

**"Network mismatch: this app targets preprod but the wallet is on preview."**
Your wallet and the app disagree about which network they are on. Open 1AM,
switch to the network named in the message, and reconnect.

**The proof takes a very long time, or "Generating a zero-knowledge proof" never finishes.**
Check that the proof server is running: `curl http://localhost:6300/health`.
Also confirm the server is reachable at the URL in the message. The first proof
after starting it is slow because the proving parameters are still being
loaded; later ones are much faster.

**"KAIROS: position already submitted for this market."**
You already have a position in this market. One position per participant per
market is enforced on-chain and cannot be overridden. Wait for the next market.

**"KAIROS: market is not open" / "market is not closed".**
The market has moved on. Refresh and look at the current state — the buttons are
enabled only for transitions the contract will accept.

**"KAIROS: no position filed for this market."**
You are trying to reveal a position this browser did not file for the current
market. If you submitted from a different browser or after a page reload, the
private state is gone — KAIROS keeps it in memory only and deliberately does not
write it to disk. The commitment is still on-chain, but without the opening it
cannot be revealed, so it will not be counted.

**"This browser holds no position for this market."**
The app lost track of your private state, usually after a reload. Same cause and
same consequence as above. Submit again in the next market.

**"KAIROS: insufficient reserve A/B for this flip."**
The flip is larger than the treasury holds on that side. Check the reserve
figure in the Treasury panel and flip a smaller amount.

**"KAIROS: division verification failed."**
The division witness produced a result that failed on-chain verification. This
should not happen in normal use; reload and retry. If it persists, it indicates
a bug rather than a user error.

**The app shows a contract address but no data.**
Contract state is read from the indexer and can lag slightly behind a fresh
deployment. Wait a few seconds. The app polls automatically.
