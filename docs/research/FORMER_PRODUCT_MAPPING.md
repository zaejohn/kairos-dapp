# Former product references → Kairos

Reviewed on 2026-09-24. The former [Fantastical Factory whitepaper](https://docs.fantasticalfactory.com/) and every image in `public/reference` were used as references. The current Compact contract and its tests, rather than the former screenshots, determine what the Kairos UI can say is available.

| Image | Former screen or current asset | Adaptation in Kairos |
| --- | --- | --- |
| `home-image.png` | Kairos-specific labeled workshop artwork | Illustrated navigation with semantic station controls and a mobile station grid. |
| `kairos-workshop.png` | Kairos-specific unlabeled workshop artwork | Retained as a Kairos asset; the current home uses the labeled variant. |
| `wallet.png` | Wallet chooser | Detected compatible Midnight wallets, connection status, address copy, and local session disconnect. |
| `settings.png` | Wallet, balances, and trading preferences | Wallet session, on-demand wallet-reported unshielded token balances, and Preprod contract/proof diagnostics. Solana routing and priority fees are omitted. |
| `rewards.png` | Stake, unstake, claim, and vote dashboard | Real KAI issuance/distribution figures and the private position path. No staking or claim balance is implied. |
| `tradingengine.png` | Market statistics, chart, taxes, and swap | Actual round state, asymmetric public fees, a calculated NIGHT/quote trade preview, and local opening-file/position receipt previews. No market cap, price chart, AMM, or slippage promise is shown. |
| `scrapfund.png` | Vault statistics and event history | Public reserve/fee accounting, target split, last result, restore action, and an append-only on-chain history of resolutions, expiries, and restorations. The latest finalized receipt is shown only for this browser session. |

## Capability classification

| Former capability | Classification | Kairos decision |
| --- | --- | --- |
| Weekly epoch, private conviction, aggregate winner | Directly applicable | Eight salted commitments, seven-day close, one resolver proof, one public winner. |
| Three assets, asymmetric trading fees, swap | Directly applicable | Quote A, Quote B, KAI; public NIGHT/quote contract routes with result-dependent fee rates and a fee-coupled KAI incentive. |
| Treasury automation and history | Directly applicable, redesigned execution | Resolution atomically applies an internal NIGHT reserve target; expiry and later restoration are public actions with append-only records. External liquidity execution and unattended submission are not present. |
| User positions, voting power, rewards | Applicable with privacy and custody redesign | Local opening preview and finalized session receipts exist. Stake-weighted voting, unstaking, and claimable yield are deferred until owner authorization, custody, rewards, and linkability are sound. |
| Wallet controls and token balances | Applicable with Midnight wallet redesign | Preprod wallet selection, address, local disconnect, and wallet-reported unshielded balances. |
| Solana rent, priority fees, transfer hooks, VRF, split routing | Not applicable | These chain-specific mechanics are omitted. Kairos fees apply only to its own public trade circuits. |
| Market cap, TVL, price candles, explorer links | Not applicable without a real source | No oracle, exchange price feed, or transaction-indexed history is integrated; these values and links are not invented. |

## Mechanism fit

**Implemented and locally verified:** [weekly rounds](https://docs.fantasticalfactory.com/gameplay/epoch-rounds) become public seven-day Kairos rounds; the prediction is a private side and salt inside Compact circuits, with a public commitment and a resolver who sees openings. The winner sets the public reserve target and fee schedule. The [three-token feedback idea](https://docs.fantasticalfactory.com/overview/three-tokens) becomes Quote A, Quote B, and a bounded KAI trade incentive. [Asymmetric taxes](https://docs.fantasticalfactory.com/gameplay/tax-regime) become fees on Kairos contract-mediated NIGHT/quote trades only. Resolution and expiry apply the target to internal NIGHT redemption reserves atomically; a separate call repairs the split after later trades. Each of those treasury calls appends its resulting public state to on-chain history. These are local compiler and contract-test results, not proof of a current Preprod transaction.

**Redesigned around verified privacy boundaries:** A private position is a salted, fixed-size side commitment with no escrowed stake or payout. The public transaction and its timing remain visible, and the trusted resolver plus its proof server see all eight openings. The result discloses only the winner, but no unique-user rule or strategy anonymity is claimed. Wallet connection and trade authorization use Midnight providers; Solana rent, VRF, transfer hooks, priority fees, split routing, and old token names do not apply.

**Pending before a product claim:** Staking, unstaking, claimable yield, and stake-weighted voting require authenticated custody and payout accounting that the current contract does not provide. A public stake amount could also correlate a user with a private position. We have not treated a fee-free deposit or a frontend balance as a staking product. There is no price feed, historical price chart, transaction ID, or block timestamp in the contract's treasury history; its entries contain action type, round, winner, target, reserves, and fee pool. Wallet-reported balances have a typed connector path and a mocked browser test but no Lace/1AM runtime observation yet. External-liquidity movement and autonomous transaction submission remain unimplemented. The UI shows the KAI trade incentive and public treasury accounting without presenting absent routes as active. See [the capability record](PRODUCT_CAPABILITIES.md) for the contract and Preprod evidence boundary.
