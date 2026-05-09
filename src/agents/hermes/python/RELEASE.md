# Releasing openwolf-hermes

The Python plugin under `src/agents/hermes/python/` ships to PyPI separately
from the OpenWolf npm package. Versions track the plugin's own changelog,
not OpenWolf's main version.

## One-time PyPI setup (Trusted Publishing)

Trusted Publishing avoids long-lived API tokens. Do this once per repo:

1. Create the project on PyPI by logging in at https://pypi.org and clicking
   "Your projects" → publish first version manually OR pre-register the
   project name through the "Pending publishers" UI.
2. Open https://pypi.org/manage/account/publishing/ and click
   **Add a new publisher**.
3. Fill in:
   - **Owner**: `ChasLui`
   - **Repository**: `openwolf`
   - **Workflow name**: `publish-hermes-plugin.yml`
   - **Environment name**: `pypi`
4. Save. PyPI now trusts that exact workflow + environment combination
   to upload `openwolf-hermes`.

## One-time GitHub setup

1. In `ChasLui/openwolf` repo settings → Environments → New environment
   named `pypi`.
2. (Optional but recommended) Enable "Required reviewers" so a human must
   approve before each PyPI upload runs.
3. (Optional) Restrict the environment to tag refs matching
   `openwolf-hermes-v*`.

## Release flow

```bash
cd src/agents/hermes/python

# 1. Bump version in pyproject.toml + __init__.py __version__
#    (must match — both files)
#    For 0.1.0 → 0.2.0:
sed -i '' 's/version = "0.1.0"/version = "0.2.0"/' pyproject.toml
sed -i '' 's/__version__ = "0.1.0"/__version__ = "0.2.0"/' src/openwolf_hermes/__init__.py

# 2. Verify build works locally
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*

# 3. Commit + tag
git add pyproject.toml src/openwolf_hermes/__init__.py
git commit -m "chore(openwolf-hermes): bump to 0.2.0"
git tag openwolf-hermes-v0.2.0
git push origin dev openwolf-hermes-v0.2.0

# 4. GitHub Actions runs publish-hermes-plugin.yml automatically.
#    Watch: https://github.com/ChasLui/openwolf/actions
```

## Dry-run (build without uploading)

`gh workflow run publish-hermes-plugin.yml -f dry_run=true`

Or push to a branch — only tag pushes trigger upload.

## Yanking a bad release

```bash
# Yank from PyPI (keeps version reserved, blocks new installs):
twine yank openwolf-hermes==X.Y.Z --reason "broken: <reason>"

# Or via PyPI web UI: project page → Manage → "Yank release".
```

Never delete a published version — it breaks anyone who depends on it.
Yank instead.

## Why dev-install was used during Phase 3

Phase 3 (commit `c08bb69`) ships the plugin source in the OpenWolf fork
itself. The HermesAdapter does `uv pip install -e <fork>/src/agents/hermes/python/`
— editable install from local checkout. This is intentional during
pre-PyPI alpha so:

- Plugin code can iterate without re-publishing
- The fork is self-contained for local testing
- No external account dependencies block adoption

Once on PyPI, HermesAdapter should switch to plain `uv pip install
openwolf-hermes` (no `-e`, no path arg). That refactor is part of Phase 4b
and lands when the first PyPI release is published.
