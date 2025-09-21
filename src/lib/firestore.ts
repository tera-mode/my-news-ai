import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Article, User, NewsletterSubscription, SearchCondition, SearchConditionInput } from '../types';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  ARTICLES: 'articles',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscriptions',
  ANALYTICS_EVENTS: 'analytics_events',
  SEARCH_CONDITIONS: 'search_conditions',
} as const;

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

// Helper function to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// User operations
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date();
  const userDoc = {
    ...userData,
    createdAt: dateToTimestamp(now),
    updatedAt: dateToTimestamp(now),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), userDoc);
  return docRef.id;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as User;
  }
  
  return null;
};

// Article operations
export const createArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date();
  const articleDoc = {
    ...articleData,
    publishedAt: dateToTimestamp(articleData.publishedAt),
    createdAt: dateToTimestamp(now),
    updatedAt: dateToTimestamp(now),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.ARTICLES), articleDoc);
  return docRef.id;
};

export const getPublishedArticles = async (limitCount: number = 10): Promise<Article[]> => {
  const q = query(
    collection(db, COLLECTIONS.ARTICLES),
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  const articles: Article[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    articles.push({
      id: doc.id,
      ...data,
      publishedAt: timestampToDate(data.publishedAt),
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    } as Article);
  });
  
  return articles;
};

// Newsletter subscription operations
export const createNewsletterSubscription = async (
  subscriptionData: Omit<NewsletterSubscription, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const subscriptionDoc = {
    ...subscriptionData,
    createdAt: dateToTimestamp(now),
    updatedAt: dateToTimestamp(now),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.NEWSLETTER_SUBSCRIPTIONS), subscriptionDoc);
  return docRef.id;
};

// Search condition operations
export const saveSearchConditions = async (
  userId: string,
  conditions: SearchConditionInput[]
): Promise<void> => {
  try {
    // 既存の条件を削除
    await deleteUserSearchConditions(userId);

    // 新しい条件を保存
    const now = new Date();
    const promises = conditions.map((condition) => {
      const conditionDoc = {
        userId,
        description: condition.description,
        priority: condition.priority,
        keywords: condition.keywords,
        extractedKeywords: condition.keywords, // 初期値として設定
        isActive: true,
        createdAt: dateToTimestamp(now),
        updatedAt: dateToTimestamp(now),
      };

      return addDoc(collection(db, COLLECTIONS.SEARCH_CONDITIONS), conditionDoc);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to save search conditions:', error);
    throw new Error('検索条件の保存に失敗しました');
  }
};

export const getUserSearchConditions = async (userId: string): Promise<SearchCondition[]> => {
  try {
    // 複合インデックスエラーを回避するため、段階的にクエリを実行
    let q;
    try {
      // フル複合インデックスを試行
      q = query(
        collection(db, COLLECTIONS.SEARCH_CONDITIONS),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('priority', 'asc'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const conditions: SearchCondition[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conditions.push({
          id: doc.id,
          userId: data.userId,
          description: data.description,
          priority: data.priority,
          keywords: data.keywords || [],
          extractedKeywords: data.extractedKeywords || [],
          isActive: data.isActive,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
        });
      });

      return conditions;
    } catch (indexError) {
      console.warn('Complex query failed, falling back to simple query:', indexError);

      // フォールバック: 簡単なクエリ + クライアントサイドソート
      q = query(
        collection(db, COLLECTIONS.SEARCH_CONDITIONS),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const conditions: SearchCondition[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conditions.push({
          id: doc.id,
          userId: data.userId,
          description: data.description,
          priority: data.priority,
          keywords: data.keywords || [],
          extractedKeywords: data.extractedKeywords || [],
          isActive: data.isActive,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt),
        });
      });

      // クライアントサイドでソート
      return conditions.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }
  } catch (error) {
    console.error('Failed to get search conditions:', error);
    throw new Error('検索条件の取得に失敗しました');
  }
};

export const deleteUserSearchConditions = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.SEARCH_CONDITIONS),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to delete search conditions:', error);
    throw new Error('検索条件の削除に失敗しました');
  }
};

export const updateSearchCondition = async (
  conditionId: string,
  updates: Partial<Omit<SearchCondition, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.SEARCH_CONDITIONS, conditionId);
    const updateData = {
      ...updates,
      updatedAt: dateToTimestamp(new Date()),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Failed to update search condition:', error);
    throw new Error('検索条件の更新に失敗しました');
  }
};

export const deactivateSearchCondition = async (conditionId: string): Promise<void> => {
  try {
    await updateSearchCondition(conditionId, { isActive: false });
  } catch (error) {
    console.error('Failed to deactivate search condition:', error);
    throw new Error('検索条件の無効化に失敗しました');
  }
};
