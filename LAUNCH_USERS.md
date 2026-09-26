# Level 6 Users — Preprod

Target: 20 verified wallet addresses

Source: CSV rows 52–73 of `KAIROS (Responses) - Form Responses 1.csv`. The owner confirms these are real people who tested KAIROS. Names and email addresses are omitted.

Validation: each address passes the pinned Midnight SDK Bech32m checksum, Preprod network, unshielded address decoding, and canonical round-trip checks. Dates are valid and preserved from the CSV; its timezone is unspecified. No duplicate wallets exist within or across the two cohorts.

| # | Wallet Address | Date Onboarded |
|---|----------------|------------|
| 1 | mn_addr_preprod15nzayy7r7u4fz7cfjmhjk6v4qc5zayf73pz8lywrmhkjlhvvq95sh59khj | 2026-09-26 |
| 2 | mn_addr_preprod188dpnk2fkdunxulvwmh0h03hgte2eumt40m345wl85wxcds8ajasy2zh42 | 2026-09-26 |
| 3 | mn_addr_preprod1funvl2t09ygzjpqz8ajewhsz8rggeuqmywf67e5dfk43jz9ep2msej05hm | 2026-09-26 |
| 4 | mn_addr_preprod10fjj54cvtx6r9slk273m5t5pa93zm5tnrejcd4d3y3h0cxcawc3s83ysjs | 2026-09-26 |
| 5 | mn_addr_preprod1wznsjkwrq5mfaj2xcstfg0zmk6acjczvueg57hunphl5mrztc8zsv50c29 | 2026-09-26 |
| 6 | mn_addr_preprod1ghkc55xrg36z9pj5xp3evdr5fh2x3h7993kqse67emlunfezptcswfa6vn | 2026-09-26 |
| 7 | mn_addr_preprod1gmyuh0h4mzzmadm2agnla5ytk5kddfr9pxenetjaw834xu4702jsyg39n9 | 2026-09-26 |
| 8 | mn_addr_preprod1afffm69vurh4ugw36adx9anjv0aqhdwqarwx3e2kwruhk4tu3qeqrkq76j | 2026-09-26 |
| 9 | mn_addr_preprod1x800zgd6w49s64n3nr2hrauj7wegvtgtfywtytdf254xend0x6ysp3lwzc | 2026-09-26 |
| 10 | mn_addr_preprod1hhw4z8fe0mlltwkmmmzqnw0weutytwq6md4pcl29x29p2gljme6semew2n | 2026-09-26 |
| 11 | mn_addr_preprod16p79l43h5aehh0hrgjhens2kgt0tghmz54dhauj6mdk76vl6nr5s0fjfvl | 2026-09-26 |
| 12 | mn_addr_preprod1ac4474ymz8hu3dc42rjx70fjhs8euujak8nwne236mrrwtqxqxtsk04xak | 2026-09-26 |
| 13 | mn_addr_preprod1knzk3q94e50hu20he69sxyngjjr5mk2l6yw2eddxvaqhvlndy50qxjja0s | 2026-09-26 |
| 14 | mn_addr_preprod1kt03tydh9ljesapmz698n4u52rmr9g8gfjr0fxz3n9qc4666d5zs76wnzd | 2026-09-26 |
| 15 | mn_addr_preprod1uylmcq2c4e7yg83gudl7s7wpmu86eanpc0dh4an9u3tg56rmuu6q9rcdt2 | 2026-09-26 |
| 16 | mn_addr_preprod1psyxm6zdt4rr34g0zmpg47n43473a4acct3elq370vah9g3dpm2s7p4w0s | 2026-09-26 |
| 17 | mn_addr_preprod140yhlng7l3m3j4ye8vahaj5rkk7epxfjyjpd7j5vv8z44lpthjrs6tvsmj | 2026-09-26 |
| 18 | mn_addr_preprod1nm00cscf57806nedjpjjmku0y8avm4hd7nrm7tkp0r5znarscdfq8ds2tc | 2026-09-26 |
| 19 | mn_addr_preprod1hj75wm65vjpvhawnst0jjucep8lazr0xrcdnf6vyw8ew0juggvxsq04dwk | 2026-09-26 |
| 20 | mn_addr_preprod1mt5p7vtutksxej2ssmh90enahqfr92fawfzwxgp4njedrkawh97qst66dc | 2026-09-26 |
| 21 | mn_addr_preprod17nzxxef0ny7wv47dcyu87dcx6x0uzyran6pf7wxfvknft6dukvjq8xpx8v | 2026-09-26 |
| 22 | mn_addr_preprod19j9vkeu0076s0fth5tskcgwm5fcz249m83ca9eyklqmulmxtarxs746262 | 2026-09-26 |

Current count: 22 / 20

These counts represent real tester submissions with validated wallet addresses. The CSV contains no transaction IDs or signed wallet-control attestations; it does not independently prove one finalized transaction per user. See [row-aligned evidence](docs/evidence/user-feedback.json) and [feedback](docs/FEEDBACK.md).

All 22 additional entries are preserved, exceeding the requested 20-user Preprod target by two. The official Level 6 Mainnet deployment requirement remains separate; see [the requirement audit](docs/challenge/LEVELS_4_6_AUDIT.md).
