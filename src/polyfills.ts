import ReactDOM from 'react-dom';

/**
 * `ReactDOM.findDOMNode` was removed in React 19, but transitive dependencies
 * still reach for it. Restore a null-safe pass-through so those calls no-op
 * instead of throwing.
 */
type ReactDomWithFindDOMNode = typeof ReactDOM & {
  findDOMNode?: (node: unknown) => unknown;
};

const reactDom = ReactDOM as ReactDomWithFindDOMNode;

if (!reactDom.findDOMNode) {
  reactDom.findDOMNode = (node) => node ?? null;
}
