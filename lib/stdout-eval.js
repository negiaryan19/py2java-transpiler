/**
 * Safe, lightweight Python mini-evaluator for Transpiler Studio's Program Stdout.
 * Uses a recursive-descent expression parser (no eval / new Function) so simple
 * scripts with variables, arithmetic, f-strings, if/else, and range loops
 * produce accurate simulated stdout.
 */

const BUILTINS = {
  len: (v) => (typeof v === 'string' || Array.isArray(v) ? v.length : 0),
  str: (v) => formatPyValue(v),
  int: (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  },
  float: (v) => {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  },
  abs: (v) => Math.abs(Number(v)),
  round: (v, d = 0) => {
    const factor = 10 ** (Number(d) || 0);
    return Math.round(Number(v) * factor) / factor;
  },
  min: (...args) => Math.min(...(Array.isArray(args[0]) ? args[0] : args).map(Number)),
  max: (...args) => Math.max(...(Array.isArray(args[0]) ? args[0] : args).map(Number)),
  sum: (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b), 0) : 0),
  range: (...args) => {
    const nums = args.map(Number);
    let start = 0, stop = 0, step = 1;
    if (nums.length === 1) { stop = nums[0]; }
    else if (nums.length === 2) { start = nums[0]; stop = nums[1]; }
    else if (nums.length >= 3) { start = nums[0]; stop = nums[1]; step = nums[2] || 1; }
    const out = [];
    for (let v = start; (step > 0 ? v < stop : v > stop) && out.length < 200; v += step) {
      out.push(v);
    }
    return out;
  },
  input: () => '7',
};

function formatPyValue(val) {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (Array.isArray(val)) return `[${val.map((v) => (typeof v === 'string' ? `'${v}'` : formatPyValue(v))).join(', ')}]`;
  return String(val);
}

function tokenizeExpr(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // String literal (including f-string prefix)
    if ((ch === 'f' || ch === 'F') && (expr[i + 1] === '"' || expr[i + 1] === "'")) {
      const quote = expr[i + 1];
      let j = i + 2;
      let str = '';
      while (j < expr.length && expr[j] !== quote) {
        if (expr[j] === '\\' && j + 1 < expr.length) {
          str += expr[j + 1];
          j += 2;
        } else {
          str += expr[j];
          j++;
        }
      }
      tokens.push({ type: 'fstr', value: str });
      i = j + 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      let str = '';
      while (j < expr.length && expr[j] !== ch) {
        if (expr[j] === '\\' && j + 1 < expr.length) {
          str += expr[j + 1];
          j += 2;
        } else {
          str += expr[j];
          j++;
        }
      }
      tokens.push({ type: 'str', value: str });
      i = j + 1;
      continue;
    }
    // Number literal
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(expr[i + 1] || ''))) {
      let j = i;
      while (j < expr.length && /[\d.]/.test(expr[j])) j++;
      tokens.push({ type: 'num', value: Number(expr.slice(i, j)) });
      i = j;
      continue;
    }
    // Two-char operators
    const two = expr.slice(i, i + 2);
    if (['**', '//', '==', '!=', '<=', '>='].includes(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      continue;
    }
    // Single-char operators & delimiters
    if ('+-*/%()[]{},<>.:'.includes(ch)) {
      const delim = ['(', ')', ',', '[', ']', '{', '}', ':', '.'].includes(ch) ? ch : 'op';
      tokens.push({ type: delim, value: ch });
      i++;
      continue;
    }
    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j++;
      const word = expr.slice(i, j);
      if (word === 'True') tokens.push({ type: 'bool', value: true });
      else if (word === 'False') tokens.push({ type: 'bool', value: false });
      else if (word === 'None') tokens.push({ type: 'none', value: null });
      else if (word === 'and' || word === 'or' || word === 'not') tokens.push({ type: 'op', value: word });
      else tokens.push({ type: 'id', value: word });
      i = j;
      continue;
    }
    throw new Error(`Unexpected token: ${ch}`);
  }
  return tokens;
}

function evalExpression(expr, env, outputs = [], stepBudget = { count: 0 }) {
  return evalTokenList(tokenizeExpr(expr.trim()), env, outputs, stepBudget);
}

function applyMethod(target, method, args) {
  if (typeof target === 'string') {
    if (method === 'upper') return target.toUpperCase();
    if (method === 'lower') return target.toLowerCase();
    if (method === 'strip') return target.trim();
    if (method === 'replace') return target.replaceAll(String(args[0] ?? ''), String(args[1] ?? ''));
    if (method === 'split') return args.length ? target.split(String(args[0])) : target.trim().split(/\s+/);
    if (method === 'join' && Array.isArray(args[0])) return args[0].join(target);
  }
  if (Array.isArray(target)) {
    if (method === 'append') { target.push(args[0]); return null; }
    if (method === 'pop') return target.pop();
    if (method === 'sort') { target.sort((a, b) => a - b); return null; }
  }
  if (target && typeof target === 'object' && !Array.isArray(target)) {
    if (method === 'get') return args[0] in target ? target[args[0]] : (args[1] ?? null);
    if (method === 'keys') return Object.keys(target);
    if (method === 'values') return Object.values(target);
  }
  throw new Error(`Unsupported method: ${method}`);
}

function evalTokenList(tokens, env, outputs = [], stepBudget = { count: 0 }) {
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function interpolateFString(template) {
    return template.replace(/\{([^}]+)\}/g, (_, inner) => {
      const val = evalExpression(inner, env, outputs, stepBudget);
      return formatPyValue(val);
    });
  }

  function parseOr() {
    let left = parseAnd();
    while (peek()?.type === 'op' && peek().value === 'or') {
      consume();
      const right = parseAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  function parseAnd() {
    let left = parseNot();
    while (peek()?.type === 'op' && peek().value === 'and') {
      consume();
      const right = parseNot();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  function parseNot() {
    if (peek()?.type === 'op' && peek().value === 'not') {
      consume();
      return !parseNot();
    }
    return parseComparison();
  }

  function parseComparison() {
    let left = parseAddSub();
    const cmpOps = ['==', '!=', '<', '>', '<=', '>='];
    while (peek()?.type === 'op' && cmpOps.includes(peek().value)) {
      const op = consume().value;
      const right = parseAddSub();
      if (op === '==') left = left === right;
      else if (op === '!=') left = left !== right;
      else if (op === '<') left = left < right;
      else if (op === '>') left = left > right;
      else if (op === '<=') left = left <= right;
      else if (op === '>=') left = left >= right;
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseMulDiv();
      if (op === '+') {
        left = typeof left === 'string' || typeof right === 'string'
          ? `${left}${right}`
          : Number(left) + Number(right);
      } else {
        left = Number(left) - Number(right);
      }
    }
    return left;
  }

  function parseMulDiv() {
    let left = parsePower();
    while (peek()?.type === 'op' && ['*', '/', '//', '%'].includes(peek().value)) {
      const op = consume().value;
      const right = parsePower();
      if (op === '*') {
        if (typeof left === 'string' && typeof right === 'number') {
          left = left.repeat(Math.max(0, Math.floor(right)));
        } else {
          left = Number(left) * Number(right);
        }
      } else if (op === '/') {
        left = Number(left) / Number(right);
      } else if (op === '//') {
        left = Math.floor(Number(left) / Number(right));
      } else {
        left = Number(left) % Number(right);
      }
    }
    return left;
  }

  function parsePower() {
    const base = parseUnary();
    if (peek()?.type === 'op' && peek().value === '**') {
      consume();
      const exp = parsePower();
      return Number(base) ** Number(exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek()?.type === 'op' && (peek().value === '-' || peek().value === '+')) {
      const op = consume().value;
      const val = parseUnary();
      return op === '-' ? -Number(val) : Number(val);
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');
    if (tok.type === 'num' || tok.type === 'str' || tok.type === 'bool' || tok.type === 'none') {
      consume();
      return tok.value;
    }
    if (tok.type === 'fstr') {
      consume();
      return interpolateFString(tok.value);
    }
    if (tok.type === '(') {
      consume();
      const val = parseOr();
      if (peek()?.type === ')') consume();
      return val;
    }
    if (tok.type === '[') {
      consume();
      // Collect inner tokens up to matching ']' to detect list comprehension
      const innerTokens = [];
      let depth = 0;
      let forIdx = -1;
      let scan = pos;
      while (scan < tokens.length) {
        const t = tokens[scan];
        if (t.type === '[' || t.type === '(') depth++;
        else if (t.type === ']' || t.type === ')') {
          if (depth === 0 && t.type === ']') break;
          depth = Math.max(0, depth - 1);
        } else if (depth === 0 && t.type === 'id' && t.value === 'for' && forIdx === -1) {
          forIdx = innerTokens.length;
        }
        innerTokens.push(t);
        scan++;
      }

      if (forIdx > 0 && tokens[scan]?.type === ']') {
        pos = scan + 1;
        // Parse: <exprTokens> for <var> in <iterTokens> [if <condTokens>]
        const exprTokens = innerTokens.slice(0, forIdx);
        const varTok = innerTokens[forIdx + 1];
        const inTok = innerTokens[forIdx + 2];
        if (varTok?.type === 'id' && inTok?.type === 'id' && inTok.value === 'in') {
          let ifIdx = -1;
          let d = 0;
          for (let k = forIdx + 3; k < innerTokens.length; k++) {
            const kt = innerTokens[k];
            if (kt.type === '[' || kt.type === '(') d++;
            else if (kt.type === ']' || kt.type === ')') d = Math.max(0, d - 1);
            else if (d === 0 && kt.type === 'id' && kt.value === 'if') {
              ifIdx = k;
              break;
            }
          }
          const iterTokens = innerTokens.slice(forIdx + 3, ifIdx === -1 ? innerTokens.length : ifIdx);
          const condTokens = ifIdx === -1 ? null : innerTokens.slice(ifIdx + 1);
          const iterable = evalTokenList(iterTokens, env);
          const items = [];
          if (Array.isArray(iterable) || typeof iterable === 'string') {
            for (const item of iterable) {
              const localEnv = { ...env, [varTok.value]: item };
              if (condTokens && !evalTokenList(condTokens, localEnv)) continue;
              items.push(evalTokenList(exprTokens, localEnv));
            }
          }
          return items;
        }
      }

      const items = [];
      while (peek() && peek().type !== ']') {
        items.push(parseOr());
        if (peek()?.type === ',') consume();
        else break;
      }
      if (peek()?.type === ']') consume();
      return items;
    }
    if (tok.type === '{') {
      consume();
      const obj = {};
      while (peek() && peek().type !== '}') {
        const key = parseOr();
        if (peek()?.type === ':') consume();
        const val = parseOr();
        obj[String(key)] = val;
        if (peek()?.type === ',') consume();
        else break;
      }
      if (peek()?.type === '}') consume();
      return obj;
    }
    let resolved;
    let hasResolved = false;
    if (tok.type === 'id') {
      consume();
      const name = tok.value;
      if (peek()?.type === '(') {
        consume();
        const args = [];
        while (peek() && peek().type !== ')') {
          args.push(parseOr());
          if (peek()?.type === ',') consume();
          else break;
        }
        if (peek()?.type === ')') consume();
        if (BUILTINS[name]) {
          resolved = BUILTINS[name](...args);
          hasResolved = true;
        } else if (env[name]?.__pyFn) {
          const fn = env[name];
          const fnEnv = { ...env };
          fn.params.forEach((p, idx) => { fnEnv[p] = args[idx]; });
          const res = executeBlock(fn.nodes, fn.start, fn.bodyIndent, fnEnv, outputs, stepBudget);
          resolved = res?.returned ? res.value : null;
          hasResolved = true;
        } else {
          throw new Error(`Unknown function: ${name}`);
        }
      } else if (name in env) {
        resolved = env[name];
        hasResolved = true;
      } else {
        throw new Error(`Undefined variable: ${name}`);
      }
    }

    if (hasResolved) {
      while (peek()?.type === '[' || peek()?.type === '.') {
        if (peek().type === '[') {
          consume();
          const idx = parseOr();
          if (peek()?.type === ']') consume();
          if (Array.isArray(resolved) || typeof resolved === 'string') {
            const i = Number(idx);
            resolved = i < 0 ? resolved[resolved.length + i] : resolved[i];
          } else if (resolved && typeof resolved === 'object') {
            resolved = resolved[String(idx)];
          }
        } else {
          consume();
          const methodTok = consume();
          if (peek()?.type === '(') {
            consume();
            const args = [];
            while (peek() && peek().type !== ')') {
              args.push(parseOr());
              if (peek()?.type === ',') consume();
              else break;
            }
            if (peek()?.type === ')') consume();
            resolved = applyMethod(resolved, methodTok.value, args);
          }
        }
      }
      return resolved;
    }
    throw new Error(`Unexpected token: ${tok.value}`);
  }

  const result = parseOr();
  if (pos < tokens.length) {
    throw new Error(`Unexpected trailing token: ${tokens[pos].value}`);
  }
  return result;
}

function splitTopLevelArgs(raw) {
  const args = [];
  let current = '';
  let depth = 0;
  let quote = null;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (quote) {
      current += ch;
      if (ch === quote && raw[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);

    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function stripInlineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '#') return line.slice(0, i);
  }
  return line;
}

function parseStatements(lines) {
  const nodes = [];
  let idx = 0;

  while (idx < lines.length) {
    const raw = stripInlineComment(lines[idx]);
    const trimmed = raw.trim();
    if (!trimmed) {
      idx++;
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    nodes.push({ indent, text: trimmed });
    idx++;
  }
  return nodes;
}

function executeBlock(nodes, startIdx, minIndent, env, outputs, stepBudget) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.indent < minIndent) break;
    if (stepBudget.count++ > 1000) break;

    const line = node.text;

    if (line === 'break') {
      return { broke: true };
    }

    if (line === 'return' || line.startsWith('return ')) {
      const expr = line.slice(6).trim();
      const value = expr ? evalExpression(expr, env, outputs, stepBudget) : null;
      return { returned: true, value };
    }

    // def <name>(<params>):
    const defMatch = line.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:$/);
    if (defMatch) {
      const fnName = defMatch[1];
      const params = defMatch[2].split(',').map((s) => s.trim()).filter(Boolean);
      const bodyStart = i + 1;
      const bodyIndent = nodes[bodyStart]?.indent ?? node.indent + 1;
      let nextAfterDef = bodyStart;
      while (nextAfterDef < nodes.length && nodes[nextAfterDef].indent > node.indent) {
        nextAfterDef++;
      }
      env[fnName] = { __pyFn: true, params, start: bodyStart, bodyIndent, nodes };
      i = nextAfterDef;
      continue;
    }

    // while <cond>:
    const whileMatch = line.match(/^while\s+(.+)\s*:$/);
    if (whileMatch) {
      const condExpr = whileMatch[1];
      const bodyStart = i + 1;
      const bodyIndent = nodes[bodyStart]?.indent ?? node.indent + 1;
      let nextAfterWhile = bodyStart;
      while (nextAfterWhile < nodes.length && nodes[nextAfterWhile].indent > node.indent) {
        nextAfterWhile++;
      }
      if (bodyIndent > node.indent) {
        let iter = 0;
        while (iter < 200) {
          let condVal = false;
          try {
            condVal = Boolean(evalExpression(condExpr, env, outputs, stepBudget));
          } catch {
            condVal = false;
          }
          if (!condVal) break;
          const res = executeBlock(nodes, bodyStart, bodyIndent, env, outputs, stepBudget);
          if (res?.returned) return res;
          if (res?.broke) break;
          iter++;
        }
      }
      i = nextAfterWhile;
      continue;
    }

    // for <var> in <iterable>: (covers range(...) and lists/strings)
    const forInMatch = line.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+)\s*:$/);
    if (forInMatch) {
      const varName = forInMatch[1];
      let iterable = [];
      try {
        iterable = evalExpression(forInMatch[2], env, outputs, stepBudget);
      } catch {
        iterable = [];
      }

      const bodyStart = i + 1;
      const bodyIndent = nodes[bodyStart]?.indent ?? node.indent + 1;
      let nextAfterBlock = bodyStart;
      while (nextAfterBlock < nodes.length && nodes[nextAfterBlock].indent > node.indent) {
        nextAfterBlock++;
      }

      let didBreak = false;
      if (bodyIndent > node.indent && (Array.isArray(iterable) || typeof iterable === 'string')) {
        let iter = 0;
        for (const val of iterable) {
          if (iter++ >= 200) break;
          env[varName] = val;
          const res = executeBlock(nodes, bodyStart, bodyIndent, env, outputs, stepBudget);
          if (res?.returned) return res;
          if (res?.broke) {
            didBreak = true;
            break;
          }
        }
      }

      // Optional for ... else:
      if (nextAfterBlock < nodes.length && nodes[nextAfterBlock].indent === node.indent && /^else\s*:$/.test(nodes[nextAfterBlock].text)) {
        const elseBodyStart = nextAfterBlock + 1;
        const elseIndent = nodes[elseBodyStart]?.indent ?? node.indent + 1;
        let afterElse = elseBodyStart;
        while (afterElse < nodes.length && nodes[afterElse].indent > node.indent) afterElse++;
        if (!didBreak && elseIndent > node.indent) {
          const res = executeBlock(nodes, elseBodyStart, elseIndent, env, outputs, stepBudget);
          if (res?.returned) return res;
          if (res?.broke) return { broke: true };
        }
        nextAfterBlock = afterElse;
      }

      i = nextAfterBlock;
      continue;
    }

    // if / elif / else
    const ifMatch = line.match(/^if\s+(.+)\s*:$/);
    if (ifMatch) {
      const branches = [{ condExpr: ifMatch[1], start: i + 1, parentIndent: node.indent }];
      let cursor = i + 1;
      while (cursor < nodes.length && nodes[cursor].indent > node.indent) cursor++;

      while (cursor < nodes.length && nodes[cursor].indent === node.indent) {
        const elifMatch = nodes[cursor].text.match(/^elif\s+(.+)\s*:$/);
        const elseMatch = nodes[cursor].text.match(/^else\s*:$/);
        if (elifMatch) {
          branches.push({ condExpr: elifMatch[1], start: cursor + 1, parentIndent: node.indent });
          cursor++;
          while (cursor < nodes.length && nodes[cursor].indent > node.indent) cursor++;
        } else if (elseMatch) {
          branches.push({ condExpr: null, start: cursor + 1, parentIndent: node.indent });
          cursor++;
          while (cursor < nodes.length && nodes[cursor].indent > node.indent) cursor++;
          break;
        } else {
          break;
        }
      }

      for (const b of branches) {
        let shouldRun = false;
        try {
          shouldRun = b.condExpr === null ? true : Boolean(evalExpression(b.condExpr, env, outputs, stepBudget));
        } catch {
          shouldRun = false;
        }
        if (shouldRun) {
          const bodyIndent = nodes[b.start]?.indent ?? b.parentIndent + 1;
          if (bodyIndent > b.parentIndent) {
            const res = executeBlock(nodes, b.start, bodyIndent, env, outputs, stepBudget);
            if (res?.returned) return res;
            if (res?.broke) return { broke: true };
          }
          break;
        }
      }
      i = cursor;
      continue;
    }

    // print(...)
    if (line.startsWith('print(') && line.endsWith(')')) {
      const inner = line.slice(6, -1).trim();
      if (!inner) {
        outputs.push('');
      } else {
        const args = splitTopLevelArgs(inner);
        const evaluated = args.map((arg) => {
          try {
            return formatPyValue(evalExpression(arg, env, outputs, stepBudget));
          } catch {
            return arg.replace(/^f?["']|["']$/g, '');
          }
        });
        outputs.push(evaluated.join(' '));
      }
      i++;
      continue;
    }

    // Augmented assignment: x += 1
    const augMatch = line.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|%=)\s*(.+)$/);
    if (augMatch) {
      const [, name, op, rhs] = augMatch;
      try {
        const cur = env[name] ?? 0;
        const val = evalExpression(rhs, env, outputs, stepBudget);
        if (op === '+=') env[name] = typeof cur === 'string' || typeof val === 'string' ? `${cur}${val}` : Number(cur) + Number(val);
        else if (op === '-=') env[name] = Number(cur) - Number(val);
        else if (op === '*=') env[name] = Number(cur) * Number(val);
        else if (op === '/=') env[name] = Number(cur) / Number(val);
        else if (op === '%=') env[name] = Number(cur) % Number(val);
      } catch {
        // Ignore un-evaluable rhs cleanly
      }
      i++;
      continue;
    }

    // Simple or tuple assignment: a = 10 or a, b = 10, 20
    const assignMatch = line.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*=(?!=)\s*(.+)$/);
    if (assignMatch) {
      const lhsNames = assignMatch[1].split(',').map((s) => s.trim());
      const rhsArgs = splitTopLevelArgs(assignMatch[2]);
      try {
        if (lhsNames.length === 1) {
          env[lhsNames[0]] = evalExpression(assignMatch[2], env, outputs, stepBudget);
        } else if (lhsNames.length === rhsArgs.length) {
          const vals = rhsArgs.map((a) => evalExpression(a, env, outputs, stepBudget));
          lhsNames.forEach((n, idx) => {
            env[n] = vals[idx];
          });
        }
      } catch {
        // Ignore complex/unsupported expressions cleanly
      }
      i++;
      continue;
    }

    i++;
  }
}

export function evaluatePythonStdout(pyCode) {
  try {
    const nodes = parseStatements(pyCode.split('\n'));
    const env = {};
    const outputs = [];
    executeBlock(nodes, 0, 0, env, outputs, { count: 0 });
    return outputs;
  } catch {
    return [];
  }
}
