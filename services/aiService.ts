import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider } from "../types";

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateExplanation(prompt: string, contextData: string): Promise<string> {
    // 1. Check for API Key immediately
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      throw new Error("MISSING_API_KEY");
    }

    const fullPrompt = `
      你是一个精通MySQL数据库内核的专家。请根据以下提供的B+树结构数据（JSON格式），
      向用户解释当前的索引结构。
      
      要求：
      1. 使用通俗易懂的中文。
      2. 解释根节点、分支节点（非叶子节点）和叶子节点的关系。
      3. 解释为什么B+树适合作为数据库索引（如：减少IO，范围查询便利）。
      4. 具体结合数据中的ID举例。
      
      B+树数据结构:
      ${contextData}
      
      用户具体问题: ${prompt}
    `;

    try {
      if (this.config.provider === AIProvider.GEMINI) {
        return await this.callGemini(fullPrompt);
      } else {
        return await this.callOpenAICompatible(fullPrompt);
      }
    } catch (error: any) {
      console.error("AI Service Error:", error);
      // Re-throw if it's our custom error, otherwise wrap
      if (error.message === "MISSING_API_KEY") throw error;
      return `AI 调用失败: ${error.message || '未知错误'}. 请检查配置 (API Key 或 URL).`;
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: this.config.model,
      contents: prompt,
    });
    
    return response.text || "无法生成回复";
  }

  private async callOpenAICompatible(prompt: string): Promise<string> {
     // Headers setup
     const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const payload = {
      model: this.config.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "未收到有效回复";
  }
}