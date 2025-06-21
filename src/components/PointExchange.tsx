import React, { useState, useEffect } from 'react';
import { User, PointTransaction } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';
import { calculateAge } from '../utils/dateUtils';
import { Coins, DollarSign, ArrowRightLeft, History, Wallet, TrendingDown } from 'lucide-react';

interface ExchangeRate {
  pointsPerYen: number; // 1円あたりのポイント数
  minimumExchange: number; // 最小交換ポイント数
}

interface PointBalance {
  totalEarned: number; // 獲得総ポイント数
  totalSpent: number; // 使用総ポイント数
  currentBalance: number; // 現在の残高
  totalExchanged: number; // 交換総金額
}

const PointExchange: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [exchangeAmount, setExchangeAmount] = useState<number>(100);
  const [exchangeRate] = useState<ExchangeRate>({
    pointsPerYen: 10, // 10ポイント = 1円
    minimumExchange: 100 // 最小100ポイントから交換可能
  });
  const [currentTab, setCurrentTab] = useState<'exchange' | 'history' | 'balance'>('exchange');
  const [pointBalances, setPointBalances] = useState<{ [childId: string]: PointBalance }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateBalances();
  }, [children]);

  const loadData = () => {
    const allChildren = storage.getUsers().filter(u => u.role === 'CHILD');
    setChildren(allChildren);
    if (allChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(allChildren[0].id);
    }
  };

  const calculateBalances = () => {
    const balances: { [childId: string]: PointBalance } = {};
    
    children.forEach(child => {
      const transactions = storage.getPointTransactions().filter(t => t.userId === child.id);
      
      const totalEarned = transactions
        .filter(t => t.type === 'EARNED')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalSpent = transactions
        .filter(t => t.type === 'EXCHANGED')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentBalance = totalEarned - totalSpent;
      
      // 交換総金額を計算（ポイント数÷レート）
      const totalExchanged = Math.floor(totalSpent / exchangeRate.pointsPerYen);
      
      balances[child.id] = {
        totalEarned,
        totalSpent,
        currentBalance,
        totalExchanged
      };
    });
    
    setPointBalances(balances);
  };

  const handleExchange = () => {
    if (!selectedChildId || exchangeAmount < exchangeRate.minimumExchange) return;
    
    const balance = pointBalances[selectedChildId];
    if (!balance || balance.currentBalance < exchangeAmount) {
      alert('残高が不足しています。');
      return;
    }

    const yenAmount = Math.floor(exchangeAmount / exchangeRate.pointsPerYen);
    
    if (confirm(`${exchangeAmount}ポイントを${yenAmount}円に交換しますか？`)) {
      // ポイント交換のトランザクションを記録
      const transactions = storage.getPointTransactions();
      const newTransaction: PointTransaction = {
        id: storage.generateId(),
        userId: selectedChildId,
        type: 'EXCHANGED',
        amount: exchangeAmount,
        description: `ポイント交換: ${exchangeAmount}pt → ${yenAmount}円`,
        createdAt: new Date()
      };
      
      transactions.push(newTransaction);
      storage.savePointTransactions(transactions);
      
      // 残高を再計算
      calculateBalances();
      setExchangeAmount(exchangeRate.minimumExchange);
      
      alert(`交換完了！${yenAmount}円をお渡ししてください。`);
    }
  };

  const getExchangeHistory = (childId: string) => {
    return storage.getPointTransactions()
      .filter(t => t.userId === childId && t.type === 'EXCHANGED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child?.name || '不明';
  };

  const selectedBalance = pointBalances[selectedChildId];
  const exchangeYenAmount = Math.floor(exchangeAmount / exchangeRate.pointsPerYen);
  const canExchange = exchangeAmount >= exchangeRate.minimumExchange && 
                     selectedBalance && selectedBalance.currentBalance >= exchangeAmount;

  if (children.length === 0) {
    return (
      <div className="card text-center py-12">
        <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">まだお子様が登録されていません</h3>
        <p className="text-gray-500">ポイント交換を利用するには、まずお子様を登録してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-purple-800">💰 ポイント交換システム</h2>
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full border-2 border-green-300">
          <Coins className="w-6 h-6 text-green-600" />
          <span className="font-bold text-green-800">
            {exchangeRate.pointsPerYen}ポイント = 1円
          </span>
        </div>
      </div>

      {/* 子供選択 */}
      <div className="card">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">👧 お子様を選択</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="input-field max-w-md"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.name} ({child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`})
              </option>
            ))}
          </select>
        </div>

        {/* 残高表示 */}
        {selectedBalance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-blue-600 text-sm font-medium">獲得総ポイント</p>
                  <p className="text-2xl font-bold text-blue-800">{selectedBalance.totalEarned}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-green-600 text-sm font-medium">現在の残高</p>
                  <p className="text-2xl font-bold text-green-800">{selectedBalance.currentBalance}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-red-600 text-sm font-medium">使用ポイント</p>
                  <p className="text-2xl font-bold text-red-800">{selectedBalance.totalSpent}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-yellow-600 text-sm font-medium">交換総金額</p>
                  <p className="text-2xl font-bold text-yellow-800">¥{selectedBalance.totalExchanged}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div className="card">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCurrentTab('exchange')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              currentTab === 'exchange'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💱 ポイント交換
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              currentTab === 'history'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📜 交換履歴
          </button>
          <button
            onClick={() => setCurrentTab('balance')}
            className={`px-6 py-3 rounded-full font-bold transition-all ${
              currentTab === 'balance'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💰 全体残高
          </button>
        </div>

        {/* ポイント交換タブ */}
        {currentTab === 'exchange' && (
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-6">💱 ポイント交換</h3>
            
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label className="block text-lg font-bold text-green-700 mb-3">
                  交換するポイント数
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(parseInt(e.target.value) || 0)}
                    className="input-field text-center text-2xl pr-16"
                    min={exchangeRate.minimumExchange}
                    step={exchangeRate.pointsPerYen}
                    placeholder="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">
                    pt
                  </span>
                </div>
                <p className="text-sm text-green-600 mt-2 text-center">
                  最小交換: {exchangeRate.minimumExchange}ポイント
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{exchangeAmount}pt</div>
                  <div className="text-sm text-green-700">ポイント</div>
                </div>
                <ArrowRightLeft className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">¥{exchangeYenAmount}</div>
                  <div className="text-sm text-blue-700">円</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>注意:</strong> 交換したポイントは元に戻せません。
                  </p>
                </div>

                <button
                  onClick={handleExchange}
                  disabled={!canExchange}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                    canExchange
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canExchange
                    ? `💰 ${exchangeYenAmount}円に交換する`
                    : exchangeAmount < exchangeRate.minimumExchange
                    ? `最小${exchangeRate.minimumExchange}ポイント必要`
                    : '残高が不足しています'
                  }
                </button>
              </div>

              {/* クイック交換ボタン */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">クイック交換</p>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000].map(amount => {
                    const yen = Math.floor(amount / exchangeRate.pointsPerYen);
                    const available = selectedBalance && selectedBalance.currentBalance >= amount;
                    return (
                      <button
                        key={amount}
                        onClick={() => setExchangeAmount(amount)}
                        disabled={!available}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          available
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {amount}pt<br />¥{yen}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 交換履歴タブ */}
        {currentTab === 'history' && (
          <div>
            <h3 className="text-xl font-bold text-blue-700 mb-6">📜 交換履歴</h3>
            
            <div className="space-y-3">
              {getExchangeHistory(selectedChildId).map(transaction => {
                const yenAmount = Math.floor(transaction.amount / exchangeRate.pointsPerYen);
                return (
                  <div key={transaction.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-bold text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.createdAt).toLocaleDateString('ja-JP')} {new Date(transaction.createdAt).toLocaleTimeString('ja-JP')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-{transaction.amount}pt</p>
                        <p className="text-sm font-bold text-green-600">+¥{yenAmount}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {getExchangeHistory(selectedChildId).length === 0 && (
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">まだ交換履歴がありません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 全体残高タブ */}
        {currentTab === 'balance' && (
          <div>
            <h3 className="text-xl font-bold text-purple-700 mb-6">💰 全体残高</h3>
            
            <div className="space-y-4">
              {children.map(child => {
                const balance = pointBalances[child.id];
                if (!balance) return null;
                
                return (
                  <div key={child.id} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-purple-800">{child.name}</h4>
                        <p className="text-purple-600">
                          {child.birthDate ? `${calculateAge(child.birthDate)}歳` : `${child.age || 0}歳`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-700">{balance.currentBalance}pt</p>
                        <p className="text-sm text-purple-600">現在の残高</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 mb-1">獲得総数</p>
                        <p className="font-bold text-purple-800">{balance.totalEarned}pt</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 mb-1">使用総数</p>
                        <p className="font-bold text-red-600">{balance.totalSpent}pt</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 mb-1">交換総額</p>
                        <p className="font-bold text-green-600">¥{balance.totalExchanged}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointExchange;