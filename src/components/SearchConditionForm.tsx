'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { extractKeywordsFromCondition, generateConditionSamples } from '@/lib/claude';
import type { SearchConditionInput, KeywordExtractionResult } from '@/types';

interface SearchConditionFormProps {
  onSave: (conditions: SearchConditionInput[]) => Promise<void>;
  existingConditions?: SearchConditionInput[];
  maxConditions?: number;
}

export default function SearchConditionForm({
  onSave,
  existingConditions = [],
  maxConditions = 3
}: SearchConditionFormProps) {
  const [conditions, setConditions] = useState<SearchConditionInput[]>(
    existingConditions.length > 0
      ? existingConditions
      : [{ description: '', priority: 1, keywords: [] }]
  );
  const [extractingKeywords, setExtractingKeywords] = useState<number | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [samples, setSamples] = useState<string[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 条件を追加
  const addCondition = () => {
    if (conditions.length < maxConditions) {
      setConditions([...conditions, { description: '', priority: 1, keywords: [] }]);
    }
  };

  // 条件を削除
  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  // 条件を更新
  const updateCondition = (index: number, field: keyof SearchConditionInput, value: any) => {
    setConditions(conditions.map((condition, i) =>
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  // キーワード自動抽出
  const extractKeywords = async (index: number) => {
    const condition = conditions[index];
    if (!condition || !condition.description.trim()) return;

    setExtractingKeywords(index);

    try {
      const result: KeywordExtractionResult = await extractKeywordsFromCondition(condition.description);
      updateCondition(index, 'keywords', result.keywords);
    } catch (error) {
      console.error('Keyword extraction failed:', error);
    } finally {
      setExtractingKeywords(null);
    }
  };

  // サンプル条件を取得
  const loadSamples = async () => {
    setLoadingSamples(true);
    try {
      const sampleConditions = await generateConditionSamples();
      setSamples(sampleConditions);
      setShowSamples(true);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setLoadingSamples(false);
    }
  };

  // サンプル選択
  const selectSample = (sample: string, index: number) => {
    updateCondition(index, 'description', sample);
    setShowSamples(false);
  };

  // バリデーション
  const validateConditions = () => {
    return conditions.every(condition =>
      condition.description.trim().length >= 10 &&
      condition.keywords.length > 0
    );
  };

  // 保存
  const handleSave = async () => {
    if (!validateConditions()) {
      alert('すべての条件で10文字以上の説明とキーワードが必要です。');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(conditions);
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  // プレビュー切り替え
  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-error-100 text-error-800 border-error-200';
      case 2: return 'bg-warning-100 text-warning-800 border-warning-200';
      case 3: return 'bg-success-100 text-success-800 border-success-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return '高優先度';
      case 2: return '中優先度';
      case 3: return '低優先度';
      default: return '優先度未設定';
    }
  };

  if (isPreviewMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>情報収集条件プレビュー</CardTitle>
            <Button variant="outline" onClick={togglePreview}>
              編集に戻る
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {conditions.map((condition, index) => (
            <div key={index} className="border border-secondary-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-secondary-900">
                  条件 {index + 1}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(condition.priority)}`}>
                  {getPriorityLabel(condition.priority)}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-secondary-700 mb-2">{condition.description}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700">抽出キーワード:</h4>
                <div className="flex flex-wrap gap-2">
                  {condition.keywords.map((keyword, keywordIndex) => (
                    <span
                      key={keywordIndex}
                      className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={isSaving} className="flex-1">
              条件を保存
            </Button>
            <Button variant="outline" onClick={togglePreview}>
              編集を続ける
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>情報収集条件設定</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSamples}
              loading={loadingSamples}
            >
              💡 条件例
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              disabled={!validateConditions()}
            >
              プレビュー
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 条件例モーダル */}
        {showSamples && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">条件例を選択</h3>
                  <button
                    onClick={() => setShowSamples(false)}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {samples.map((sample, sampleIndex) => (
                    <div key={sampleIndex} className="flex items-center gap-2">
                      <button
                        onClick={() => selectSample(sample, 0)}
                        className="flex-1 text-left p-3 rounded border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        {sample}
                      </button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={() => setShowSamples(false)} className="w-full">
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 条件フォーム */}
        {conditions.map((condition, index) => (
          <div key={index} className="border border-secondary-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-secondary-900">
                条件 {index + 1}
              </h3>
              <div className="flex items-center gap-2">
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-error-500 hover:text-error-700 text-sm"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>

            {/* 条件説明 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">
                情報収集条件（自然言語で記述）
              </label>
              <div className="relative">
                <textarea
                  value={condition.description}
                  onChange={(e) => updateCondition(index, 'description', e.target.value)}
                  placeholder="例: AI技術の最新動向、特に生成AIとビジネス活用事例について"
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 resize-none"
                  rows={3}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => extractKeywords(index)}
                  loading={extractingKeywords === index}
                  disabled={!condition.description.trim() || extractingKeywords !== null}
                  className="absolute bottom-2 right-2"
                >
                  🔍 キーワード抽出
                </Button>
              </div>
            </div>

            {/* 優先度 */}
            <div>
              <label className="text-sm font-medium text-secondary-700 mb-2 block">
                優先度
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => updateCondition(index, 'priority', priority)}
                    className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                      condition.priority === priority
                        ? getPriorityColor(priority)
                        : 'border-secondary-300 hover:border-secondary-400'
                    }`}
                  >
                    {priority}. {getPriorityLabel(priority).replace('優先度', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* キーワード */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">
                キーワード
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {condition.keywords.map((keyword, keywordIndex) => (
                  <span
                    key={keywordIndex}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => {
                        const newKeywords = condition.keywords.filter((_, i) => i !== keywordIndex);
                        updateCondition(index, 'keywords', newKeywords);
                      }}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="手動でキーワードを追加（Enterで追加）"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const keyword = e.currentTarget.value.trim();
                    if (keyword && !condition.keywords.includes(keyword)) {
                      updateCondition(index, 'keywords', [...condition.keywords, keyword]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        ))}

        {/* 条件追加ボタン */}
        {conditions.length < maxConditions && (
          <Button
            variant="outline"
            onClick={addCondition}
            className="w-full"
          >
            + 条件を追加 ({conditions.length}/{maxConditions})
          </Button>
        )}

        {/* 保存ボタン */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!validateConditions()}
            className="flex-1"
          >
            条件を保存
          </Button>
          <Button
            variant="outline"
            onClick={togglePreview}
            disabled={!validateConditions()}
          >
            プレビュー
          </Button>
        </div>

        {/* バリデーションメッセージ */}
        {!validateConditions() && (
          <div className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded border">
            💡 ヒント: すべての条件で10文字以上の説明とキーワードを設定してください。
          </div>
        )}
      </CardContent>
    </Card>
  );
}