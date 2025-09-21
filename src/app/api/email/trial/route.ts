import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';

const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email, searchConditions, userDisplayName } = await request.json();

    if (!email || !searchConditions || !Array.isArray(searchConditions)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Gemini API でリアルなニュース記事を取得
    let articles = [];
    try {
      console.log('Using Gemini API with Google Search for news...');
      articles = await generateNewsWithGemini(searchConditions.slice(0, 2));
      console.log(`Got ${articles.length} articles from Gemini`);
    } catch (newsError) {
      console.warn('Failed to fetch news with Gemini, using fallback:', newsError);
    }

    // フォールバック記事（リアルニュース取得に失敗した場合）
    if (articles.length === 0) {
      articles = [
        {
          title: 'AI技術の急速な進歩：企業の生産性向上に大きな影響',
          summary: '生成AI技術の企業導入が加速し、業務効率化と新サービス創出が進む。特に日本企業での活用事例が注目を集めている。',
          content: '人工知能技術の進歩により、日本の企業でも大幅な業務効率化が実現されています...',
          category: 'テクノロジー',
          publishedAt: new Date().toLocaleDateString('ja-JP'),
          source: 'Tech News Today',
          url: 'https://example.com/ai-business-2024',
          tags: ['AI', '企業', '生産性']
        },
        {
          title: '円安継続で輸出企業業績好調、一方で輸入物価上昇が課題',
          summary: '1ドル=150円台の円安水準が続く中、輸出企業の業績は好調を維持。しかし原材料コスト増加が中小企業を圧迫。',
          content: '為替相場の円安基調が継続し、自動車・電機メーカーを中心とした輸出企業の業績が好調です...',
          category: '経済',
          publishedAt: new Date().toLocaleDateString('ja-JP'),
          source: 'Economic Daily',
          url: 'https://example.com/yen-economy-2024',
          tags: ['円安', '輸出', '企業業績']
        },
        {
          title: '再生可能エネルギー普及率が過去最高を更新、2030年目標達成へ',
          summary: '太陽光・風力発電の設備容量が急拡大し、再エネ比率が30%を突破。政府の脱炭素目標達成に向けた取り組みが加速。',
          content: '再生可能エネルギーの普及が順調に進み、発電量に占める割合が過去最高を記録しました...',
          category: '環境',
          publishedAt: new Date().toLocaleDateString('ja-JP'),
          source: 'Green Energy News',
          url: 'https://example.com/renewable-energy-2024',
          tags: ['再生可能エネルギー', '脱炭素', '太陽光発電']
        }
      ];
    }

    // HTMLメール本文を生成
    const emailHtml = generateTrialEmailHtml(userDisplayName, searchConditions, articles.slice(0, 6));

    // Resendを使用してメール送信
    try {
      // 開発環境では送信者のメールアドレスに制限があるため、受信者を開発者に限定
      const targetEmail = process.env.NODE_ENV === 'development'
        ? 'tera.mode@gmail.com' // 開発環境では固定
        : email;

      const emailResult = await resend.emails.send({
        from: 'News AI <onboarding@resend.dev>', // Resendの認証済みドメインを使用
        to: [targetEmail],
        subject: `📰 News AI トライアルレポート - ${new Date().toLocaleDateString('ja-JP')}`,
        html: emailHtml,
        replyTo: email, // 元のメールアドレスをreply-toに設定
      });

      console.log('Email sent successfully:', emailResult);

      return NextResponse.json({
        success: true,
        message: process.env.NODE_ENV === 'development'
          ? 'トライアルメールを送信しました！（開発環境のため tera.mode@gmail.com に送信）'
          : 'トライアルメールを送信しました！',
        emailId: emailResult.data?.id,
        articlesCount: articles.length,
        conditionsUsed: searchConditions.length,
        sentTo: targetEmail
      });

    } catch (emailError) {
      console.error('Resend email error:', emailError);

      // メール送信失敗時のフォールバック（開発モードのようにログ出力）
      console.log('=== EMAIL SEND FAILED - SHOWING CONTENT ===');
      console.log('To:', email);
      console.log('Subject: News AI トライアルレポート');
      console.log('Articles count:', articles.length);
      console.log('===========================================');

      return NextResponse.json({
        success: false,
        message: 'メール送信に失敗しましたが、コンテンツは生成されました',
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
        articlesCount: articles.length
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Trial email error:', error);
    return NextResponse.json(
      { error: 'トライアルメール処理に失敗しました' },
      { status: 500 }
    );
  }
}

// Gemini API でニュース生成
async function generateNewsWithGemini(searchConditions: any[]) {
  const articles = [];

  for (const condition of searchConditions) {
    try {
      console.log('Generating news with Gemini for:', condition.description);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const searchQuery = `${condition.description} ${condition.keywords.join(' ')} ニュース 最新`;
      const currentDate = new Date().toISOString().split('T')[0];

      const prompt = `「${searchQuery}」について最新のニュース記事を検索し、実際の検索結果に基づいて1つの記事を以下のJSON形式で作成してください：

{
  "title": "実際の検索結果に基づく具体的なタイトル",
  "summary": "150文字程度の要約",
  "content": "500文字程度の記事本文",
  "category": "適切なカテゴリ",
  "publishedAt": "${currentDate}",
  "source": "実際のメディア名",
  "url": "実際の記事URL",
  "tags": ["関連タグ1", "関連タグ2"],
  "relevanceScore": 0.9
}

検索条件: "${condition.description}"
キーワード: ${condition.keywords.join(', ')}

Google検索を実行して実際のニュース記事を見つけ、その情報に基づいてJSONを作成してください。`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [
          {
            googleSearchRetrieval: {}, // Google Search Retrieval ツールを有効化
          },
        ],
      });

      const response = await result.response;
      const content = response.text();

      console.log('Gemini response:', content.substring(0, 300));

      // JSON抽出
      let jsonString = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = Array.isArray(jsonMatch) ? jsonMatch[1] || jsonMatch[0] : jsonMatch;
      }

      const parsed = JSON.parse(jsonString.trim());
      if (parsed.title && parsed.url) {
        articles.push({
          ...parsed,
          searchBased: true,
          fromGemini: true
        });
        console.log(`✓ Generated article with Gemini: ${parsed.title}`);
      }

    } catch (error) {
      console.error('Error generating news with Gemini:', error);
    }
  }

  return articles;
}

function generateTrialEmailHtml(
  userDisplayName: string,
  searchConditions: any[],
  articles: any[]
): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News AI トライアルレポート</title>
  <style>
    body {
      font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8fafc;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      margin-bottom: 25px;
      font-size: 16px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #2563eb;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .condition-item {
      background-color: #f1f5f9;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    .article-item {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      background-color: #fafafa;
    }
    .article-title {
      font-weight: bold;
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .article-summary {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .article-meta {
      font-size: 12px;
      color: #9ca3af;
    }
    .article-category {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 10px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 News AI トライアルレポート</h1>
    </div>

    <div class="content">
      <div class="greeting">
        <p>${userDisplayName} 様</p>
        <p>設定いただいた情報収集条件に基づく、サンプルニュースレポートをお送りします。</p>
      </div>

      <div class="section">
        <h2>📋 設定済み検索条件</h2>
        ${searchConditions.map(condition => `
          <div class="condition-item">
            <strong>優先度 ${condition.priority}:</strong> ${condition.description}
            ${condition.keywords && condition.keywords.length > 0 ?
              `<br><small>キーワード: ${condition.keywords.join(', ')}</small>` : ''
            }
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>📺 関連ニュース（サンプル）</h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          ※ こちらはトライアル用のサンプル記事です。実際のサービスでは、設定条件に基づいて最新ニュースを自動収集・配信します。
        </p>

        ${articles.map(article => `
          <div class="article-item">
            <div class="article-title">${article.title}</div>
            <div class="article-summary">${article.summary}</div>
            <div class="article-meta">
              <span class="article-category">${article.category}</span>
              <span style="margin: 0 8px;">•</span>
              <span style="color: #4b5563;">${article.source || 'News AI'}</span>
              <span style="margin: 0 8px;">•</span>
              ${article.publishedAt}
            </div>
            ${article.tags && article.tags.length > 0 ? `
              <div style="margin-top: 8px;">
                ${article.tags.map((tag: string) => `
                  <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-right: 4px; margin-top: 2px;">
                    ${tag}
                  </span>
                `).join('')}
              </div>
            ` : ''}
            ${article.url !== 'https://example.com/article-url' ? `
              <div style="margin-top: 10px;">
                <a href="${article.url}" style="color: #2563eb; text-decoration: none; font-size: 12px;">
                  📖 記事を読む
                </a>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div style="text-align: center;">
        <a href="http://localhost:3000/dashboard" class="cta-button">
          ダッシュボードで条件を調整する
        </a>
      </div>
    </div>

    <div class="footer">
      <p>このメールは News AI のトライアル機能です。</p>
      <p>実際のサービスでは、設定したスケジュールに従って最新ニュースをお届けします。</p>
    </div>
  </div>
</body>
</html>`;
}