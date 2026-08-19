// Polyfill for findDOMNode removed in React 19
import ReactDOM from 'react-dom';

if (!ReactDOM.findDOMNode) {
  (ReactDOM as any).findDOMNode = (node: any) => {
    if (node == null) return null;
    if (node.nodeType === 1) return node;
    return node;
  };
}
