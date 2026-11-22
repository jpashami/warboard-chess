# Warboard Chess

Real chess on a battlefield. Every soldier walks to its square, and every capture is a duel: the attacker marches in, the defender swings back, and one of them falls.

Inspired by the animated "battle chess" games of the late-80s DOS era, with original characters and art.

**Play online:** 2D at https://jpashami.github.io/warboard-chess/ · 3D at https://jpashami.github.io/warboard-chess/3d/

**Play offline (2D):** download the repo and open `index.html` in any modern browser (it needs `engine.js` beside it). No install, build step or dependencies. The 3D version loads Three.js from a CDN, so it needs an internet connection.

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

## 3D version

A full, playable 3D version lives at [`3d/`](https://jpashami.github.io/warboard-chess/3d/), built with Three.js:

- A lit battlefield with sun and shadows, a stone board, hills, forests, mountains, army camps and waving banners. Drag to orbit, pinch or scroll to zoom.
- All 32 pieces as 3D characters: Legion spearmen in chainmail, knights on barded warhorses, war elephants with howdahs, stone siege towers, a sorceress with a crystal staff and a crowned king with sword and cape; Horde orc spearmen, wolf riders, war elephants with bone spikes, wooden siege towers, a shaman queen and an orc warlord with an axe.
- Every capture is a duel shaped by who fights whom: shield blocks and counters, knights rearing and charging, wolves pouncing, elephants swatting with their trunk or rearing to stomp, towers firing arrows and ramming, sorceresses trading magic bolts and calling down lightning, and a king who grows into a giant for the final blow. Victims fall, get flattened, are thrown through the air, burn to ash or topple over. Comic interludes (chases, taunt dances, trips, trumpeting) and speech bubbles between rounds.
- Knights leap over pieces in their way, as a chess knight should.
- Play against the computer (as either army, three levels) or two players on one screen. The AI runs in a background worker so the battlefield never freezes. Undo, move list, captured pieces, promotion choice, castling and en passant.
- The same camp and war music as the 2D game.
- Built for phones too: full-screen canvas, tap to move, a status bar with Undo / rotate / menu, and a menu that slides up from the bottom. Characters are baked into a few skinned meshes each, so the whole army costs about 200 draw calls.

The characters are built from 3D shapes in code (no model files).

## How it's built

- **Chess engine** (`engine.js`, shared by both versions): written from scratch for this project. Board array, legal-move generation with check filtering, verified with perft (20 / 400 / 8,902 / 197,281 nodes at depths 1–4). The AI is alpha-beta negamax with quiescence search and MVV-LVA move ordering. The piece-square tables come from Tomasz Michniewski's *Simplified Evaluation Function* ([Chess Programming Wiki](https://www.chessprogramming.org/Simplified_Evaluation_Function)).
- **2D renderer** (`index.html`): Canvas 2D with a perspective orbit camera. Characters are drawn procedurally from shapes and gradients (no image files). Pixel mode renders the scene at low resolution and scales it up with nearest-neighbour filtering.
- **3D renderer** (`3d/index.html`): Three.js with physically based materials, procedural rigs (bones driven by pose tables plus procedural gait cycles), and choreographed duels.
- **Sound and music**: Web Audio API, all synthesized live (no audio files). A look-ahead sequencer plays the two themes and crossfades between them.

The engine also runs under Node (`module.exports = { Chess }`) for testing.

## License

[MIT](LICENSE)
