# AlembicTest Config

This folder owns AlembicTest verification configuration. The control center
should not keep ad hoc testing defaults in root scripts or root docs.

`defaults.json` defines:

- default real-project verification target;
- Alembic repository path for local runtime smoke;
- restart wait / stop / status timing;
- monitor polling, timeout, log tail, and signal matching defaults.

Do not store secrets, API keys, local credentials, absolute user paths, or
project-private runtime data in this folder. Runtime-specific values should be
passed as command-line arguments when an AlembicTest window performs a test.
