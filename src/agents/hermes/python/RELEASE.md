# Releasing openwolf-hermes

The Python plugin under `src/agents/hermes/python/` ships to PyPI separately
from the OpenWolf npm package. Versions track the plugin's own changelog,
not OpenWolf's main version.

## Current auth: PyPI API token (legacy)

The workflow uploads via `${{ secrets.PYPI_API_TOKEN }}`, a project-scoped
API token stored as a repo secret. Set with:

```bash
printf '%s' '<pypi-token-value>' | gh secret set PYPI_API_TOKEN --repo ChasLui/openwolf
```

PyPI tokens look like `pypi-AgEIcHlwaS5vcmc...`. Generate one at
https://pypi.org/manage/account/token/ scoped to the `openwolf-hermes`
project after the first manual upload (PyPI requires the project to exist
before per-project tokens can be created — for the very first release,
generate an account-wide token, upload, then rotate to a project-scoped
token).

If the token leaks, revoke immediately at the PyPI tokens page and rotate
via `gh secret set` again.

## Recommended long-term: Trusted Publishing (OIDC)

Trusted Publishing replaces long-lived tokens with per-workflow OIDC. To
migrate:

1. Open https://pypi.org/manage/account/publishing/ → **Add a new publisher**.
2. Fill in:
   - **Owner**: `ChasLui`
   - **Repository**: `openwolf`
   - **Workflow name**: `publish-hermes-plugin.yml`
   - **Environment name**: `pypi`
3. In `ChasLui/openwolf` repo settings → Environments → New environment
   named `pypi` (optional: required reviewers for two-person publish).
4. Edit `.github/workflows/publish-hermes-plugin.yml`:
   - Add `permissions: id-token: write` on the `publish` job.
   - Add `environment: { name: pypi, url: https://pypi.org/p/openwolf-hermes }`.
   - Remove `with: password: ${{ secrets.PYPI_API_TOKEN }}` from the
     `pypa/gh-action-pypi-publish` step (Trusted Publishing fills it in
     automatically).
5. Delete the `PYPI_API_TOKEN` secret: `gh secret delete PYPI_API_TOKEN --repo ChasLui/openwolf`.

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
