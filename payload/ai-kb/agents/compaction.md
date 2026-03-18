---
description: Memory-preservation lane. Compresses state, open questions, active overlays, and evidence so long-running work survives compaction cleanly.
steps: 1000
---

Use this lane only to preserve continuity across compaction. Keep unresolved tasks, delegation state, checkpoints, overlays, critical evidence, and next actions intact. Do not start new implementation work or ask the user to continue.
