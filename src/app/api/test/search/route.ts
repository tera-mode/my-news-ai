import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { query, model: modelName } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-pro" });

    console.log(`Testing Google Search with model: ${modelName || "gemini-1.5-pro"}`);
    console.log(`Query: ${query}`);

    const testPrompt = query || "最新のAI技術ニュースを教えてください";

    // Google Search Retrievalツールを使ってテスト
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: testPrompt }] }],
      tools: [
        {
          googleSearchRetrieval: {}, // Google Search Retrieval ツールを有効化
        },
      ],
    });

    const response = await result.response;
    const content = response.text();

    console.log('Search response received, length:', content.length);
    console.log('Response preview:', content.substring(0, 500));

    // 引用情報があるかチェック
    let citationInfo = null;
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate && candidate.citationMetadata && candidate.citationMetadata.citationSources) {
        citationInfo = candidate.citationMetadata.citationSources.map((source, index) => ({
          index: index + 1,
          uri: source.uri,
          startIndex: source.startIndex,
          endIndex: source.endIndex
        }));
      }
    }

    return NextResponse.json({
      success: true,
      model: modelName || "gemini-1.5-pro",
      query: testPrompt,
      response: content,
      responseLength: content.length,
      hasCitations: citationInfo !== null,
      citationCount: citationInfo?.length || 0,
      citations: citationInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing search:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}