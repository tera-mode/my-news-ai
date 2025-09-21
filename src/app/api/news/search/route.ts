import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { searchConditions } = await request.json();

    if (!searchConditions || !Array.isArray(searchConditions)) {
      return NextResponse.json(
        { error: 'Invalid search conditions' },
        { status: 400 }
      );
    }

    // Claude AIを使って検索条件に基づいたリアルなニュース記事を生成
    const articles = await generateRealisticNews(searchConditions);

    return NextResponse.json({
      articles,
      generatedAt: new Date().toISOString(),
      conditionsUsed: searchConditions.length
    });

  } catch (error) {
    console.error('News search error:', error);
    return NextResponse.json(
      { error: 'ニュース検索に失敗しました' },
      { status: 500 }
    );
  }
}

// 注意: majorNewsUrlsは現在未使用（将来的なWebスクレイピング機能用に保持）

// WebFetch機能を使って実際のニュースを取得
async function fetchRealNewsWithWebFetch(condition: any) {
  console.log('Attempting to fetch real news via multiple sources...');

  // 複数のニュースソースを試行
  const newsSources = [
    {
      name: 'NHK News RSS',
      url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
      type: 'rss'
    },
    {
      name: 'Nikkei RSS',
      url: 'https://www.nikkei.com/news/category/rss/',
      type: 'rss'
    },
    {
      name: 'TechCrunch Japan RSS',
      url: 'https://jp.techcrunch.com/feed/',
      type: 'rss'
    }
  ];

  for (const source of newsSources) {
    try {
      console.log(`Trying ${source.name}:`, source.url);

      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'ja,en;q=0.9'
        }
        // Note: timeout removed as it's not supported in standard fetch
      });

      if (!response.ok) {
        console.log(`${source.name} failed with status:`, response.status);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      console.log(`${source.name} content-type:`, contentType);

      const content = await response.text();
      console.log(`${source.name} content length:`, content.length);

      // HTMLページが返された場合はスキップ
      if (content.trim().startsWith('<!DOCTYPE') || content.includes('<html')) {
        console.log(`${source.name} returned HTML page, skipping...`);
        continue;
      }

      // RSSパースと記事抽出
      const articles = parseRSSFeed(content, condition, source.name);
      if (articles && articles.length > 0) {
        console.log(`Successfully got ${articles.length} articles from ${source.name}`);
        return articles;
      }

    } catch (error) {
      console.log(`${source.name} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  throw new Error('All news sources failed');
}

// RSS フィードをパースして記事を抽出
function parseRSSFeed(rssContent: string, condition: any, sourceName: string = 'RSS Feed') {
  const articles = [];
  const currentDate = new Date().toISOString().split('T')[0];

  try {
    console.log(`Parsing RSS from ${sourceName}, content preview:`, rssContent.substring(0, 500));

    // 複数のRSSフォーマットに対応
    const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;

    // タイトル用の複数パターン
    const titlePatterns = [
      /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i,
      /<title[^>]*>(.*?)<\/title>/i
    ];

    // リンク用の複数パターン
    const linkPatterns = [
      /<link[^>]*href=["'](.*?)["'][^>]*>/i,
      /<link[^>]*>(.*?)<\/link>/i,
      /<id[^>]*>(https?:\/\/.*?)<\/id>/i
    ];

    // 注意: datePatterns は現在未使用（将来的な日付解析機能用に保持可能）

    // 説明用のパターン
    const descPatterns = [
      /<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i,
      /<description[^>]*>(.*?)<\/description>/i,
      /<summary[^>]*>(.*?)<\/summary>/i
    ];

    let match;
    let itemCount = 0;

    while ((match = itemRegex.exec(rssContent)) !== null && itemCount < 3) {
      const itemContent = match[1] || '';

      // タイトルを抽出
      let title = null;
      for (const pattern of titlePatterns) {
        const titleMatch = pattern.exec(itemContent);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim().replace(/<[^>]*>/g, ''); // HTMLタグを除去
          break;
        }
      }

      // リンクを抽出
      let link = null;
      for (const pattern of linkPatterns) {
        const linkMatch = pattern.exec(itemContent);
        if (linkMatch && linkMatch[1]) {
          link = linkMatch[1].trim();
          break;
        }
      }

      // 説明を抽出
      let description = null;
      for (const pattern of descPatterns) {
        const descMatch = pattern.exec(itemContent);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].trim().replace(/<[^>]*>/g, '').substring(0, 200);
          break;
        }
      }

      if (title && link) {
        // キーワードとの関連性をチェック
        const relevanceScore = calculateRelevance(title, description || '', condition.keywords);

        if (relevanceScore > 0.3) { // 関連性が低すぎる記事は除外
          articles.push({
            title: title,
            summary: description || `${condition.description}に関連する最新ニュース記事です。`,
            content: `${title}について詳しく報道されています。この情報は実際の${sourceName}から取得されました。`,
            category: condition.keywords.some((k: string) => k.includes('AI') || k.includes('テクノロジー')) ? 'テクノロジー' : 'ビジネス',
            publishedAt: currentDate,
            source: sourceName,
            url: link,
            tags: condition.keywords.slice(0, 3),
            relevanceScore: relevanceScore,
            searchBased: true,
            isRSSFeed: true
          });
          itemCount++;
        }
      }
    }

    console.log(`Parsed ${articles.length} relevant articles from ${sourceName}`);
    return articles;

  } catch (error) {
    console.error(`RSS parsing error for ${sourceName}:`, error);
    return [];
  }
}

// キーワードとの関連性を計算
function calculateRelevance(title: string, description: string, keywords: string[]): number {
  const text = (title + ' ' + description).toLowerCase();
  const matchCount = keywords.filter(keyword =>
    text.includes(keyword.toLowerCase())
  ).length;

  return Math.min(matchCount / keywords.length + 0.3, 1.0);
}

async function generateRealisticNews(searchConditions: any[]) {
  const articles = [];

  for (const condition of searchConditions.slice(0, 3)) { // 最大3条件
    try {
      // まずWebFetch機能を使って実際のニュースを取得を試行
      console.log('Trying WebFetch approach for real news...');

      try {
        const webFetchResult = await fetchRealNewsWithWebFetch(condition);
        if (webFetchResult && webFetchResult.length > 0) {
          articles.push(...webFetchResult);
          continue; // WebFetchが成功した場合はGeminiをスキップ
        }
      } catch (webFetchError) {
        console.log('WebFetch failed, falling back to Gemini:', webFetchError instanceof Error ? webFetchError.message : webFetchError);
      }

      // WebFetchが失敗した場合はGemini with Google Search Retrieval を使用
      console.log('Using Gemini with Google Search Retrieval...');

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const searchQuery = `日本 ニュース 最新 ${condition.description} ${condition.keywords.join(' ')}`;
      const currentDate = new Date().toISOString().split('T')[0];

      const prompt = `「${searchQuery}」について最新のニュース記事を検索し、以下のJSON形式で2つの記事を作成してください：

{
  "articles": [
    {
      "title": "検索結果に基づく具体的なタイトル",
      "summary": "150文字程度の要約",
      "content": "500文字程度の記事本文",
      "category": "適切なカテゴリ",
      "publishedAt": "${currentDate}",
      "source": "実際のメディア名",
      "url": "実際の記事URL",
      "tags": ["関連タグ1", "関連タグ2"],
      "relevanceScore": 0.9
    },
    {
      "title": "2つ目の記事タイトル",
      "summary": "2つ目の要約",
      "content": "2つ目の記事本文",
      "category": "適切なカテゴリ",
      "publishedAt": "${currentDate}",
      "source": "実際のメディア名2",
      "url": "実際の記事URL2",
      "tags": ["関連タグ3", "関連タグ4"],
      "relevanceScore": 0.85
    }
  ]
}

検索条件: "${condition.description}"
キーワード: ${condition.keywords.join(', ')}`;

      console.log('Searching for news with Gemini + Google Search:', searchQuery);

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

      console.log('Gemini response for condition:', condition.description);
      console.log('Content length:', content.length);
      console.log('Content preview:', content.substring(0, 500));

      try {
        // JSONブロックを抽出
        let jsonString = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1];
        }

        // JSONパース用のクリーンアップ
        jsonString = jsonString
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 制御文字を削除
          .replace(/\r\n/g, '\n') // CRLFをLFに統一
          .replace(/\r/g, '\n') // CRをLFに変換
          .trim();

        console.log('Attempting to parse Gemini JSON:', jsonString.substring(0, 200) + '...');
        const parsed = JSON.parse(jsonString);
        if (parsed.articles && Array.isArray(parsed.articles)) {
          // URLと日付の検証
          const validatedArticles = parsed.articles.map((article: any) => {
            // 無効なURLパターンをチェック
            const invalidUrlPatterns = [
              'example.com',
              'placeholder',
              'dummy',
              'fake',
              'test.com'
            ];

            const hasInvalidUrl = invalidUrlPatterns.some(pattern =>
              article.url.toLowerCase().includes(pattern)
            );

            // 未来の日付をチェック
            const articleDate = new Date(article.publishedAt);
            const today = new Date();
            const isFutureDate = articleDate > today;

            // 無効なURLや未来の日付の場合は修正
            if (hasInvalidUrl || isFutureDate) {
              console.warn('Invalid URL or future date detected:', article.url, article.publishedAt);
              return {
                ...article,
                url: 'https://news.google.com/search?q=' + encodeURIComponent(condition.keywords.join(' ')), // Google Newsへのリンクに変更
                publishedAt: currentDate,
                source: article.source || 'ニュース検索結果',
                searchBased: true,
                urlCorrected: true
              };
            }

            return {
              ...article,
              searchBased: true
            };
          });

          articles.push(...validatedArticles);
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.log('Raw content:', content);

        // フォールバック: 条件に基づいたサンプル記事を生成
        const fallbackArticle = {
          title: `${condition.description}に関する最新動向`,
          summary: `${condition.description}について、最新の発展と今後の展望をお伝えします。業界関係者の注目を集める重要な動きが確認されています。`,
          content: `${condition.description}に関連する分野で重要な進展がありました。関係者によると、この動きは今後の業界全体に大きな影響を与える可能性があるとされています。専門家は「これは業界の転換点となる出来事」と分析しており、今後の動向が注目されています。`,
          category: condition.categories?.[0] || 'その他',
          publishedAt: new Date().toISOString().split('T')[0],
          source: 'News AI (Fallback)',
          url: `https://example.com/news/${Date.now()}`,
          tags: condition.keywords.slice(0, 3),
          relevanceScore: 0.6,
          searchBased: false
        };
        articles.push(fallbackArticle);
      }
    } catch (error) {
      console.error('Error generating news with Gemini for condition:', condition, error);

      // エラー時のフォールバック記事
      const errorFallbackArticle = {
        title: `${condition.description}に関する情報収集中`,
        summary: `${condition.description}に関する最新情報を収集しています。しばらくお待ちください。`,
        content: `現在、${condition.description}に関する最新情報を収集中です。検索エンジンとの接続に問題が発生している可能性があります。`,
        category: condition.categories?.[0] || 'その他',
        publishedAt: new Date().toISOString().split('T')[0],
        source: 'News AI (Error)',
        url: `https://example.com/error/${Date.now()}`,
        tags: condition.keywords.slice(0, 3),
        relevanceScore: 0.3,
        searchBased: false
      };
      articles.push(errorFallbackArticle);
    }
  }

  // 検索ベースの記事を優先してソート
  return articles
    .sort((a, b) => {
      if (a.searchBased && !b.searchBased) return -1;
      if (!a.searchBased && b.searchBased) return 1;
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    })
    .slice(0, 6); // 最大6記事
}