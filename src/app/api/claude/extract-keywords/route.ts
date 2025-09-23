import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { KeywordExtractionResult } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userInput, description } = await request.json();
    const inputText = userInput || description;

    if (!inputText) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `以下の情報収集条件から重要なキーワードを抽出し、JSON形式で返してください。

情報収集条件: "${inputText}"

以下のJSON形式で回答してください：
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "categories": ["関連カテゴリ1", "関連カテゴリ2"],
  "confidence": 0.85
}

キーワードは3-8個程度、カテゴリは1-3個、信頼度は0-1の間で設定してください。
カテゴリは以下から選択: テクノロジー, ビジネス, 政治, スポーツ, エンターテイメント, 健康, 科学, 社会, 経済

必ずJSON形式のみで回答し、他の説明は含めないでください。`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // JSONパース（エラーハンドリング付き）
    try {
      // Geminiの応答からJSONを抽出
      let cleanContent = content.trim();

      // コードブロックを除去
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```/g, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanContent);
      const extractionResult: KeywordExtractionResult = {
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };

      return NextResponse.json(extractionResult);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content received:', content);

      // フォールバック: 簡単なキーワード抽出
      const fallbackKeywords = inputText
        .replace(/[。、！？]/g, ' ')
        .split(/\s+/)
        .filter((word: string) => word.length > 1)
        .slice(0, 5);

      const fallbackResult: KeywordExtractionResult = {
        keywords: fallbackKeywords,
        categories: ['その他'],
        confidence: 0.3,
      };

      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract keywords' },
      { status: 500 }
    );
  }
}