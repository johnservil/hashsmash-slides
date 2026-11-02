# HashSmash slides

Zooko's talk on secure hashes and [HashSmash](https://HashSma.sh), at the
Ethereum Foundation's post-quantum cryptography workshop in Cambridge,
updated on 2 November 2026 with HashSmash's results since: SHA-256 is now
attacked to 39 rounds.

- **The slides:** https://johnservil.github.io/hashsmash-slides/
  (→ / ← or a click moves between slides; `#3` in the address opens slide 3)
- **As a PDF:** [HashSmash-talk.pdf](HashSmash-talk.pdf)
- **The talk as given at the workshop:** [HashSmash-talk-workshop.pdf](HashSmash-talk-workshop.pdf)
- **SLH-DSA and ML-DSA as tables on legs:** [slh-dsa-vs-ml-dsa.png](slh-dsa-vs-ml-dsa.png)

## How the figures are made

Every figure is drawn from `data.js`, which `python3 build_data.py` builds
from two inputs:

- `literature.json`: the best published collision attacks, each with its
  reference and where its number was read.
- HashSmash's submissions, read from Yukon's public API: the tracks of fixed
  round counts, and the pareto benchmarks, which hold the 39-round SHA-256
  results and the cost of generic search for each full hash.

HashSmash's cost model prices generic collision search for the full hash
below 2^128 (2^124.1 for SHA-256, 2^124.5 for SHA3-256, 2^124.9 for BLAKE3),
since it counts a fast implementation's operations. So the slides shift
each HashSmash result by its hash's level, to measure it against generic
search priced the same way: the 39-round attack's 2^116.6 shows as 2^120.5.

To refresh, run `python3 build_data.py` and export the PDF from
`index.html?print=1`.

## Sources

The papers cited are ePrint 2019/147, 2024/349, 2026/1080 and 2026/1120.

Entries with `log2T: null` are published results without a usable figure:
`practical: true` marks a real collision with no stated cost (◇); otherwise
there is no figure (?). Both make the line dashed: the strength is at most
that level.
