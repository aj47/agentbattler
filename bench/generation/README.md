# Benchmark Agent Generation

This folder stores prompts and artifacts for generating benchmark agents with model+harness
pairs such as Auggie + Claude Sonnet 4.6.

The trusted GitHub Actions workflow `.github/workflows/bench-generate-agent.yml` records:

- exact prompt sent to Auggie
- Auggie model id
- command metadata
- full terminal transcript
- generated agent file
- validation output

Default Auggie model id for Claude Sonnet 4.6 is `sonnet4.6`.

## GitHub Actions setup

Add a repository secret named `AUGMENT_SESSION_AUTH` containing Auggie/Augment session auth.
Then run the `Bench Generate Agent` workflow manually. The workflow uses Auggie interactive
mode, not `--print`, and wraps the run in a 30-minute timeout while recording a terminal
transcript with `script`.

The workflow uploads generated files as an artifact; it does not commit them automatically.

After reviewing the artifact, a maintainer can commit the generated `bench/agents/<slug>.js`
and `bench/agents.json` changes. The trusted benchmark workflow will then run that committed
agent against the rest of the verified pool and publish match logs in its own artifact.