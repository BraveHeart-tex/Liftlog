# ADR-0009: Sandboxed agents reach device stacks through a lease broker

- Status: Accepted
- Date: 2026-11-24

## Context

Agents can run in Docker Sandboxes (`sbx` v0.54.0) on the macOS host. The device stack
([ADR-0008](0008-device-stack-architecture.md)) runs on the host, because emulators, adb
and agent-device need host hardware acceleration and the host adb server. A sandbox
must start, stop and drive the emulator its worktree leases, and must not reach adb,
emulator ports or any device outside that lease. Findings on this host (#168):

- **Git.** A worktree's `.git` file points into the main checkout's git common dir.
  With the worktree mounted alone, `git status` fails (`not a git repository`). With the
  worktree and the git common dir mounted, `git status` and `git commit` work, but the
  sandbox can also write `.git/hooks` and `.git/config`, which host git executes.
  Read-only mounts of those two paths over the read-write common dir block the writes
  and keep `status` and `commit` working. `core.hooksPath` is `.husky/_`, relative to the
  worktree, so the hooks host git runs in that worktree are sandbox-authored either way.
- **Metro.** A host Metro serving the worktree hot-reloads an edit made inside the
  sandbox; the Workout start screen showed the edited heading without a restart. That
  Metro runs the worktree's `metro.config.js`, Babel config and dependencies on the host,
  outside the sandbox. A worktree needs its own `node_modules`; a symlink to the main
  checkout's fails module resolution.
- **Network.** Sandbox egress is default-deny. `host.docker.internal` reaches the host's
  loopback interface, and policy matches it as `localhost:<port>`, so a rule for
  `host.docker.internal:<port>` never matches. With one rule
  `sbx policy allow network --sandbox <name> localhost:<port>`, only that port answered;
  adb (5037), the emulator console (5554), emulator adb (5555) and Metro were refused.
- **agent-device proxy.** `agent-device proxy` forwards any RPC to the host daemon under
  one bearer token. Through it, a sandbox listed both online emulators and took a
  snapshot of the one outside its lease (`--serial emulator-5556`). The proxy has no
  device-scoping option, and starting it replaced the host daemon.
- **Broker prototype.** A per-lease HTTP broker on host `127.0.0.1` refused, from inside
  the sandbox: requests with no or a wrong credential (401), commands outside its
  allowlist such as `adb`, `shell` and `install` (403), and allowlisted commands carrying
  injected arguments such as a second `--serial`, a shell suffix on a ref or a path
  traversal (403).
- **Overhead.** A broker round trip that runs no device command took 2.5-6.5 ms from the
  sandbox (5 runs). `snapshot -i` through the broker took a median of 328 ms against
  267 ms run directly on the host (5 runs each); time outside the broker process was
  6-32 ms, the rest is agent-device variance.

## Decision

A sandboxed agent reaches its device stack only through one foreground **lease broker**
per lease. The broker, not the network policy, is the security boundary.

### Access path

- The sandbox is the existing sandbox named in the host config, whose workspace is the
  main checkout. It holds at most one lease; `device:stack` creates no sandbox.
- Host-side `device:stack` runs from the main checkout, acquires the lease ([lease protocol](0008-device-stack-architecture.md#lease-protocol))
  and starts the broker in the foreground of that host process. Stopping the broker
  releases the lease.
- The broker binds `127.0.0.1` on a port fixed by the lease's slot. The sandbox gets one
  rule, `sbx policy allow network --sandbox <name> localhost:<broker port>`, added with
  the lease and removed with it. No other host port is allowed.
- Start, stop, status, logs and device commands all go through the broker. The sandbox
  never runs adb, agent-device, the emulator or `device:stack` against the host.

### Authorization

- Each lease gets a fresh 256-bit lease credential. The broker compares it in constant
  time on every request and refuses a missing or wrong one.
- The credential reaches the sandbox only through the main checkout's `.device-stack/`
  (owner-only permissions).
- Each allowlisted command maps to a fixed agent-device or `device:stack` argv with the
  lease's serial, session and Metro port filled in by the broker. Arguments are validated
  against per-command patterns (`@ref`, a `liftlog:///` route path, a screenshot name)
  and never passed through, so a request cannot name a flag, serial or file.
- The broker offers no generic command execution, no adb, no `shell`, no install from a
  path and no artifact path outside the lease's `.device-stack/`.

### Workspace mounts

The sandbox mounts the main checkout read-write, so it can change the scripts, hooks and
config the host runs, the broker included. The sandbox is trusted for code: the broker
confines its device access to the lease, not what the host executes. Metro for the
lease is the lease's host Metro on the main checkout
([per-lease Metro](../verification.md#device-checks)), which picks up edits made inside
the sandbox.

## Consequences

- One broker process and one policy rule per lease, both run by `device:stack broker`
  ([sandboxed agents](../verification.md#sandboxed-agents)).
- The sandbox can change any file in the main checkout, move any local ref, including
  `main`, and write objects. Pushes still go through the remote's rules.
- Host and sandbox share the main checkout's `node_modules`; host Metro needs its macOS
  native packages, so an install inside the sandbox must not replace them.
- `agent-device proxy` is not used for sandboxes: its token controls every device the
  host daemon sees.
- Host agents keep using `device:stack` directly
  ([targeting invariants](0008-device-stack-architecture.md#targeting-invariants)).
