import React from 'react';

function TenantNode({ node, onNodeClick, selectedTenantId }) {
  return (
    <li>
      <span
        onClick={() => onNodeClick(node)}
        className={node._id === selectedTenantId ? 'selected' : ''}
      >
        {node.name}
      </span>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <TenantNode
              key={child._id} node={child}
              onNodeClick={onNodeClick} selectedTenantId={selectedTenantId}
            />))}
        </ul>
      )}
    </li>
  );
}

export default TenantNode;