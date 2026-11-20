import { test } from 'node:test';
import assert from 'node:assert';
import { alignNodes } from '../lib/ast-aligner.js';
import { TYPE_MAP, lookupTypeMapping } from '../lib/type-mapping.js';
import { parsePython, parseJava } from '../lib/ast-parser.js';

test('AST Aligner: All 25+ TYPE_MAP entries contain valid { java, reason, memory, safety }', () => {
  const requiredKeys = [
    'dict[str, Any]',
    'dict[str, str]',
    'List[str]',
    'List[int]',
    'Optional[str]',
    'Optional[int]',
    'str',
    'int',
    'float',
    'bool',
    'None',
    'tuple[int, str]',
    'Set[str]',
    'Any',
    'bytes',
    '@app.get',
    '@app.post',
    '@app.put',
    '@app.delete',
    'BaseModel',
    'async def',
    'HTTPException',
    'Depends',
    'Query(...)',
    'Path(...)',
  ];

  assert.ok(Object.keys(TYPE_MAP).length >= 25, 'TYPE_MAP must contain at least 25 entries');

  for (const key of requiredKeys) {
    const entry = TYPE_MAP[key];
    assert.ok(entry, `Missing required key in TYPE_MAP: ${key}`);
    assert.ok(typeof entry.java === 'string' && entry.java.trim().length > 0, `Invalid java in ${key}`);
    assert.ok(typeof entry.reason === 'string' && entry.reason.trim().length > 0, `Invalid reason in ${key}`);
    assert.ok(typeof entry.memory === 'string' && entry.memory.trim().length > 0, `Invalid memory in ${key}`);
    assert.ok(typeof entry.safety === 'string' && entry.safety.trim().length > 0, `Invalid safety in ${key}`);
  }
});

test('AST Aligner: Exact TYPE_MAP matches produce green alignment pairs', () => {
  const pythonNodes = [
    {
      id: 'py_node_1',
      kind: 'type_annotation',
      raw_kind: 'type',
      text: 'List[str]',
      range: { startLine: 0, startCol: 10, endLine: 0, endCol: 19 },
      language: 'python',
    },
    {
      id: 'py_node_2',
      kind: 'type_annotation',
      raw_kind: 'type',
      text: 'dict[str, Any]',
      range: { startLine: 1, startCol: 8, endLine: 1, endCol: 22 },
      language: 'python',
    },
    {
      id: 'py_node_3',
      kind: 'decorator',
      raw_kind: 'decorator',
      text: '@app.get',
      range: { startLine: 2, startCol: 0, endLine: 2, endCol: 8 },
      language: 'python',
    },
  ];

  const javaNodes = [
    {
      id: 'java_node_1',
      kind: 'type_annotation',
      raw_kind: 'generic_type',
      text: 'List<String>',
      range: { startLine: 0, startCol: 10, endLine: 0, endCol: 22 },
      language: 'java',
    },
    {
      id: 'java_node_2',
      kind: 'type_annotation',
      raw_kind: 'generic_type',
      text: 'Map<String, Object>',
      range: { startLine: 1, startCol: 8, endLine: 1, endCol: 27 },
      language: 'java',
    },
    {
      id: 'java_node_3',
      kind: 'decorator',
      raw_kind: 'annotation',
      text: '@GetMapping',
      range: { startLine: 2, startCol: 0, endLine: 2, endCol: 11 },
      language: 'java',
    },
  ];

  const pairs = alignNodes(pythonNodes, javaNodes);

  assert.strictEqual(pairs.length, 3, 'Must produce 3 alignment pairs');

  assert.strictEqual(pairs[0].python.text, 'List[str]');
  assert.strictEqual(pairs[0].java.text, 'List<String>');
  assert.strictEqual(pairs[0].confidence, 'exact');
  assert.strictEqual(pairs[0].color, 'green');
  assert.ok(pairs[0].explanation.type_system.includes('java.util.List'));

  assert.strictEqual(pairs[1].python.text, 'dict[str, Any]');
  assert.strictEqual(pairs[1].java.text, 'Map<String, Object>');
  assert.strictEqual(pairs[1].confidence, 'exact');
  assert.strictEqual(pairs[1].color, 'green');

  assert.strictEqual(pairs[2].python.text, '@app.get');
  assert.strictEqual(pairs[2].java.text, '@GetMapping');
  assert.strictEqual(pairs[2].confidence, 'exact');
  assert.strictEqual(pairs[2].color, 'green');
});

test('AST Aligner: Unmatched nodes produce no pair (not a broken pair)', () => {
  const pythonNodes = [
    {
      id: 'py_node_99',
      kind: 'function_def',
      raw_kind: 'identifier',
      text: 'arbitrary_variable_name_xyz',
      range: { startLine: 5, startCol: 0, endLine: 5, endCol: 27 },
      language: 'python',
    },
    {
      id: 'py_node_100',
      kind: 'type_annotation',
      raw_kind: 'type',
      text: 'NonExistentCustomType',
      range: { startLine: 6, startCol: 0, endLine: 6, endCol: 21 },
      language: 'python',
    },
  ];

  const javaNodes = [
    {
      id: 'java_node_99',
      kind: 'type_annotation',
      raw_kind: 'type_identifier',
      text: 'String',
      range: { startLine: 5, startCol: 0, endLine: 5, endCol: 6 },
      language: 'java',
    },
  ];

  const pairs = alignNodes(pythonNodes, javaNodes);

  assert.strictEqual(pairs.length, 0, 'Unmatched nodes must produce empty pairs array');
});

test('AST Aligner: Inferred and self-healed constructs produce purple and amber colors', () => {
  const pythonNodes = [
    {
      id: 'py_node_1',
      kind: 'class_def',
      raw_kind: 'class_definition',
      text: 'class User(BaseModel):',
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 22 },
      language: 'python',
    },
  ];

  const javaNodes = [
    {
      id: 'java_node_1',
      kind: 'class_def',
      raw_kind: 'record_declaration',
      text: 'public record User(int id, String name) {}',
      range: { startLine: 0, startCol: 0, endLine: 0, endCol: 42 },
      language: 'java',
    },
  ];

  const pairs = alignNodes(pythonNodes, javaNodes);
  assert.strictEqual(pairs.length, 1);
  assert.strictEqual(pairs[0].confidence, 'healed');
  assert.strictEqual(pairs[0].color, 'amber');
});
