import { alignNodes } from '../lib/ast-aligner.js';
import { TYPE_MAP } from '../lib/type-mapping.js';

describe('AST Aligner & Type Mapping Tests', () => {
  test('all 25 TYPE_MAP entries produce valid { java, reason, memory, safety }', () => {
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

    expect(Object.keys(TYPE_MAP).length).toBeGreaterThanOrEqual(25);

    for (const key of requiredKeys) {
      const entry = TYPE_MAP[key];
      expect(entry).toBeDefined();
      expect(typeof entry.java).toBe('string');
      expect(typeof entry.reason).toBe('string');
      expect(typeof entry.memory).toBe('string');
      expect(typeof entry.safety).toBe('string');
      expect(entry.java.length).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
      expect(entry.memory.length).toBeGreaterThan(0);
      expect(entry.safety.length).toBeGreaterThan(0);
    }
  });

  test('exact TYPE_MAP matches produce green alignment', () => {
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
        kind: 'decorator',
        raw_kind: 'decorator',
        text: '@app.get',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 8 },
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
        kind: 'decorator',
        raw_kind: 'annotation',
        text: '@GetMapping',
        range: { startLine: 1, startCol: 0, endLine: 1, endCol: 11 },
        language: 'java',
      },
    ];

    const pairs = alignNodes(pythonNodes, javaNodes);
    expect(pairs.length).toBe(2);

    expect(pairs[0].color).toBe('green');
    expect(pairs[0].confidence).toBe('exact');
    expect(pairs[0].python.text).toBe('List[str]');
    expect(pairs[0].java.text).toBe('List<String>');

    expect(pairs[1].color).toBe('green');
    expect(pairs[1].confidence).toBe('exact');
    expect(pairs[1].python.text).toBe('@app.get');
    expect(pairs[1].java.text).toBe('@GetMapping');
  });

  test('unmatched nodes produce no pair (not a broken pair)', () => {
    const pythonNodes = [
      {
        id: 'py_node_99',
        kind: 'function_def',
        raw_kind: 'identifier',
        text: 'unknown_helper_function',
        range: { startLine: 2, startCol: 0, endLine: 2, endCol: 23 },
        language: 'python',
      },
    ];

    const javaNodes = [
      {
        id: 'java_node_99',
        kind: 'type_annotation',
        raw_kind: 'type_identifier',
        text: 'Integer',
        range: { startLine: 2, startCol: 0, endLine: 2, endCol: 7 },
        language: 'java',
      },
    ];

    const pairs = alignNodes(pythonNodes, javaNodes);
    expect(pairs.length).toBe(0);
  });
});
