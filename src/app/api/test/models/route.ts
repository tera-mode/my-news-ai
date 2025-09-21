import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    console.log('Testing available Gemini models...');

    // 一般的に利用可能なモデル名をテスト
    const testModels = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];

    const modelResults = [];

    for (const modelName of testModels) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        // 簡単なテストクエリで動作確認
        const result = await model.generateContent('Hello, test');
        const response = await result.response;
        const text = response.text();

        modelResults.push({
          name: modelName,
          status: 'available',
          responseLength: text.length,
          testResponse: text.substring(0, 100)
        });

        console.log(`✓ Model ${modelName} works - Response: ${text.substring(0, 50)}...`);

      } catch (error) {
        modelResults.push({
          name: modelName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        console.log(`✗ Model ${modelName} failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    // SDK情報も取得
    const sdkInfo = {
      version: '0.24.1', // npm listで確認した版
      hasListModels: typeof (genAI as any).listModels === 'function',
      availableMethods: Object.getOwnPropertyNames(genAI).filter((name: string) => typeof (genAI as any)[name] === 'function')
    };

    return NextResponse.json({
      success: true,
      sdkInfo,
      testedModels: testModels.length,
      workingModels: modelResults.filter(m => m.status === 'available').length,
      results: modelResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing models:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}