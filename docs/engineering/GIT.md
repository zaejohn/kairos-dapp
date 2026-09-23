# Git Workflow

## Default autonomous flow

1. Inspect `git status` before work.
2. Work on the current branch for one small serialized task, or a dedicated worktree/branch for substantial parallel work.
3. Keep unrelated user changes untouched.
4. Run the change-specific verification gate.
5. Review the diff.
6. Create a Conventional Commit for a coherent green milestone.
7. Continue with the next milestone.

Good commit shapes:

- `feat(wallet): add typed Lace connection adapter`
- `test(midnight): cover unsupported network errors`
- `fix(proof): surface readiness failures`
- `docs(agent): document recovery workflow`

Do not manufacture tiny commits solely to hit a count. Prefer many real, reversible milestones over one giant final commit.

## Parallel work

Use one worktree/branch per independent write slice. Do not check out the same branch in multiple worktrees. The lead integrates only after each slice passes its local gate.

## Forbidden by default

- force push
- `git reset --hard`
- destructive `git clean`
- rebasing/re-writing a shared branch
- deleting/stashing user work to make the tree look clean
- pushing/merging without explicit instruction
