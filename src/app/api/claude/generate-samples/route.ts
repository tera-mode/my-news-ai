import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
  try {
    const prompt = `ニュース情報収集サービス用の検索条件例を10個生成してください。
自然言語で書かれた、具体的で実用的な条件を提案してください。

例：
- "AI技術の最新動向、特に生成AIとビジネス活用事例"
- "日本経済の動向、特に金利政策と株式市場への影響"
- "環境問題と持続可能な社会、脱炭素技術の進展"

各条件は1行で、カンマ区切りで返してください。`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 400,
      temperature: 0.7,
      system: 'あなたはニュース分析の専門家です。多様で実用的な情報収集条件を提案してください。',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

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