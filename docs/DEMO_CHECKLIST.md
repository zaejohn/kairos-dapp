# KAIROS demo recording checklist

Record manually using the real wallet browser. Keep secrets and opening contents off screen.

- [ ] Open [the live app](https://kairos-dapp.vercel.app) and show the Garage.
- [ ] Show Lace connected to **Preprod**, with the network visible.
- [ ] Show the README contract address: `ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f`.
- [ ] Show an open round and the public close time. A full round cannot accept another commitment; plan the recording with the resolver. Do not redeploy solely for a recording.
- [ ] Complete the actual participant flow: choose a side off camera, prepare/save the private opening, acknowledge saving, approve one commitment.
- [ ] Show the finalized receipt and increased public commitment count, then run the read-only activity verifier below.
- [ ] Explain PUBLIC / PRIVATE / PROVEN: public hash, index and timing; private side/salt on the ledger; resolver sees openings; proof verifies their tally. Public quote trades are not private positions.
- [ ] For a complete round demo, have eight openings available privately in index order and resolve after close, within the one-day window. Show the published result and reserve target. Do not alter the deadline to fit a video.
- [ ] If demonstrating trading, show finalized issuance/buy/sell receipts separately. Do not imply an unverified circuit ran.
- [ ] Show passing tests, the current CI run, and the 50/22 tester evidence with its CSV row mapping.
- [ ] Disconnect in KAIROS. Review the recording for secrets, readable text and public sharing permissions before submitting it.

```sh
npm run verify:activity -- ed9154cae3c2f2e40e077002ae41dc59b2d4f7052d5224bb99d3ccecbfd3965f <finalized-transaction-hash-or-identifier> commitPosition
```

The README links the owner's earlier recording. A link alone does not establish that it covers this checklist. A Preprod recording does not prove the official Level 6 Mainnet requirement.
