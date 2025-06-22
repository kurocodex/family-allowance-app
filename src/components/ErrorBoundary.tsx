import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
            <div className="text-red-500 mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              エラーが発生しました
            </h1>
            
            <p className="text-gray-600 mb-6">
              アプリの読み込み中に問題が発生しました。
              ページを再読み込みして再試行してください。
            </p>
            
            <button
              onClick={this.handleReload}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-6 rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              ページを再読み込み
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  デバッグ情報
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-red-600 overflow-auto max-h-32">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;