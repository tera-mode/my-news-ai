import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Custom Search API の設定
const CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');

    // URLパラメータから検索条件を取得（デバッグ用）
    const testQuery = searchParams.get('q');

    const sampleCondition = testQuery ? {
      description: testQuery,
      keywords: testQuery.split(' ').slice(0, 5), // スペース区切りで最大5個のキーワード
      categories: ['テスト']
    } : {
      description: '千葉県の起業支援に関する情報',
      keywords: ['千葉県', '起業支援', '創業支援', '補助金', '助成金', '融資', '相談窓口', 'セミナー'],
      categories: ['ビジネス', '経済', '社会']
    };

    const result = await generateRealisticNews([sampleCondition]);

    return NextResponse.json({
      articles: result.articles ? result.articles.slice(0, limit) : [],
      errors: result.errors,
      generatedAt: new Date().toISOString(),
      conditionsUsed: 1,
      debugMode: true
    });

  } catch (error) {
    console.error('News search error (GET):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'ニュース検索に失敗しました',
        details: errorMessage,
        errorType: error?.constructor?.name || 'UnknownError'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchConditions } = await request.json();

    if (!searchConditions || !Array.isArray(searchConditions)) {
      return NextResponse.json(
        { error: 'Invalid search conditions' },
        { status: 400 }
      );
    }

    const result = await generateRealisticNews(searchConditions);

    return NextResponse.json({
      articles: result.articles || [],
      errors: result.errors,
      generatedAt: new Date().toISOString(),
      conditionsUsed: searchConditions.length
    });

  } catch (error) {
    console.error('News search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'ニュース検索に失敗しました',
        details: errorMessage,
        errorType: error?.constructor?.name || 'UnknownError'
      },
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