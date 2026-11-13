import { GoogleGenAI, Type } from "@google/genai";
import { VerseOfTheDay } from '../types';
import { firebaseService } from './firebase';

export class GeminiService {
  async getVerseOfTheDay(): Promise<VerseOfTheDay> {
      try {
        const CACHE_KEY = 'umadw_verse_day';
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { verse, date } = JSON.parse(cached);
          if (date === new Date().toLocaleDateString()) {
            return verse;
          }
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Gere um versículo bíblico curto de esperança e a referência bíblica. Responda apenas com o texto na primeira linha e a referência na segunda linha.",
        });
        const lines = (res.text || "").split('\n').filter(l => l.trim());
        const verse = { text: lines[0] || "Deus é fiel.", reference: lines[1] || "1 Coríntios 1:9" };
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({ verse, date: new Date().toLocaleDateString() }));
        return verse;
      } catch (e) { 
        console.error("[Gemini API Error - Verse]:", e);
        return { text: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmos 23:1" }; 
      }
  }
  
  async getBirthdayGreeting(name: string): Promise<string> {
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const res = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Crie uma saudação de parabéns bíblica curta para ${name}.`,
          });
          return res.text || `Feliz aniversário, ${name}! Deus te abençoe rica e poderosamente.`;
      } catch (e) { 
          console.error("[Gemini API Error - Birthday]:", e);
          return `Feliz aniversário, ${name}! Que a paz do Senhor esteja sempre com você.`; 
      }
  }

  async generateLeaderInsights(communityId: string) {
    try {
      const stats = await firebaseService.getCommunityStats();
      const inactiveUsers = await firebaseService.getInactiveUsers(7);
      
      const prompt = `
        Analise os seguintes dados da comunidade de jovens cristãos e gere 3 insights acionáveis para o líder.
        Estatísticas: ${JSON.stringify(stats)}
        Usuários inativos (7 dias): ${inactiveUsers.length}
        
        Gere a resposta em formato JSON seguindo este esquema:
        Array<{
          type: 'retention' | 'engagement' | 'growth',
          priority: 'low' | 'medium' | 'high',
          title: string,
          description: string,
          suggestedAction: string,
          targetUserUid?: string
        }>
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['retention', 'engagement', 'growth'] },
                priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedAction: { type: Type.STRING },
                targetUserUid: { type: Type.STRING }
              },
              required: ['type', 'priority', 'title', 'description', 'suggestedAction']
            }
          }
        }
      });

      const insights = JSON.parse(res.text || "[]");
      
      for (const insight of insights) {
        await firebaseService.saveInsight({
          ...insight,
          communityId
        });
      }
    } catch (e) {
      console.error("[Gemini API Error - Insights]:", e);
    }
  }
}

export const geminiService = new GeminiService();
