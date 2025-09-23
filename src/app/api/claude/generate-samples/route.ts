import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `ニュース情報収集サービス用の検索条件例を10個生成してください。
自然言語で書かれた、具体的で実用的な条件を提案してください。

例：
- "AI技術の最新動向、特に生成AIとビジネス活用事例"
- "日本経済の動向、特に金利政策と株式市場への影響"
- "環境問題と持続可能な社会、脱炭素技術の進展"

各条件は1行で、カンマ区切りで返してください。`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const samples = content
      .split(',')
      .map(condition => condition.trim().replace(/^["\-\s]*/, '').replace(/["\s]*$/, ''))
      .filter(condition => condition.length > 10)
      .slice(0, 10);

    return NextResponse.json({ samples });
  } catch (error) {
    console.error('Sample generation error:', error);

    // フォールバック: 固定のサンプル
    const fallbackSamples = [
      'AI技術の最新動向と企業での活用事例',
      '日本の経済政策と金融市場への影響',
      '気候変動対策と再生可能エネルギーの進展',
      'スタートアップ企業の資金調達とIPO動向',
      '働き方改革とリモートワーク技術',
      '医療技術の革新と健康管理アプリ',
      'eスポーツ産業の成長と関連ビジネス',
      '食品安全と持続可能な農業技術',
      '宇宙開発事業と商業宇宙ビジネス',
      'サイバーセキュリティの脅威と対策技術'
    ];

    return NextResponse.json({ samples: fallbackSamples });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `以下の検索条件に基づいて、ニュースメール用のコンテンツを生成してください。

検索条件: "${userInput}"

以下の構造でHTMLメール用のコンテンツを生成してください：

1. 件名を提案
2. 簡潔な導入文
3. 主要なトピック（3-5個）
4. 各トピックの簡単な説明

HTMLタグは使わず、プレーンテキストで出力してください。`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return NextResponse.json({
      subject: `${userInput}に関する最新情報`,
      content: content,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}