import Database from 'better-sqlite3';
import { join } from 'path';

// データベースファイルのパスを設定
const DB_PATH = join(process.cwd(), 'data', 'mindtree.db');

// データベース接続のシングルトンインスタンス
let db: Database.Database | null = null;

// データベース接続を取得
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    initDb(db);
  }
  return db;
}

// データベースの初期化
function initDb(db: Database.Database) {
  // FKを有効化
  db.pragma('foreign_keys = ON');

  // treesテーブルの作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // nodesテーブルの作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER NOT NULL,
      parent_id INTEGER,
      text TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_expanded BOOLEAN DEFAULT true,
      background_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
    )
  `);

  // node_promptsテーブルの作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS node_prompts (
      node_id INTEGER PRIMARY KEY,
      prompt TEXT NOT NULL DEFAULT 'このノードのアイデアを膨らませてください',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    )
  `);

  // updated_atを自動更新するトリガーの作成
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_trees_timestamp
    AFTER UPDATE ON trees
    BEGIN
      UPDATE trees SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_nodes_timestamp
    AFTER UPDATE ON nodes
    BEGIN
      UPDATE nodes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
}

// ツリー操作のユーティリティ関数
export const treeUtils = {
  // 新規ツリーの作成
  createTree: (name: string) => {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO trees (name) VALUES (?)');
    const result = stmt.run(name);
    return result.lastInsertRowid;
  },

  // ツリーの取得
  getTree: (id: number) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM trees WHERE id = ?');
    return stmt.get(id);
  },

  // 全ツリーの取得
  getAllTrees: () => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM trees ORDER BY last_accessed_at DESC');
    return stmt.all();
  },

  // ツリー名の更新
  updateTreeName: (id: number, name: string) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE trees SET name = ? WHERE id = ?');
    return stmt.run(name, id);
  },

  // ツリーの削除
  deleteTree: (id: number) => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM trees WHERE id = ?');
    return stmt.run(id);
  },

  // 最後にアクセスした時刻の更新
  updateLastAccessed: (id: number) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE trees SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }
};

// プロンプト操作のユーティリティ関数
export const promptUtils = {
  // プロンプトの取得
  getPrompt: (nodeId: number) => {
    const db = getDb();
    const stmt = db.prepare('SELECT prompt FROM node_prompts WHERE node_id = ?');
    const result = stmt.get(nodeId) as { prompt: string } | undefined;
    return result?.prompt ?? 'このノードのアイデアを膨らませてください';
  },

  // プロンプトの更新または作成
  upsertPrompt: (nodeId: number, prompt: string) => {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO node_prompts (node_id, prompt) 
      VALUES (?, ?)
      ON CONFLICT(node_id) DO UPDATE SET 
        prompt = excluded.prompt,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(nodeId, prompt);
  }
};

// ノード操作のユーティリティ関数
export const nodeUtils = {
  // 新規ノードの作成
  createNode: (treeId: number, parentId: number | null, text: string, orderIndex: number) => {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO nodes (tree_id, parent_id, text, order_index) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(treeId, parentId, text, orderIndex);
    return result.lastInsertRowid;
  },

  // ノードの取得
  getNode: (id: number) => {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM nodes WHERE id = ?');
    return stmt.get(id);
  },

  // ツリーの全ノードを取得
  getTreeNodes: (treeId: number) => {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM nodes 
      WHERE tree_id = ? 
      ORDER BY parent_id NULLS FIRST, order_index
    `);
    return stmt.all(treeId);
  },

  // ノードテキストの更新
  updateNodeText: (id: number, text: string) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE nodes SET text = ? WHERE id = ?');
    return stmt.run(text, id);
  },

  // ノードの展開状態の更新
  updateNodeExpanded: (id: number, isExpanded: boolean) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE nodes SET is_expanded = ? WHERE id = ?');
    return stmt.run(isExpanded, id);
  },

  // ノードの背景色の更新
  updateNodeColor: (id: number, backgroundColor: string | null) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE nodes SET background_color = ? WHERE id = ?');
    return stmt.run(backgroundColor, id);
  },

  // ノードの削除
  deleteNode: (id: number) => {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM nodes WHERE id = ?');
    return stmt.run(id);
  },

  // ノードの順序の更新
  updateNodeOrder: (id: number, newOrderIndex: number) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE nodes SET order_index = ? WHERE id = ?');
    return stmt.run(newOrderIndex, id);
  },

  // 親ノードの更新
  updateNodeParent: (id: number, newParentId: number | null) => {
    const db = getDb();
    const stmt = db.prepare('UPDATE nodes SET parent_id = ? WHERE id = ?');
    return stmt.run(newParentId, id);
  }
};
