I now have both **tNIGHT and DUST on Midnight Preprod in 1AM**.

Proceed with the existing KAIROS deployment flow now.

- Keep the proof server running.
- Deploy `contracts/kairos.compact` to Preprod.
- Use 1AM for wallet signing.
- Get the real contract address.
- Update the required `.env`/config.
- Execute a real KAIROS circuit call.
- Verify the proof server receives `/prove`.
- Verify the transaction succeeds.
- Run the existing E2E proving test.

Do not mock or invent anything. Stop and diagnose if anything fails.
