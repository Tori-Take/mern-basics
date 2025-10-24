import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

/**
 * 組織図の単一ノード（テナント）を表示する再帰コンポーネント
 * @param {object} props
 * @param {object} props.node - 表示するテナントのノードオブジェクト
 */
const TenantNode = ({ node }) => {
  return (
    <li className="tenant-node">
      <Card body className="d-inline-block shadow-sm tenant-card">
        <Link to={`/admin/tenants/${node._id}`} className="stretched-link text-decoration-none text-dark fw-bold">
          {node.name}
        </Link>
      </Card>

      {node.children && node.children.length > 0 && (
        <ul className="children-container">
          {node.children.map(childNode => (
            <TenantNode key={childNode._id} node={childNode} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TenantNode;
