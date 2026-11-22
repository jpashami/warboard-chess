# Warboard Chess

Real chess on a battlefield. Every soldier walks to its square, and every capture is a duel: the attacker marches in, the defender swings back, and one of them falls.

Inspired by the animated "battle chess" games of the late-80s DOS era, with original characters and art.

**Play online:** https://jpashami.github.io/warboard-chess/

**Play offline:** open `index.html` in any modern browser. It's a single file with no install, build step or dependencies.

## Armies

| Chess piece | Silver Legion (white) | Iron Horde (black) |
|---|---|---|
| Pawn | Spearman with sun shield | Orc spearman with barbed spear |
| Knight | Lancer on an armored horse | Orc rider on a war wolf |
| Bishop | Armored war elephant with rider (or a wizard, if you switch elephants off) | War mammoth with bone spikes (or an antlered shaman) |
| Rook | Stone siege tower with battering ram | Spiked wooden siege tower |
| Queen | Sorceress (lightning) | Orc shaman queen (lightning) |
| King | Crowned knight-king with sword | Horned warchief with great axe |

## Features

- Full chess rules: castling, en passant, promotion, check, checkmate, stalemate, 50-move rule, threefold repetition, insufficient material.
- Computer opponent with three levels (Recruit, Captain, Warlord), or two players on one screen.
- Orbit camera: drag to rotate and tilt, scroll to zoom, or use the Height / Rotate / Zoom sliders and Top-down / Battle / Reset presets.
- Duels depend on who fights whom: the number of exchanges grows with the defender, underdogs get knocked down first, spellcasters trade spells in mid-air, and each attacker has its own finishing move (lance charge, trunk toss and stomp, battering ram, lightning, three-cut combo). Towers crumble instead of falling.
- Transformations: siege towers unfold walking legs when they move or fight, Legion horses sprout wings and dive from the sky, Horde wolves swell into dire wolves, the sorceress becomes a phoenix, the king grows into a giant for one blow, an outmatched spearman drinks a potion and bulks up, and a mage may turn the enemy into a chicken that runs off the board.
- Comic interludes between rounds: chases around the square, jousting charges, taunt dances, stumbles, with speech bubbles.
- The camera zooms in on each battle. Battles can be set to full duels, epic duels, quick, or off.
- Works on phones: full-width board, a floating status bar with Undo / rotate / menu, tap to move, drag to orbit, pinch to zoom.
- Smooth high-resolution art (default) or a pixel-art style.
- Original music composed in code: a calm lute-and-flute camp theme while you think, switching to a war theme (taiko drums, strings, brass) during duels. Separate toggles for music and effects, plus a volume slider.
- Synthesized sound effects with hall reverb: ringing blade clashes, war horn, grunts, crowd cheers, undo, move list, captured pieces, option to skip battle animations.

## How it's built

Everything is in `index.html`:

- **Chess engine** (the `<script id="engine">` block): written from scratch for this project. Board array, legal-move generation with check filtering, verified with perft (20 / 400 / 8,902 / 197,281 nodes at depths 1–4). The AI is alpha-beta negamax with quiescence search and MVV-LVA move ordering. The piece-square tables come from Tomasz Michniewski's *Simplified Evaluation Function* ([Chess Programming Wiki](https://www.chessprogramming.org/Simplified_Evaluation_Function)).
- **Renderer**: Canvas 2D with a perspective orbit camera. Characters are drawn procedurally from shapes and gradients (no image files). Pixel mode renders the scene at low resolution and scales it up with nearest-neighbour filtering.
- **Sound and music**: Web Audio API, all synthesized live (no audio files). A look-ahead sequencer plays the two themes and crossfades between them.

The engine also runs under Node (`module.exports = { Chess }`) for testing.

## License

[MIT](LICENSE)
