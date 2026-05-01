import React from 'react';

function buildTree(files) {
  const root = { name: 'root', path: '', type: 'dir', children: [] };

  for (const file of files) {
    const segments = file.path.split('/');
    let current = root;
    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      let next = current.children.find((child) => child.name === segment);
      if (!next) {
        next = {
          name: segment,
          path: isFile ? file.path : `${current.path}${segment}/`,
          type: isFile ? 'file' : 'dir',
          children: [],
          issueCount: isFile ? file.issues.length : 0,
        };
        current.children.push(next);
      }
      current = next;
    });
  }

  return root;
}

function TreeNode({ node, depth, onSelect, selectedPath }) {
  const isSelected = node.path === selectedPath;
  if (node.type === 'file') {
    return (
      <button
        type="button"
        className={`file-node ${isSelected ? 'file-node--active' : ''}`}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => onSelect(node.path)}
      >
        <span className="file-node__name">{node.name}</span>
        <span className="file-node__count">{node.issueCount}</span>
      </button>
    );
  }

  return (
    <div className="file-node-group">
      <div className="file-node file-node--folder" style={{ paddingLeft: `${depth * 16}px` }}>
        {node.name}
      </div>
      {node.children.map((child) => (
        <TreeNode
          key={child.path || child.name}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

function FileTree({ files, selectedPath, onSelect }) {
  const tree = buildTree(files);
  return (
    <div className="file-tree">
      <div className="file-tree__header">
        <h3>Files</h3>
      </div>
      <div className="file-tree__body">
        {tree.children.length === 0 ? (
          <p className="file-tree__empty">No files analyzed.</p>
        ) : (
          tree.children.map((node) => (
            <TreeNode
              key={node.path || node.name}
              node={node}
              depth={0}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FileTree;
