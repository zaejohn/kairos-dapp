# Product

## Identity

Build one cumulative Midnight Preprod product across Builder Challenge Levels 1–5:

> A self-rebalancing DeFi treasury where private prediction markets determine where protocol liquidity moves each week. The system uses a closed three-token economy and asymmetric trading taxes to create a feedback loop: users privately express their market conviction, the weekly market resolves, and the treasury automatically reallocates liquidity toward the winning quote-side asset. Midnight keeps individual positions and strategies private while allowing the protocol to act on the aggregate result.

Do not rename the product to Private Voting, Sealed-Bid Auction, or another challenge example merely to fit a category.

## Product loop

```text
private market participation
→ private market conviction
→ verifiable market resolution
→ winning quote-side asset
→ treasury allocation changes
→ liquidity conditions change
→ asymmetric market activity
→ protocol revenue / incentives
→ next weekly market
```

## Required product layers

1. **Three-token economy** — two quote-side assets plus a protocol/incentive role, using only Midnight-supported mechanics.
2. **Asymmetric trading engine** — differing buy/sell friction or equivalent contract-controlled economics where supported.
3. **Private prediction market** — users express market conviction with the strongest correctly supported privacy model.
4. **Market resolution** — produce only the minimum public result required to determine the winning quote-side asset.
5. **Self-rebalancing treasury** — the resolved result changes an auditable treasury allocation policy and, where supported, executes the corresponding liquidity action.

Keep participation, resolution, treasury decision, and treasury execution as separable boundaries unless verified evidence supports a better design.

## Non-negotiables

- Target Midnight Preprod only. Ignore Level 6/Mainnet.
- Never fake Midnight functionality, privacy, token behavior, deployment, transactions, users, feedback, or organizer approval.
- If the ideal mechanism is unsupported, implement the strongest correct supported subset, preserve upgradeable boundaries, and document the limitation.
- Prefer one coherent product over five disconnected challenge demos.
- UI, copy, docs, tests, and contract behavior must describe the same real product.

## Challenge-category conflict

The supplied Level 3 requirements include a fixed idea list, while this product is a private prediction-market DeFi treasury. Do not distort the product to claim it is one of those categories.

If explicit organizer/category approval is required and not verified, record it as an external blocker while continuing all technically independent work.
