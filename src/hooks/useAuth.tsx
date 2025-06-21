import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../utils/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: 'PARENT' | 'CHILD') => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回セッション取得
    getInitialSession();

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // メール確認完了時にデータベースを更新
          if (event === 'USER_UPDATED' && session.user.email && user?.email !== session.user.email) {
            console.log('Email confirmed, updating database:', session.user.email);
            try {
              const { error } = await supabase
                .from('users')
                .update({ email: session.user.email })
                .eq('id', session.user.id);
              
              if (error) {
                console.error('Error updating email in database:', error);
              } else {
                console.log('Email updated in database successfully');
              }
            } catch (err) {
              console.error('Error updating email in database:', err);
            }
          }
          
          // Supabaseユーザーに対応するアプリユーザー情報を取得
          await fetchUserProfile(session.user.id);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      // セッション取得にタイムアウトを設定（30秒）
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 30000)
      );

      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Session timeout') {
        console.warn('Session initialization timed out, proceeding without auth');
      } else {
        console.error('Error in getInitialSession:', error);
      }
      // エラー時も確実にloading状態を解除
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          role,
          family_id,
          birth_date,
          age,
          created_at,
          families!inner(id, name)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        // 現在のSupabaseユーザーのメールアドレスを取得
        const { data: currentUser } = await supabase.auth.getUser();
        
        // Supabaseのデータを既存のUser型に変換
        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: currentUser?.user?.email || '',
          role: data.role as 'PARENT' | 'CHILD',
          familyId: data.family_id,
          birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
          age: data.age,
          createdAt: new Date(data.created_at)
        };
        
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const register = async (email: string, password: string, name: string, role: 'PARENT' | 'CHILD'): Promise<void> => {
    try {
      // 1. Supabase認証でユーザー作成
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. 家族を作成（PARENTの場合）または既存家族に参加
        let familyId: string;
        
        if (role === 'PARENT') {
          // 新しい家族を作成
          const { data: familyData, error: familyError } = await supabase
            .from('families')
            .insert({ name: `${name}さんの家族` })
            .select()
            .single();

          if (familyError) throw familyError;
          familyId = familyData.id;
        } else {
          // 子供の場合は、家族招待システムで後から設定
          // 今のところは最初の家族に参加させる（簡易実装）
          const { data: familyData, error: familyError } = await supabase
            .from('families')
            .select('id')
            .limit(1)
            .single();

          if (familyError) throw familyError;
          familyId = familyData.id;
        }

        // 3. ユーザープロフィール作成
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            family_id: familyId,
            name,
            role,
          });

        if (profileError) throw profileError;

        console.log('User registered successfully');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // ユーザープロフィールは onAuthStateChange で自動取得される
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // ユーザー状態は onAuthStateChange で自動クリアされる
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser, 
      login, 
      logout, 
      register, 
      updateUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};