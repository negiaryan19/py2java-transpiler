import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';

/**
 * J-Forge AST Lexical Parser
 *
 * Utilizes tree-sitter grammars to parse Python and Java source code
 * into standardized semantic node sequences for cross-language AST alignment.
 * Includes a resilient regex fallback if native addons fail in constrained runtimes.
 */

let cachedPythonParser = null;
let cachedJavaParser = null;
let parserInitFailed = false;

function getParsers() {
  if (parserInitFailed) return { pythonParser: null, javaParser: null };
  if (cachedPythonParser && cachedJavaParser) {
    return { pythonParser: cachedPythonParser, javaParser: cachedJavaParser };
  }
  try {
    const pyParser = new Parser();
    pyParser.setLanguage(Python);
    const jParser = new Parser();
    jParser.setLanguage(Java);
    cachedPythonParser = pyParser;
    cachedJavaParser = jParser;
    return { pythonParser: pyParser, javaParser: jParser };
  } catch (err) {
    console.warn('[AST Parser] Native tree-sitter init failed, using lexical fallback:', err.message);
    parserInitFailed = true;
    return { pythonParser: null, javaParser: null };
  }
}

function fallbackLexicalScan(sourceCode, language, patternList) {
  const nodes = [];
  const lines = sourceCode.split('\n');
  let counter = 0;
  lines.forEach((line, row) => {
    for (const { regex, kind, raw_kind } of patternList) {
      const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
      let match;
      while ((match = re.exec(line)) !== null) {
        counter += 1;
        nodes.push({
          id: `${language === 'python' ? 'py' : 'java'}_node_${counter}`,
          kind,
          raw_kind,
          text: match[0],
          range: {
            startLine: row,
            startCol: match.index,
            endLine: row,
            endCol: match.index + match[0].length,
          },
          language,
        });
      }
    }
  });
  return nodes;
}

/**
 * @typedef {Object} NodeRange
 * @property {number} startLine - 0-indexed start line
 * @property {number} startCol - 0-indexed start column
 * @property {number} endLine - 0-indexed end line
 * @property {number} endCol - 0-indexed end column
 */

/**
 * @typedef {Object} SemanticNode
 * @property {string} id - Unique node identifier (e.g. "py_node_1")
 * @property {string} kind - Canonical kind ("type_annotation" | "function_def" | "decorator" | "class_def" | "parameter" | "return_type")
 * @property {string} raw_kind - Raw tree-sitter node type string
 * @property {string} text - The source text content of the node
 * @property {NodeRange} range - Positional coordinate range
 * @property {"python" | "java"} language - Language tag
 */

/**
 * Checks if a Python identifier node is used in an annotation or type context
 * @param {any} node - Tree-sitter AST node
 * @returns {boolean}
 */
function isPythonAnnotationContext(node) {
  if (!node || node.type !== 'identifier') return false;
  const parent = node.parent;
  if (!parent) return false;

  const parentType = parent.type;
  // Direct type wrapper or type parameter (e.g. List[str], Optional[int])
  if (
    parentType === 'type' ||
    parentType === 'generic_type' ||
    parentType === 'type_parameter' ||
    parentType === 'subscript' ||
    parentType === 'return_type'
  ) {
    return true;
  }

  // Base class inheritance context (e.g. class User(BaseModel))
  if (parentType === 'argument_list' && parent.parent?.type === 'class_definition') {
    return true;
  }

  // Direct parameter typing context (e.g. def foo(x: int))
  if (parentType === 'typed_parameter' || parentType === 'typed_default_parameter') {
    // Only the type node, not the parameter name identifier
    return parent.namedChildren?.[1]?.id === node.id;
  }

  // Check known standalone type names
  const knownTypes = new Set([
    'str', 'int', 'float', 'bool', 'bytes', 'None', 'Any', 'Optional',
    'List', 'Dict', 'Set', 'Tuple', 'BaseModel', 'HTTPException', 'Depends',
  ]);
  return knownTypes.has(node.text);
}

/**
 * Maps raw Python tree-sitter node types to canonical kinds
 * @param {string} rawKind
 * @returns {string}
 */
function mapPythonKind(rawKind) {
  switch (rawKind) {
    case 'type':
    case 'generic_type':
    case 'subscript':
    case 'attribute':
    case 'identifier':
      return 'type_annotation';
    case 'function_definition':
      return 'function_def';
    case 'decorator':
      return 'decorator';
    case 'class_definition':
      return 'class_def';
    case 'parameters':
    case 'typed_parameter':
    case 'typed_default_parameter':
      return 'parameter';
    case 'return_type':
    case 'return_statement':
      return 'return_type';
    default:
      return 'type_annotation';
  }
}

/**
 * Maps raw Java tree-sitter node types to canonical kinds
 * @param {string} rawKind
 * @returns {string}
 */
function mapJavaKind(rawKind) {
  switch (rawKind) {
    case 'type_identifier':
    case 'generic_type':
    case 'array_type':
    case 'void_type':
      return 'type_annotation';
    case 'method_declaration':
    case 'constructor_declaration':
      return 'function_def';
    case 'annotation':
    case 'marker_annotation':
      return 'decorator';
    case 'class_declaration':
    case 'record_declaration':
    case 'interface_declaration':
      return 'class_def';
    case 'formal_parameter':
    case 'formal_parameters':
      return 'parameter';
    case 'return_statement':
      return 'return_type';
    default:
      return 'type_annotation';
  }
}

/**
 * Recursively parses Python source code and extracts normalized semantic nodes
 * @param {string} sourceCode - Raw Python source code string
 * @returns {SemanticNode[]} Array of normalized Python AST nodes
 */
export function parsePython(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') return [];

  const { pythonParser } = getParsers();
  if (!pythonParser) {
    return fallbackLexicalScan(sourceCode, 'python', [
      { regex: /@\w+(?:\.\w+)*/, kind: 'decorator', raw_kind: 'decorator' },
      { regex: /\b(?:async\s+def|def)\b/, kind: 'function_def', raw_kind: 'function_definition' },
      { regex: /\bclass\s+\w+(?:\([^)]*\))?:/, kind: 'class_def', raw_kind: 'class_definition' },
      { regex: /\b(?:dict|List|Optional|Set|Tuple|tuple)\[[^\]]+\]|\b(?:str|int|float|bool|None|Any|bytes|BaseModel|HTTPException|Depends)\b/, kind: 'type_annotation', raw_kind: 'type' },
    ]);
  }

  const tree = pythonParser.parse(sourceCode);
  const nodes = [];
  let counter = 0;

  const targetTypes = new Set([
    'type',
    'generic_type',
    'subscript',
    'attribute',
    'decorator',
    'function_definition',
    'class_definition',
    'parameters',
    'return_type',
    'typed_parameter',
    'identifier',
  ]);

  function walk(node) {
    if (!node) return;

    if (targetTypes.has(node.type)) {
      let shouldInclude = true;

      // Filter identifier to only include annotation / type context
      if (node.type === 'identifier') {
        shouldInclude = isPythonAnnotationContext(node);
      }

      if (shouldInclude) {
        counter += 1;
        nodes.push({
          id: `py_node_${counter}`,
          kind: mapPythonKind(node.type),
          raw_kind: node.type,
          text: node.text,
          range: {
            startLine: node.startPosition.row,
            startCol: node.startPosition.column,
            endLine: node.endPosition.row,
            endCol: node.endPosition.column,
          },
          language: 'python',
        });
      }
    }

    for (let i = 0; i < node.namedChildCount; i++) {
      walk(node.namedChild(i));
    }
  }

  walk(tree.rootNode);
  return nodes;
}

/**
 * Recursively parses Java source code and extracts normalized semantic nodes
 * @param {string} sourceCode - Raw Java source code string
 * @returns {SemanticNode[]} Array of normalized Java AST nodes
 */
export function parseJava(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') return [];

  const { javaParser } = getParsers();
  if (!javaParser) {
    return fallbackLexicalScan(sourceCode, 'java', [
      { regex: /@\w+/, kind: 'decorator', raw_kind: 'annotation' },
      { regex: /\b(?:public|private)?\s*record\s+\w+\([^)]*\)\s*\{[^}]*\}/, kind: 'class_def', raw_kind: 'record_declaration' },
      { regex: /\b(?:Map|List|Set|Optional|CompletableFuture)<[^>]+>|\b(?:String|Object|Integer|int|double|boolean|void|byte\[\]|ResponseStatusException)\b/, kind: 'type_annotation', raw_kind: 'type_identifier' },
    ]);
  }

  const tree = javaParser.parse(sourceCode);
  const nodes = [];
  let counter = 0;

  const targetTypes = new Set([
    'type_identifier',
    'generic_type',
    'array_type',
    'void_type',
    'annotation',
    'marker_annotation',
    'method_declaration',
    'constructor_declaration',
    'class_declaration',
    'record_declaration',
    'formal_parameter',
    'return_statement',
  ]);

  function walk(node) {
    if (!node) return;

    if (targetTypes.has(node.type)) {
      counter += 1;
      nodes.push({
        id: `java_node_${counter}`,
        kind: mapJavaKind(node.type),
        raw_kind: node.type,
        text: node.text,
        range: {
          startLine: node.startPosition.row,
          startCol: node.startPosition.column,
          endLine: node.endPosition.row,
          endCol: node.endPosition.column,
        },
        language: 'java',
      });
    }

    for (let i = 0; i < node.namedChildCount; i++) {
      walk(node.namedChild(i));
    }
  }

  walk(tree.rootNode);
  return nodes;
}
