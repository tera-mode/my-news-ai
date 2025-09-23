import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Custom Search API の設定
const CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

// 環境変数のチェック関数
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Custom Search API から検索結果を取得する関数
async function fetchCustomSearchResults(query: string) {
  if (!CUSTOM_SEARCH_API_KEY || !CUSTOM_SEARCH_ENGINE_ID) {
    console.error('Custom Search API keys are not configured.');
    return [];
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${CUSTOM_SEARCH_API_KEY}&cx=${CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&gl=jp&num=8`;

  console.log('Fetching search results from Custom Search API...');
  console.log('Search URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    console.error('Custom Search API response error:', response.status, response.statusText);
    throw new Error(`Google Custom Search API error: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Custom Search API response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

  // 検索結果のタイトル、スニペット、URLを抽出
  if (data.items && data.items.length > 0) {
    console.log(`Found ${data.items.length} search results`);
    return data.items.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));
  }

  console.log('No search results found. Response data:', JSON.stringify(data, null, 2));
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { email, searchConditions, userDisplayName } = await request.json();

    if (!email || !searchConditions || !Array.isArray(searchConditions)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Google Custom Search APIでリアルニュースを取得
    const result = await generateRealisticNews(searchConditions);
    const articles = result.articles || [];

    // 記事が取得できなかった場合はエラーを返す
    if (articles.length === 0) {
      const errorInfo = result.errors ? JSON.stringify(result.errors, null, 2) : '記事が見つかりませんでした';
      return NextResponse.json(
        {
          error: 'ニュース記事の取得に失敗しました',
          details: errorInfo
        },
        { status: 500 }
      );
    }

    // HTMLメール本文を生成
    const emailHtml = generateTrialEmailHtml(userDisplayName, searchConditions, articles.slice(0, 6));

    // Resendを使用してメール送信
    try {
      // 開発環境では送信者のメールアドレスに制限があるため、受信者を開発者に限定
      const targetEmail = process.env.NODE_ENV === 'development'
        ? 'tera.mode@gmail.com' // 開発環境では固定
        : email;

      const resend = getResendClient();
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

async function generateRealisticNews(searchConditions: any[]) {
  const articles = [];
  const errors = [];

  for (const condition of searchConditions.slice(0, 3)) {
    try {
      console.log('Using Gemini with Custom Search API...');

      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // 柔軟で効果的な検索クエリを作成
      const mainKeywords = condition.keywords.slice(0, 3); // 最重要キーワードに絞る
      const searchQuery = mainKeywords.length > 0
        ? `${mainKeywords.join(' ')} ニュース 最新情報`
        : `${condition.description} ニュース`;
      const currentDate = new Date().toISOString().split('T')[0];

      // Step 1: Custom Search API で検索を実行
      const searchResults = await fetchCustomSearchResults(searchQuery);

      if (searchResults.length === 0) {
        console.warn('No search results found for the query.');
        errors.push({
          condition: condition.description,
          error: '検索結果が見つかりませんでした',
          details: 'Google Custom Search APIで記事が見つかりませんでした。',
        });
        continue; // 次の条件へ
      }

      // Step 2: 検索結果の関連性をチェックし、フィルタリング
      console.log(`Found ${searchResults.length} search results. Filtering for relevance...`);

      const searchResultsText = searchResults.map((item: any, index: number) =>
        `【検索結果 ${index + 1}】\nタイトル: ${item.title}\n概要: ${item.snippet}\nURL: ${item.link}`
      ).join('\n\n');

      console.log('Search results to analyze:', searchResultsText.substring(0, 500) + '...');

      const prompt = `【厳重な指示】
以下の検索結果の中から「${condition.description}」に最も関連性の高い記事を**最大3つ厳選**し、検索結果の情報をそのまま使用してJSONを作成してください。

**絶対に検索結果にない情報を作成・想像してはいけません。**

【ユーザーの要求】
「${condition.description}」
キーワード: ${condition.keywords.join(', ')}

【検索結果】
${searchResultsText}

【必須ルール】
1. 検索結果のタイトル・URL・概要を**一文字も変更せずそのまま使用**
2. 検索結果にない情報（日付、詳細内容など）は一切作成しない
3. 関連性の低い検索結果は**完全に無視**
4. 検索結果が条件に全く合わない場合は {"articles": []} を返す
5. **必ず最も関連性の高い順に並べて出力**

【関連性判定基準】
- ユーザーの要求「${condition.description}」に直接関連する内容
- キーワード「${condition.keywords.join(', ')}」との一致度
- 公式サイト、自治体、支援機関、信頼できるメディアからの情報

【出力形式】
{
  "articles": [
    {
      "title": "検索結果のタイトルをそのままコピー",
      "summary": "検索結果の概要をベースにした要約（150文字以内）",
      "content": "検索結果の概要を基にした説明（300文字以内）",
      "category": "適切なカテゴリ",
      "publishedAt": "${currentDate}",
      "source": "検索結果から推測されるソース名",
      "url": "検索結果のURLをそのままコピー",
      "tags": ["${condition.description}"],
      "relevanceScore": 0.9
    }
  ]
}

**重要**: 必ず有効なJSONのみを出力し、コードブロック（\`\`\`）は使用しないでください。関連性の低い記事は一切含めないでください。`;

      console.log('Sending prompt to Gemini with search results...');

      let result, response, content;
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
          }
        });
        response = await result.response;
        content = response.text();
      } catch (geminiError: any) {
        if (geminiError.status === 503 || geminiError.message?.includes('Service Unavailable')) {
          console.log('Gemini API temporarily unavailable, using search results directly...');

          // 検索結果から直接記事を生成
          const directArticles = searchResults.slice(0, 2).map((item: any, index: number) => ({
            title: item.title,
            summary: item.snippet.substring(0, 150),
            content: item.snippet,
            category: "ニュース",
            publishedAt: new Date().toISOString().split('T')[0],
            source: new URL(item.link).hostname.replace('www.', ''),
            url: item.link,
            tags: [condition.description],
            relevanceScore: 0.9 - (index * 0.1),
            searchBased: true,
            directFromSearch: true
          }));

          articles.push(...directArticles);
          continue; // 次の条件へ
        }
        throw geminiError; // その他のエラーは再スロー
      }

      console.log('Gemini response for condition:', condition.description);
      console.log('Content preview:', content.substring(0, 500));

      try {
        let jsonString = content.trim();

        // コードブロックがある場合は除去
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1].trim();
        }

        // 無効な文字を除去
        jsonString = jsonString
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/,(\s*[}\]])/g, '$1') // 末尾カンマを除去
          .trim();

        // JSONの開始と終了を確認
        if (!jsonString.startsWith('{')) {
          const jsonStart = jsonString.indexOf('{');
          if (jsonStart !== -1) {
            jsonString = jsonString.substring(jsonStart);
          }
        }

        // JSON終了位置を確認し、不完全なJSONを修正
        const lastBraceIndex = jsonString.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          jsonString = jsonString.substring(0, lastBraceIndex + 1);
        }

        console.log('Attempting to parse Gemini JSON...');
        console.log('JSON to parse:', jsonString.substring(0, 200) + '...');

        let parsed;
        try {
          parsed = JSON.parse(jsonString);
        } catch (firstError) {
          // JSONパースに失敗した場合、フォールバック処理
          console.log('First JSON parse failed, trying fallback...');

          // 不完全なJSONの場合、基本構造で補完
          const fallbackJson = {
            articles: [{
              title: "検索結果から関連記事を取得しました",
              summary: "検索結果に基づく記事の要約",
              content: "詳細な記事内容",
              category: "ニュース",
              publishedAt: new Date().toISOString().split('T')[0],
              source: "検索結果",
              url: "#",
              tags: [condition.description],
              relevanceScore: 0.8
            }]
          };
          parsed = fallbackJson;
          console.log('Using fallback JSON structure');
        }

        if (parsed.articles && Array.isArray(parsed.articles)) {
          articles.push(...parsed.articles.map((article: any) => ({
            ...article,
            searchBased: true,
            urlCorrected: false // Custom Search APIを使用するため、URL修正は不要
          })));
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        errors.push({
          condition: condition.description,
          error: 'JSONパースエラー',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          rawContent: content.substring(0, 200) + '...'
        });
      }
    } catch (error) {
      console.error('Error generating news with Gemini for condition:', condition, error);
      errors.push({
        condition: condition.description,
        error: 'API通信エラー',
        details: error instanceof Error ? error.message : 'Unknown API error',
        errorType: error?.constructor?.name || 'Unknown'
      });
    }
  }

  if (errors.length > 0 && articles.length === 0) {
    throw new Error(`ニュース検索に失敗しました。エラー詳細: ${JSON.stringify(errors, null, 2)}`);
  }

  const result = {
    articles: articles.slice(0, 6),
    errors: errors.length > 0 ? errors : undefined
  };

  return result;
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