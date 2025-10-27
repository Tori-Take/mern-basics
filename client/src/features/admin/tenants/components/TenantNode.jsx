import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

const TenantNode = ({ node, onNodeClick, selectedTenantId, viewMode = 'list' }) => {
  const isSelected = selectedTenantId && node._id === selectedTenantId;

  // 組織図ビュー用のカード表示
  if (viewMode === 'card') {
    return (
      <li className="tenant-node">
        <Card body className="tenant-card">
          <Link to={`/admin/tenants/${node._id}`}>{node.name}</Link>
        </Card>
        {node.children && node.children.length > 0 && (
          <ul className="children-container">
            {node.children.map(childNode => (
              <TenantNode key={childNode._id} node={childNode} viewMode="card" />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // デフォルト（モーダル用）のリスト表示
  return (
    <li className="tenant-node-list">
      <span onClick={() => onNodeClick(node)} className={isSelected ? 'selected' : ''}>
        {node.name}
      </span>
      {node.children && node.children.length > 0 && (
        <ul className="children-container-list">
          {node.children.map(child => (
            <TenantNode
              key={child._id}
              node={child}
              onNodeClick={onNodeClick}
              selectedTenantId={selectedTenantId}
              viewMode="list"
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TenantNode;