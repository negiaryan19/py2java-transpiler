import { TYPE_MAP, lookupTypeMapping, normalizePythonType } from './type-mapping.js';

/**
 * J-Forge AST Cross-Language Alignment Engine
 *
 * Correlates semantic AST nodes between Python source and transpiled Java code
 * based on the enterprise type mapping dictionary, assigning confidence scores,
 * visual diff color indicators, and deep architectural explanations.
 */

/**
 * @typedef {Object} NodeReference
 * @property {string} id
 * @property {string} text
 * @property {import('./ast-parser.js').NodeRange} range
 * @property {string} kind
 */

/**
 * @typedef {Object} AlignmentPair
 * @property {NodeReference} python
 * @property {NodeReference} java
 * @property {"exact" | "inferred" | "healed"} confidence
 * @property {"green" | "purple" | "amber"} color
 * @property {{ type_system: string, memory: string, safety: string }} explanation
 */

/**
 * Aligns normalized Python AST nodes with corresponding Java AST nodes.
 *
 * Algorithm:
 * 1. For each Python node, check if its text matches a key in TYPE_MAP
 * 2. If a match is found, search Java nodes for the expected Java construct
 * 3. Mark matched Java nodes to prevent duplicate assignment
 * 4. Categorize confidence ("exact", "inferred", "healed") and map to theme colors
 *
 * @param {Array<import('./ast-parser.js').SemanticNode>} pythonNodes
 * @param {Array<import('./ast-parser.js').SemanticNode>} javaNodes
 * @returns {AlignmentPair[]} Array of aligned cross-language AST node pairs
 */
export function alignNodes(pythonNodes = [], javaNodes = []) {
  if (!Array.isArray(pythonNodes) || !Array.isArray(javaNodes)) {
    return [];
  }

  const pairs = [];
  const usedJavaIds = new Set();

  for (const pyNode of pythonNodes) {
    if (!pyNode || !pyNode.text) continue;

    const mapping = lookupTypeMapping(pyNode.text);
    if (!mapping) {
      // Node has no type mapping definition; do not produce a broken pair
      continue;
    }

    const expectedJava = mapping.java.trim();
    let bestMatch = null;
    let confidence = 'exact';

    // 1. First Pass: Look for exact textual match in unused Java nodes
    for (const jNode of javaNodes) {
      if (usedJavaIds.has(jNode.id)) continue;

      if (jNode.text === expectedJava) {
        bestMatch = jNode;
        confidence = 'exact';
        break;
      }
    }

    // 2. Second Pass: Check specialized self-healing transformations (BaseModel -> record)
    if (!bestMatch && (expectedJava === 'record' || pyNode.text.includes('BaseModel'))) {
      for (const jNode of javaNodes) {
        if (usedJavaIds.has(jNode.id)) continue;

        if (
          jNode.raw_kind === 'record_declaration' ||
          jNode.text.includes('record') ||
          jNode.text.startsWith('public record')
        ) {
          bestMatch = jNode;
          confidence = 'healed';
          break;
        }
      }
    }

    // 3. Third Pass: Look for nodes containing expected Java text (e.g. generic wrappers)
    if (!bestMatch) {
      for (const jNode of javaNodes) {
        if (usedJavaIds.has(jNode.id)) continue;

        if (jNode.text.includes(expectedJava)) {
          bestMatch = jNode;
          confidence = 'exact';
          break;
        }
      }
    }

    // 4. Fourth Pass: Inferred / Substring / Case-Insensitive Match
    if (!bestMatch) {
      const normalizedExpected = expectedJava.toLowerCase().replace(/\s+/g, '');
      for (const jNode of javaNodes) {
        if (usedJavaIds.has(jNode.id)) continue;

        const normalizedJText = jNode.text.toLowerCase().replace(/\s+/g, '');
        if (
          normalizedJText.includes(normalizedExpected) ||
          normalizedExpected.includes(normalizedJText)
        ) {
          bestMatch = jNode;
          confidence = 'inferred';
          break;
        }
      }
    }

    if (bestMatch) {
      usedJavaIds.add(bestMatch.id);

      // Map confidence level to UI color theme
      let color = 'green';
      if (confidence === 'inferred') {
        color = 'purple';
      } else if (confidence === 'healed') {
        color = 'amber';
      }

      pairs.push({
        python: {
          id: pyNode.id,
          text: pyNode.text,
          range: pyNode.range,
          kind: pyNode.kind,
        },
        java: {
          id: bestMatch.id,
          text: bestMatch.text,
          range: bestMatch.range,
          kind: bestMatch.kind,
        },
        confidence,
        color,
        explanation: {
          type_system: mapping.reason,
          memory: mapping.memory,
          safety: mapping.safety,
        },
      });
    }
  }

  return pairs;
}
