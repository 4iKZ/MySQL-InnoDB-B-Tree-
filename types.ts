// Data Structure Types
export interface TableRow {
  id: number;
  name: string;
  age: number;
}

export interface BPlusTreeNode {
  keys: number[]; // The index keys (IDs or Ages)
  children: BPlusTreeNode[]; // Pointers to child nodes (for internal nodes)
  isLeaf: boolean;
  next: BPlusTreeNode | null; // Pointer to next leaf (for linked list)
  data: TableRow[][]; // Actual row data (2D array to support duplicate keys)
  id: string; // Unique ID for visualization mapping
  parent: BPlusTreeNode | null;
}

// AI Configuration Types
export enum AIProvider {
  GEMINI = 'GEMINI',
  SILICONFLOW = 'SILICONFLOW',
  OLLAMA = 'OLLAMA',
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string; // For Gemini and SiliconFlow
  baseUrl: string; // Primarily for Ollama (e.g., http://localhost:11434/v1) or SiliconFlow
  model: string;
}

export const DEFAULT_AI_CONFIG: Record<AIProvider, AIConfig> = {
  [AIProvider.GEMINI]: {
    provider: AIProvider.GEMINI,
    apiKey: '',
    baseUrl: '',
    model: 'gemini-3-flash-preview',
  },
  [AIProvider.SILICONFLOW]: {
    provider: AIProvider.SILICONFLOW,
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3', // Popular model on SiliconFlow
  },
  [AIProvider.OLLAMA]: {
    provider: AIProvider.OLLAMA,
    apiKey: 'ollama', // Not usually needed but required for some headers
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
  },
};
