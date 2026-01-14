## 问题H-1修复方案

### 问题位置
`utils/bPlusTreeLogic.ts` 第276-302行，`borrowFromRight`方法

### 当前问题
叶子节点借用右兄弟时：
```typescript
const borrowedKey = rightSibling.keys.shift()!;
parent.keys[childIdx] = rightSibling.keys[0] || parent.keys[childIdx];
```

使用 `||` fallback不够明确，缺少对借用后状态的验证。

### 修复内容
1. 明确分隔键更新逻辑：判断右兄弟是否还有key
2. 添加防御性检查和警告
3. 确保在所有情况下分隔键都是有效的

### 修改文件
- `utils/bPlusTreeLogic.ts` borrowFromRight方法

### 验证
- 运行现有测试：`npm run test:run`
- 手动测试删除触发借用的场景