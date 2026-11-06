import type { ReactTestRendererJSON } from 'react-test-renderer';

type RenderedTree = ReactTestRendererJSON | ReactTestRendererJSON[] | null;

// Test IDs of the rendered host elements in screen order (depth first), used to check the
// visual sequence of a screen without depending on its styles.
export function testIdsInOrder(tree: RenderedTree): string[] {
  if (tree === null) {
    return [];
  }
  if (Array.isArray(tree)) {
    return tree.flatMap(testIdsInOrder);
  }
  const own =
    typeof tree.props.testID === 'string' ? [tree.props.testID as string] : [];
  const children = (tree.children ?? []).flatMap(child =>
    typeof child === 'string' ? [] : testIdsInOrder(child),
  );
  return [...own, ...children];
}
