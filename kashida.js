/**
 * A JavaScript implementation for finding Kashida insertion points.
 */

import { JoiningGroup, JoiningType, JOINING_GROUP, JOINING_TYPE } from './arabic_joining.js';

export class Kashida {
  constructor(index, priority, max = null) {
    this.index = index;
    this.priority = priority;
    this.max = max;
  }
}

class _Kashidas extends Array {
  append(kashida) {
    if (this.some(k => k.index === kashida.index)) {
      return;
    }
    this.push(kashida);
  }
}

export const Algorithm = {
  SIMPLE: 'simple',
  NASKH: 'naskh'
};

const _KASHIDA_RE = /(\u0640)(?!\u0670|\u0654)/;

const _ALEF = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Alef).map(c => String.fromCharCode(c));
const _BEH = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Beh, JoiningGroup.Noon, JoiningGroup.African_Noon, JoiningGroup.Nya, JoiningGroup.Yeh, JoiningGroup.Farsi_Yeh, JoiningGroup.Burushaski_Yeh_Barree].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _DAL = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Dal).map(c => String.fromCharCode(c));
const _REH = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Reh).map(c => String.fromCharCode(c));
const _SEEN = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Seen).map(c => String.fromCharCode(c));
const _SAD = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Sad).map(c => String.fromCharCode(c));
const _TAH = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Tah).map(c => String.fromCharCode(c));
const _AIN = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Ain).map(c => String.fromCharCode(c));
const _FEH = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Feh, JoiningGroup.African_Feh].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _QAF = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Qaf, JoiningGroup.African_Qaf].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _KAF = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Kaf, JoiningGroup.Gaf].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _LAM = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Lam).map(c => String.fromCharCode(c));
const _HEH = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Heh, JoiningGroup.Heh_Goal, JoiningGroup.Teh_Marbuta, JoiningGroup.Teh_Marbuta_Goal].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _WAW = Object.keys(JOINING_GROUP).filter(c => JOINING_GROUP[c] === JoiningGroup.Waw).map(c => String.fromCharCode(c));
const _YEH = Object.keys(JOINING_GROUP).filter(c => [JoiningGroup.Yeh, JoiningGroup.Farsi_Yeh, JoiningGroup.Yeh_Barree, JoiningGroup.Burushaski_Yeh_Barree, JoiningGroup.Yeh_With_Tail].includes(JOINING_GROUP[c])).map(c => String.fromCharCode(c));
const _RIGHT_JOINING = Object.keys(JOINING_TYPE).filter(c => JOINING_TYPE[c] === JoiningType.Right_Joining).map(c => String.fromCharCode(c));

function _isArabicLetter(c) {
  if (c == '\u0640') return true;
  return c.match(/\p{L}/u) && c.match(/\p{Script=Arab}/u);
};

function _getNextArabicLetter(text, index, step = 1) {
  while (index >= 0 && index < text.length) {
    const c = text[index];
    index += step;
    if (c.match(/\p{Mn}/u)) {
      continue;
    }
    if (!_isArabicLetter(c)) {
      return null;
    }
    return [c, index - step];
  }
  return null;
}

function _getPreviousArabicLetter(text, index) {
  return _getNextArabicLetter(text, index, -1);
}

export function _joinsLeft(word, index) {
  const c1 = _getNextArabicLetter(word, index);
  if (!c1) return false;
  if (_RIGHT_JOINING.includes(c1[0])) return false;
  if (!_getNextArabicLetter(word, c1[1] + 1)) return false;
  return true;
}

export function _joinsRight(word, index) {
  const c1 = _getPreviousArabicLetter(word, index);
  if (!c1) return false;
  const c2 = _getPreviousArabicLetter(word, c1[1] - 1);
  if (!c2) return false;
  if (_RIGHT_JOINING.includes(c2[0])) return false;
  return true;
}

function _isLamAlef(word, index) {
  const c = word[index];
  if (_ALEF.includes(c)) {
    const prev = _getPreviousArabicLetter(word, index - 1);
    if (prev && _LAM.includes(prev[0])) {
      return true;
    }
  }
  return false;
}

function _findKashidaPointsSimple(word) {
  const kashidas = new _Kashidas();

  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    if (!_isArabicLetter(c)) continue;

    let next_c = null;
    let next_i = i + 1;
    const next = _getNextArabicLetter(word, i + 1);
    if (next) {
      next_c = next[0];
      next_i = next[1];
    }

    // 1. After user inserted Kashida
    if (c === '\u0640' && _KASHIDA_RE.test(word.slice(i))) {
      kashidas.append(new Kashida(next_i, 1, null));
    }

    // 2. After initial or medial Seen or Sad
    else if ((_SEEN.includes(c) || _SAD.includes(c)) && _joinsLeft(word, i)) {
      kashidas.append(new Kashida(next_i, 2, null));
    }

    // 3. Before final Heh, Teh Marbuta, or Dal
    else if ((_HEH.includes(c) || _DAL.includes(c)) && _joinsRight(word, i) && !_joinsLeft(word, i)) {
      kashidas.append(new Kashida(i, 3, null));
    }

    // 4. Before final Alef, Tah, Lam, Caf, and Gaf
    else if ((_ALEF.includes(c) || _TAH.includes(c) || _KAF.includes(c) || _LAM.includes(c)) && _joinsRight(word, i) && !_joinsLeft(word, i) && !_isLamAlef(word, i)) {
      kashidas.append(new Kashida(i, 4, null));
    }

    // 5. Before medial Beh followed by final Yeh, Reh, or Alef Maqsura
    else if (_BEH.includes(c) && _joinsLeft(word, i) && _joinsRight(word, i) && (_YEH.includes(next_c) || _REH.includes(next_c))) {
      kashidas.append(new Kashida(i, 5, null));
    }

    // 6. Before final Waw, Ain, Qaf, or Feh
    else if ((_WAW.includes(c) || _AIN.includes(c) || _QAF.includes(c) || _FEH.includes(c)) && _joinsRight(word, i) && !_joinsLeft(word, i)) {
      kashidas.append(new Kashida(i, 6, null));
    }

    // 7. Before any final letter
    else if (_joinsRight(word, i) && !_joinsLeft(word, i) && !_isLamAlef(word, i)) {
      kashidas.append(new Kashida(i, 7, null));
    }
  }

  return kashidas;
}

export function findKashidaPoints(word, algorithm = Algorithm.SIMPLE, removeExistingKashida = true) {
  if (removeExistingKashida) {
    word = word.replace(_KASHIDA_RE, '');
  }

  let kashidas = [];
  if (algorithm === Algorithm.SIMPLE) {
    kashidas = _findKashidaPointsSimple(word);
  } else {
    throw new Error(`Unsupported Kashida algorithm ${algorithm}`);
  }

  return [word, kashidas];
}

export function insertKashidas(word, kashidas, allKashidas = false) {
  if (!kashidas.length) return word;

  if (!allKashidas) {
    kashidas = kashidas.sort((a, b) => (a.priority - b.priority) || (b.index - a.index));
    kashidas = [kashidas[0]];
  }

  let inserted = 0;
  for (const kashida of kashidas) {
    const pos = kashida.index + inserted;
    word = word.slice(0, pos) + '\u0640' + word.slice(pos);
    inserted += 1;
  }

  return word;
}

export function makeKashidaString(text, algorithm = Algorithm.SIMPLE, removeExistingKashida = true, allKashidas = false) {
  const words = text.split(' ');
  const ret = words.map(word => {
    const [newWord, kashidas] = findKashidaPoints(word, algorithm, removeExistingKashida);
    return insertKashidas(newWord, kashidas, allKashidas);
  });

  return ret.join(' ');
}
