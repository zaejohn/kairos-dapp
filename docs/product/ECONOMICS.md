# Economic Reference

## Primary reference

Study `https://docs.fantasticalfactory.com/` before finalizing the product economics.

Fantastical Factory is an **economic/mechanism reference**, not an implementation specification.

Extract useful principles such as:

- closed three-token economy;
- asymmetric buy/sell taxation or friction;
- recurring rounds/epochs;
- protocol-generated market imbalance;
- arbitrage/trading incentives;
- protocol-owned liquidity;
- protocol-controlled treasury/fund behavior;
- fee-funded rewards/incentives;
- self-reinforcing feedback loops.

Do not blindly port:

- Solana PDAs;
- Anchor/CPI architecture;
- Token-2022 transfer hooks;
- Switchboard VRF;
- Solana slot timing;
- its AMM, fund, or reward implementation;
- old token names, product terminology, or UI copy.

Recreate the economic idea using verified Midnight-native capabilities.

## Intended Midnight loop

```text
private prediction market
→ aggregate/verifiable result
→ winning quote-side asset
→ treasury target changes
→ liquidity conditions change
→ asymmetric trading activity
→ protocol revenue / incentives
→ next weekly market
```

## Three-token design rule

Do not mechanically clone CRIME/FRAUD/PROFIT. Choose product-appropriate roles after verifying what Midnight Preprod can actually support. If full on-chain token mechanics are unavailable, keep the interfaces modular and implement only the real supported subset.

## Asymmetric-friction rule

Do not assume transfer-hook taxation exists on Midnight. If friction/taxation must be enforced through protocol-controlled trading functions or accounting logic, implement and document it that way. Never describe a simulation as deployed on-chain functionality.
