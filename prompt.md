Switch the wallet/deployment flow from Lace to **1AM (https://1am.xyz/)**.

Use 1AM for **Midnight Preprod** deployment instead of Lace. First verify the current 1AM + Midnight integration and required setup, then make the minimum changes needed.

Goal:

- Connect 1AM to Midnight Preprod
- Ensure tNIGHT + DUST are available
- Deploy `contracts/kairos.compact`
- Get the real contract address
- Execute a real circuit transaction
- Confirm the proof server receives `/prove`
- Verify actual proof generation and successful transaction submission
- Run the existing E2E test

Do not mock, fake, or invent anything. Do not modify unrelated code. Preserve the existing passing tests and dependency versions.
