# HashSmash slides

View them at https://johnservil.github.io/hashsmash-slides/, or as PDFs: [the talk](HashSmash-talk.pdf) and [the backup slides](HashSmash-backup.pdf).

Open `index.html` in a browser. → / ← or click to move between slides; `#3` in the URL opens slide 3.

Every figure is drawn from `data.js`, which `build_data.py` builds from two inputs:

- `literature.json`: best published collision attacks, each with its reference and where its number was read.
- Yukon submission exports in `/tmp/<track>-exploratory.json`
  (`yukon submissions mooselumph/hashsmash/<track> --all --json`).

To refresh: re-export, then `python3 build_data.py`.

## Sources

Papers are in `/workspace/papers/`: 2019/147, 2024/349 and 2026/1080 from the Internet Archive, and 2026/1120 supplied by hand. Abstracts came from ePrint's OAI-PMH interface.

Entries with `log2T: null` are published results without a usable figure: `practical: true` marks a real collision with no stated cost (◇); otherwise there is no figure (?). Both make the line dashed: the strength is at most that level.
