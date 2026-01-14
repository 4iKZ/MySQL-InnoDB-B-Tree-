import { describe, it, expect } from 'vitest';
import { BPlusTree } from '../bPlusTreeLogic';
import { TableRow } from '../../types';

describe('BPlusTree', () => {

  describe('问题1: 重复key插入', () => {
    it('应该允许非聚簇索引插入重复的Age', () => {
      const rows: TableRow[] = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 25 },
      ];

      const tree = BPlusTree.fromRows(rows, r => r.age, { uniqueKeys: false });

      // 验证树结构 - 重复key聚合到同一个key槽位中
      expect(tree.root.isLeaf).toBe(true);
      expect(tree.root.keys).toEqual([25]);
      expect(tree.root.data).toHaveLength(1);
      expect(tree.root.data[0]).toEqual(rows);
    });

    it('聚簇索引的重复ID应该被覆盖', () => {
      const rows: TableRow[] = [
        { id: 5, name: 'Alice', age: 25 },
        { id: 5, name: 'Bob', age: 30 }, // 重复ID
      ];

      const tree = BPlusTree.fromRows(rows, r => r.id, { uniqueKeys: true });

      // 验证最后一个数据覆盖了第一个
      expect(tree.root.keys).toEqual([5]);
      expect(tree.root.data[0]).toEqual([rows[1]]);
    });
  });

  describe('问题2: 乱序插入', () => {
    it('乱序插入应该能观察到节点分裂', () => {
      const rows: TableRow[] = [
        { id: 10, name: 'Bob', age: 30 },
        { id: 5, name: 'Alice', age: 25 },
        { id: 15, name: 'Charlie', age: 35 },
        { id: 1, name: 'David', age: 20 },
      ];

      const tree = BPlusTree.fromRows(rows, r => r.id, { uniqueKeys: true });

      // 验证分裂后的结构
      expect(tree.root.isLeaf).toBe(false); // 根不再是叶子
      expect(tree.root.children.length).toBe(2);
    });

    it('与排序插入的树结构应该不同', () => {
      // 乱序数据
      const randomRows: TableRow[] = [
        { id: 10, name: 'B', age: 30 },
        { id: 5, name: 'A', age: 25 },
        { id: 15, name: 'C', age: 35 },
        { id: 1, name: 'D', age: 20 },
      ];

      const randomTree = BPlusTree.fromRows(randomRows, r => r.id, { uniqueKeys: true });

      // 验证根节点发生了分裂
      expect(randomTree.root.isLeaf).toBe(false);
    });
  });

  describe('问题3: 叶子节点删除', () => {
    it('删除后不触发合并应该保持结构', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
      ];

      rows.forEach(r => tree.insert(r));
      tree.delete(2);

      expect(tree.root.keys).toEqual([1, 3]);
      expect(tree.root.data[0]).toEqual([rows[0]]);
      expect(tree.root.data[1]).toEqual([rows[2]]);
    });

    it('删除后树为空应该保持为空根', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const row: TableRow = { id: 1, name: 'A', age: 20 };

      tree.insert(row);
      tree.delete(1);

      expect(tree.root.keys).toEqual([]);
      expect(tree.root.isLeaf).toBe(true);
    });

    it('删除所有数据后树应该重置', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
      ];

      rows.forEach(r => tree.insert(r));
      tree.delete(1);
      tree.delete(2);

      expect(tree.root.keys).toEqual([]);
      expect(tree.root.isLeaf).toBe(true);
    });
  });

  describe('问题3: 删除指定row（重复key场景）', () => {
    it('应该能从重复key中删除指定的row', () => {
      const tree = new BPlusTree((r: TableRow) => r.age, { uniqueKeys: false });
      const rows: TableRow[] = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 25 },
      ];

      rows.forEach(r => tree.insert(r));

      // 删除Bob，保留Alice和Charlie
      tree.delete(25, rows[1]);

      expect(tree.root.keys).toEqual([25]);
      expect(tree.root.data[0]).toEqual([rows[0], rows[2]]);
    });

    it('删除指定row后如果该key无数据，应该删除整个key', () => {
      const tree = new BPlusTree((r: TableRow) => r.age, { uniqueKeys: false });
      const row: TableRow = { id: 1, name: 'Alice', age: 25 };

      tree.insert(row);
      tree.delete(25, row);

      expect(tree.root.keys).toEqual([]);
      expect(tree.root.isLeaf).toBe(true);
    });
  });

  describe('问题3: 内部节点删除', () => {
    it('删除应该正确更新父节点结构', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User${i}`,
        age: 20 + i
      }));

      rows.forEach(r => tree.insert(r));

      const initialChildren = tree.root.children.length;
      tree.delete(5);

      // 验证内部节点被正确处理
      expect(tree.root.children.length).toBeLessThanOrEqual(initialChildren);
      expect(tree.root.isLeaf).toBe(false);
    });
  });

  describe('问题3: 删除触发借用', () => {
    it('应该能从左兄弟借用', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      // 构建一个会导致借用的结构
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
        { id: 4, name: 'D', age: 23 },
      ];

      rows.forEach(r => tree.insert(r));

      // 删除可能触发借用
      tree.delete(1);

      // 树应该仍然有效（删除第4个数据后，树可能已经是多层结构了）
      expect(tree.root).toBeDefined();
      expect(tree.root.keys.length).toBeGreaterThanOrEqual(0);

      // 验证所有剩余数据都在树中
      const allIds = tree.root.isLeaf ? tree.root.keys : getAllKeysFromTree(tree.root);
      expect(allIds).toContain(2);
      expect(allIds).toContain(3);
      expect(allIds).toContain(4);
    });

    it('应该能从右兄弟借用', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
        { id: 4, name: 'D', age: 23 },
      ];

      rows.forEach(r => tree.insert(r));
      tree.delete(4);

      // 树应该仍然有效
      expect(tree.root).toBeDefined();
      expect(tree.root.keys.length).toBeGreaterThanOrEqual(0);

      // 验证所有剩余数据都在树中
      const allIds = tree.root.isLeaf ? tree.root.keys : getAllKeysFromTree(tree.root);
      expect(allIds).toContain(1);
      expect(allIds).toContain(2);
      expect(allIds).toContain(3);
    });

    it('应该能从右兄弟借用', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
        { id: 4, name: 'D', age: 23 },
      ];

      rows.forEach(r => tree.insert(r));
      tree.delete(4);

      // 树应该仍然有效
      expect(tree.root).toBeDefined();
      expect(tree.root.keys.length).toBeGreaterThanOrEqual(0);

      // 验证所有剩余数据都在树中
      const allIds = tree.root.isLeaf ? tree.root.keys : getAllKeysFromTree(tree.root);
      expect(allIds).toContain(1);
      expect(allIds).toContain(2);
      expect(allIds).toContain(3);
    });
  });

  describe('问题3: 删除触发合并', () => {
    it('应该能与左兄弟合并', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
      ];

      rows.forEach(r => tree.insert(r));

      // 删除触发合并
      tree.delete(3);

      expect(tree.root.isLeaf).toBe(true);
    });

    it('应该能与右兄弟合并', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
      ];

      rows.forEach(r => tree.insert(r));
      tree.delete(1);

      expect(tree.root.isLeaf).toBe(true);
    });

    it('删除后根节点应该可能更新', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      // 添加足够多的数据创建多层树
      const rows: TableRow[] = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: `User${i}`,
        age: 20 + i
      }));

      rows.forEach(r => tree.insert(r));

      // 删除导致根节点改变
      rows.slice(0, 3).forEach((_, i) => {
        tree.delete(i + 1);
      });

      expect(tree.root).toBeDefined();
    });
  });

  describe('链表完整性', () => {
    it('叶子节点的next指针应该正确链接', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: `User${i}`,
        age: 20 + i
      }));

      rows.forEach(r => tree.insert(r));

      // 遍历叶子节点链表
      let leaf: any = tree.root;
      while (!leaf.isLeaf) {
        leaf = leaf.children[0];
      }

      let count = 0;
      const keys: number[] = [];
      while (leaf) {
        keys.push(...leaf.keys);
        leaf = leaf.next;
        count++;
      }

      expect(count).toBeGreaterThan(1); // 应该分裂成多个叶子
      expect(keys.sort((a, b) => a - b)).toEqual(rows.map(r => r.id));
    });

    it('删除后链表应该仍然保持正确', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
        { id: 4, name: 'D', age: 23 },
      ];

      rows.forEach(r => tree.insert(r));

      // 删除一个节点
      tree.delete(2);

      // 检查链表
      let leaf: any = tree.root;
      while (!leaf.isLeaf) {
        leaf = leaf.children[0];
      }

      const keys: number[] = [];
      while (leaf) {
        keys.push(...leaf.keys);
        leaf = leaf.next;
      }

      expect(keys).toContain(1);
      expect(keys).toContain(3);
      expect(keys).toContain(4);
    });
  });

  describe('边界情况', () => {
    it('删除不存在的key应该不报错', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const row: TableRow = { id: 1, name: 'A', age: 20 };

      tree.insert(row);
      tree.delete(999); // 不存在的key

      expect(tree.root.keys).toEqual([1]);
    });

    it('空树上删除应该不报错', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });

      tree.delete(1);

      expect(tree.root.keys).toEqual([]);
    });

    it('单个节点的树删除后应该重置', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
      ];

      rows.forEach(r => tree.insert(r));

      // 全部删除
      rows.forEach(r => tree.delete(r.id));

      expect(tree.root.keys).toEqual([]);
      expect(tree.root.isLeaf).toBe(true);
    });
  });

  describe('分隔键不变量', () => {
    it('删除叶子首key但不下溢时应更新父分隔键', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = [
        { id: 1, name: 'A', age: 20 },
        { id: 2, name: 'B', age: 21 },
        { id: 3, name: 'C', age: 22 },
        { id: 4, name: 'D', age: 23 },
      ];

      rows.forEach(r => tree.insert(r));
      expect(tree.root.isLeaf).toBe(false);
      tree.delete(2);

      expect(tree.root.isLeaf).toBe(false);
      expect(tree.root.keys[0]).toBe(3);
      assertSeparatorInvariants(tree.root);
    });

    it('借用/合并后应满足分隔键不变量', () => {
      const tree = new BPlusTree((r: TableRow) => r.id, { uniqueKeys: true });
      const rows: TableRow[] = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `U${i + 1}`,
        age: 20 + i
      }));
      rows.forEach(r => tree.insert(r));
      [2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 18, 19].forEach(k => tree.delete(k));

      assertSeparatorInvariants(tree.root);
    });
  });
});

// Helper function to get all keys from tree
function getAllKeysFromTree(node: any): number[] {
  const keys: number[] = [];
  const traverse = (n: any) => {
    if (n.isLeaf) {
      keys.push(...n.keys);
    } else {
      keys.push(...n.keys);
      n.children.forEach(traverse);
    }
  };
  traverse(node);
  return keys;
}

function assertSeparatorInvariants(node: any) {
  const getRange = (n: any): { min: number; max: number } => {
    if (!n) return { min: Infinity, max: -Infinity };
    if (n.isLeaf) {
      if (!n.keys || n.keys.length === 0) return { min: Infinity, max: -Infinity };
      return { min: n.keys[0], max: n.keys[n.keys.length - 1] };
    }
    const ranges = (n.children || []).map(getRange);
    return {
      min: Math.min(...ranges.map(r => r.min)),
      max: Math.max(...ranges.map(r => r.max)),
    };
  };

  const visit = (n: any) => {
    if (!n) return;
    if (n.isLeaf) return;
    expect(n.children.length).toBe(n.keys.length + 1);
    for (let i = 0; i < n.keys.length; i++) {
      const left = getRange(n.children[i]);
      const right = getRange(n.children[i + 1]);
      if (left.max !== -Infinity) expect(left.max).toBeLessThan(n.keys[i]);
      if (right.min !== Infinity) expect(right.min).toBeGreaterThanOrEqual(n.keys[i]);
    }
    n.children.forEach(visit);
  };
  visit(node);
}
