# AlembicTest Docs

This is the top-level documentation folder for the AlembicTest verification
window.

Use this folder for long-lived test plans, reproduction notes, smoke reports,
monitoring observations, and validation evidence that belong to the
AlembicTest window itself.

When the control center needs a real-project test, it should assign the test to
the AlembicTest window and link the resulting report from the workspace control
plan, instead of running the test directly in the control-center window.

See [testing-operation-policy.md](testing-operation-policy.md) for the long-term
testing ownership and handoff rules.

Do not store product design plans, source-repository implementation plans, API
keys, local credentials, or private machine-specific state here. Cross-repo
control plans still belong in `docs/workspace/` at the workspace root.
