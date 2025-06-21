-- Family Allowance App Database Schema
-- 実行順序: この順番でSupabase SQL Editorで実行してください

-- 1. 家族テーブル
CREATE TABLE families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '我が家',
    invite_code VARCHAR(10) UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ユーザーテーブル (Supabase Authと連携)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('PARENT', 'CHILD')) NOT NULL,
    birth_date DATE,
    age INTEGER, -- 後方互換性のため
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. タスクテーブル
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    category VARCHAR(100) NOT NULL DEFAULT 'その他',
    difficulty VARCHAR(10) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'EASY',
    is_recurring BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- NULLの場合は全員対象
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. タスク完了テーブル
CREATE TABLE task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    child_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    comments TEXT
);

-- 5. ポイント取引テーブル
CREATE TABLE point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('EARNED', 'EXCHANGED', 'INVESTMENT')) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. イベントテーブル
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'その他',
    event_type VARCHAR(20) CHECK (event_type IN ('SCORE_BASED', 'EVALUATION_BASED', 'COMPLETION_BASED')) NOT NULL,
    points_config JSONB NOT NULL, -- ポイント設定をJSONで保存
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. イベント結果テーブル
CREATE TABLE event_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    child_id UUID REFERENCES users(id) ON DELETE CASCADE,
    result_type VARCHAR(20) CHECK (result_type IN ('SCORE', 'EVALUATION', 'COMPLETED')) NOT NULL,
    score INTEGER,
    evaluation VARCHAR(100),
    earned_points INTEGER NOT NULL,
    bonus_earned BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    comments TEXT
);

-- 8. レート設定テーブル
CREATE TABLE rate_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('AGE_BASED', 'PERIOD_BASED', 'PERFORMANCE_BASED')) NOT NULL,
    conditions JSONB NOT NULL, -- 条件設定をJSONで保存
    multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    bonus_points INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 設定
-- これにより、各家族は自分のデータのみアクセス可能になります

-- families テーブルのRLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their family" ON families
    FOR SELECT USING (id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family members" ON users
    FOR SELECT USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- tasks テーブルのRLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family tasks" ON tasks
    FOR ALL USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- task_completions テーブルのRLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family task completions" ON task_completions
    FOR ALL USING (child_id IN (
        SELECT id FROM users WHERE family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    ));

-- point_transactions テーブルのRLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family transactions" ON point_transactions
    FOR ALL USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- events テーブルのRLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family events" ON events
    FOR ALL USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- event_results テーブルのRLS
ALTER TABLE event_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family event results" ON event_results
    FOR ALL USING (child_id IN (
        SELECT id FROM users WHERE family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    ));

-- rate_rules テーブルのRLS
ALTER TABLE rate_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view family rate rules" ON rate_rules
    FOR ALL USING (family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    ));

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_events_family_id ON events(family_id);
CREATE INDEX idx_event_results_event_id ON event_results(event_id);
CREATE INDEX idx_event_results_child_id ON event_results(child_id);
CREATE INDEX idx_rate_rules_family_id ON rate_rules(family_id);