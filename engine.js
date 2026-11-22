// Warboard Chess engine: rules, move generation, and alpha-beta AI. Shared by the 2D and 3D games.
// ======================= CHESS ENGINE =======================
const FILES = 'abcdefgh';
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const KN = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const KG = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]];
const ORTH = [[1,0],[-1,0],[0,1],[0,-1]];
const MATE = 100000, INF = 1e9;
const opp = c => (c === 'w' ? 'b' : 'w');
const sqName = s => FILES[s & 7] + ((s >> 3) + 1);

// castling-rights masks: 1=wK 2=wQ 4=bK 8=bQ
const CR = new Array(64).fill(15);
CR[0] &= ~2; CR[7] &= ~1; CR[4] &= ~3; CR[56] &= ~8; CR[63] &= ~4; CR[60] &= ~12;

// piece-square tables, rank 8 first (white's view)
const PST = {
  p:[0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n:[-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b:[-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r:[0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q:[-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k:[-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
  ke:[-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
};

class Chess {
  constructor() { this.reset(); }
  reset() {
    this.board = new Array(64).fill(null);
    let id = 1;
    const back = ['r','n','b','q','k','b','n','r'];
    for (let f = 0; f < 8; f++) {
      this.board[f] = { t: back[f], c: 'w', id: id++ };
      this.board[8 + f] = { t: 'p', c: 'w', id: id++ };
      this.board[48 + f] = { t: 'p', c: 'b', id: id++ };
      this.board[56 + f] = { t: back[f], c: 'b', id: id++ };
    }
    this.turn = 'w'; this.castle = 15; this.ep = -1; this.half = 0; this.full = 1;
    this.kings = { w: 4, b: 60 };
    this.history = []; this.log = []; this.keys = [this.key()];
  }
  key() {
    let s = '';
    for (let i = 0; i < 64; i++) { const p = this.board[i]; s += p ? (p.c === 'w' ? p.t.toUpperCase() : p.t) : '.'; }
    return s + this.turn + this.castle + this.ep;
  }
  attacked(s, by) {
    const b = this.board, f = s & 7, r = s >> 3;
    const pr = by === 'w' ? r - 1 : r + 1;
    if (pr >= 0 && pr < 8) for (const df of [-1, 1]) {
      const ff = f + df; if (ff < 0 || ff > 7) continue;
      const p = b[pr * 8 + ff]; if (p && p.c === by && p.t === 'p') return true;
    }
    for (const [df, dr] of KN) {
      const ff = f + df, rr = r + dr; if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
      const p = b[rr * 8 + ff]; if (p && p.c === by && p.t === 'n') return true;
    }
    for (const [df, dr] of KG) {
      const ff = f + df, rr = r + dr; if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
      const p = b[rr * 8 + ff]; if (p && p.c === by && p.t === 'k') return true;
    }
    for (const [df, dr] of DIAG) {
      let ff = f + df, rr = r + dr;
      while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        const p = b[rr * 8 + ff];
        if (p) { if (p.c === by && (p.t === 'b' || p.t === 'q')) return true; break; }
        ff += df; rr += dr;
      }
    }
    for (const [df, dr] of ORTH) {
      let ff = f + df, rr = r + dr;
      while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        const p = b[rr * 8 + ff];
        if (p) { if (p.c === by && (p.t === 'r' || p.t === 'q')) return true; break; }
        ff += df; rr += dr;
      }
    }
    return false;
  }
  inCheck(c = this.turn) { return this.attacked(this.kings[c], opp(c)); }
  pseudo(c, out) {
    const b = this.board;
    for (let s = 0; s < 64; s++) {
      const p = b[s]; if (!p || p.c !== c) continue;
      const f = s & 7, r = s >> 3;
      switch (p.t) {
        case 'p': {
          const dir = c === 'w' ? 1 : -1, start = c === 'w' ? 1 : 6, last = c === 'w' ? 7 : 0, r1 = r + dir;
          if (r1 < 0 || r1 > 7) break;
          const t1 = r1 * 8 + f;
          if (!b[t1]) {
            this.addPawn(s, t1, null, r1 === last, out);
            const t2 = (r + 2 * dir) * 8 + f;
            if (r === start && !b[t2]) out.push({ from: s, to: t2, capSq: null, dbl: true });
          }
          for (const df of [-1, 1]) {
            const ff = f + df; if (ff < 0 || ff > 7) continue;
            const t = r1 * 8 + ff;
            if (b[t] && b[t].c !== c) this.addPawn(s, t, t, r1 === last, out);
            else if (t === this.ep && !b[t]) out.push({ from: s, to: t, capSq: r * 8 + ff, ep: true });
          }
          break;
        }
        case 'n': this.steps(s, f, r, KN, c, out); break;
        case 'k': {
          this.steps(s, f, r, KG, c, out);
          const o = opp(c), base = c === 'w' ? 0 : 56;
          if (s === base + 4) {
            const kf = c === 'w' ? 1 : 4, qf = c === 'w' ? 2 : 8;
            const rk = b[base + 7], rq = b[base];
            if ((this.castle & kf) && rk && rk.t === 'r' && rk.c === c && !b[base + 5] && !b[base + 6] &&
                !this.attacked(base + 4, o) && !this.attacked(base + 5, o) && !this.attacked(base + 6, o))
              out.push({ from: s, to: base + 6, capSq: null, castle: 'K' });
            if ((this.castle & qf) && rq && rq.t === 'r' && rq.c === c && !b[base + 3] && !b[base + 2] && !b[base + 1] &&
                !this.attacked(base + 4, o) && !this.attacked(base + 3, o) && !this.attacked(base + 2, o))
              out.push({ from: s, to: base + 2, capSq: null, castle: 'Q' });
          }
          break;
        }
        case 'b': this.slides(s, f, r, DIAG, c, out); break;
        case 'r': this.slides(s, f, r, ORTH, c, out); break;
        case 'q': this.slides(s, f, r, DIAG, c, out); this.slides(s, f, r, ORTH, c, out); break;
      }
    }
    return out;
  }
  addPawn(s, t, cap, promo, out) {
    if (promo) for (const pr of ['q', 'r', 'b', 'n']) out.push({ from: s, to: t, capSq: cap, promo: pr });
    else out.push({ from: s, to: t, capSq: cap });
  }
  steps(s, f, r, dirs, c, out) {
    for (const [df, dr] of dirs) {
      const ff = f + df, rr = r + dr; if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
      const t = rr * 8 + ff, p = this.board[t];
      if (!p) out.push({ from: s, to: t, capSq: null });
      else if (p.c !== c) out.push({ from: s, to: t, capSq: t });
    }
  }
  slides(s, f, r, dirs, c, out) {
    for (const [df, dr] of dirs) {
      let ff = f + df, rr = r + dr;
      while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        const t = rr * 8 + ff, p = this.board[t];
        if (!p) out.push({ from: s, to: t, capSq: null });
        else { if (p.c !== c) out.push({ from: s, to: t, capSq: t }); break; }
        ff += df; rr += dr;
      }
    }
  }
  make(m) {
    const b = this.board, p = b[m.from];
    const u = { m, piece: p, cap: null, castle: this.castle, ep: this.ep, half: this.half };
    if (m.capSq != null) { u.cap = b[m.capSq]; b[m.capSq] = null; }
    b[m.from] = null;
    b[m.to] = m.promo ? { t: m.promo, c: p.c, id: p.id } : p;
    if (p.t === 'k') this.kings[p.c] = m.to;
    if (m.castle) {
      const base = p.c === 'w' ? 0 : 56;
      if (m.castle === 'K') { b[base + 5] = b[base + 7]; b[base + 7] = null; }
      else { b[base + 3] = b[base]; b[base] = null; }
    }
    this.castle &= CR[m.from] & CR[m.to];
    this.ep = m.dbl ? (m.from + m.to) >> 1 : -1;
    this.half = (p.t === 'p' || u.cap) ? 0 : this.half + 1;
    if (p.c === 'b') this.full++;
    this.turn = opp(p.c);
    this.history.push(u);
    return u;
  }
  undo() {
    const u = this.history.pop(); if (!u) return null;
    const m = u.m, b = this.board;
    b[m.from] = u.piece; b[m.to] = null;
    if (u.cap) b[m.capSq] = u.cap;
    if (u.piece.t === 'k') this.kings[u.piece.c] = m.from;
    if (m.castle) {
      const base = u.piece.c === 'w' ? 0 : 56;
      if (m.castle === 'K') { b[base + 7] = b[base + 5]; b[base + 5] = null; }
      else { b[base] = b[base + 3]; b[base + 3] = null; }
    }
    this.castle = u.castle; this.ep = u.ep; this.half = u.half;
    if (u.piece.c === 'b') this.full--;
    this.turn = u.piece.c;
    return u;
  }
  legal() {
    const c = this.turn, o = opp(c), out = this.pseudo(c, []), res = [];
    for (const m of out) { this.make(m); if (!this.attacked(this.kings[c], o)) res.push(m); this.undo(); }
    return res;
  }
  sanOf(m, legal) {
    const b = this.board, p = b[m.from];
    let s;
    if (m.castle) s = m.castle === 'K' ? 'O-O' : 'O-O-O';
    else {
      const cap = m.capSq != null;
      let pre = '';
      if (p.t === 'p') pre = cap ? FILES[m.from & 7] : '';
      else {
        pre = p.t.toUpperCase();
        const others = legal.filter(o => o.to === m.to && o.from !== m.from && b[o.from].t === p.t);
        if (others.length) {
          const sameFile = others.some(o => (o.from & 7) === (m.from & 7));
          const sameRank = others.some(o => (o.from >> 3) === (m.from >> 3));
          if (!sameFile) pre += FILES[m.from & 7];
          else if (!sameRank) pre += (m.from >> 3) + 1;
          else pre += sqName(m.from);
        }
      }
      s = pre + (cap ? 'x' : '') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
    }
    this.make(m);
    if (this.inCheck()) s += this.legal().length ? '+' : '#';
    this.undo();
    return s;
  }
  play(m) {
    const san = this.sanOf(m, this.legal());
    this.make(m);
    this.log.push(san);
    this.keys.push(this.key());
    return san;
  }
  takeback() {
    if (!this.history.length) return false;
    this.undo(); this.log.pop(); this.keys.pop();
    return true;
  }
  insufficient() {
    const rest = [];
    for (const p of this.board) if (p && p.t !== 'k') rest.push(p);
    if (rest.length === 0) return true;
    if (rest.length === 1 && (rest[0].t === 'n' || rest[0].t === 'b')) return true;
    return false;
  }
  status() {
    const moves = this.legal();
    if (!moves.length) return this.inCheck() ? { over: true, result: 'mate', winner: opp(this.turn) } : { over: true, result: 'stalemate' };
    if (this.half >= 100) return { over: true, result: 'fifty' };
    const k = this.keys[this.keys.length - 1];
    if (this.keys.filter(x => x === k).length >= 3) return { over: true, result: 'repetition' };
    if (this.insufficient()) return { over: true, result: 'material' };
    return { over: false, check: this.inCheck() };
  }
  // ---------- AI ----------
  evaluate() {
    const b = this.board;
    let s = 0, queens = 0, minors = 0;
    for (let i = 0; i < 64; i++) { const p = b[i]; if (!p) continue; if (p.t === 'q') queens++; else if (p.t === 'n' || p.t === 'b' || p.t === 'r') minors++; }
    const endgame = queens === 0 || (queens <= 2 && minors <= 2);
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (!p) continue;
      const r = i >> 3, f = i & 7;
      const idx = p.c === 'w' ? (7 - r) * 8 + f : r * 8 + f;
      const tbl = p.t === 'k' && endgame ? PST.ke : PST[p.t];
      const v = VAL[p.t] + tbl[idx];
      s += p.c === 'w' ? v : -v;
    }
    return this.turn === 'w' ? s : -s;
  }
  order(moves) {
    const b = this.board;
    for (const m of moves) {
      let s = 0;
      if (m.capSq != null) s = 1000 + 10 * VAL[b[m.capSq].t] - VAL[b[m.from].t];
      if (m.promo) s += VAL[m.promo];
      m.s = s;
    }
    moves.sort((a, c) => c.s - a.s);
  }
  quiesce(alpha, beta, qd) {
    this.nodes++;
    const stand = this.evaluate();
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (qd >= 6) return alpha;
    const c = this.turn, o = opp(c);
    const moves = this.pseudo(c, []).filter(m => m.capSq != null || m.promo === 'q');
    this.order(moves);
    for (const m of moves) {
      this.make(m);
      if (this.attacked(this.kings[c], o)) { this.undo(); continue; }
      const sc = -this.quiesce(-beta, -alpha, qd + 1);
      this.undo();
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  search(depth, alpha, beta, ply) {
    if (depth <= 0) return this.quiesce(alpha, beta, 0);
    this.nodes++;
    const c = this.turn, o = opp(c);
    const moves = this.pseudo(c, []);
    this.order(moves);
    let any = false;
    for (const m of moves) {
      this.make(m);
      if (this.attacked(this.kings[c], o)) { this.undo(); continue; }
      any = true;
      const sc = -this.search(depth - 1, -beta, -alpha, ply + 1);
      this.undo();
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    if (!any) return this.attacked(this.kings[c], o) ? -MATE + ply : 0;
    return alpha;
  }
  bestMove(level) {
    const depth = [1, 3, 4][level] ?? 3, noise = [90, 12, 0][level] ?? 0;
    const moves = this.legal(); if (!moves.length) return null;
    this.order(moves); this.nodes = 0;
    let best = moves[0], bestSc = -INF, alpha = -INF;
    for (const m of moves) {
      this.make(m);
      let sc = -this.search(depth - 1, -INF, noise ? INF : -alpha, 1);
      this.undo();
      if (noise) sc += (Math.random() * 2 - 1) * noise;
      if (sc > bestSc) { bestSc = sc; best = m; }
      if (sc > alpha) alpha = sc;
    }
    return best;
  }
  perft(d) {
    if (d === 0) return 1;
    let n = 0;
    for (const m of this.legal()) { this.make(m); n += this.perft(d - 1); this.undo(); }
    return n;
  }
}
if (typeof module !== 'undefined') module.exports = { Chess };
