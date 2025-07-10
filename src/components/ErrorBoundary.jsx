import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log do erro para monitoramento
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="glass-dark rounded-2xl p-6 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="font-orbitron text-xl font-bold text-red-400 mb-4">
              ERRO DO SISTEMA
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Algo deu errado. Por favor, recarregue a página.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="btn-futuristic w-full py-3 rounded-lg"
              >
                🔄 RECARREGAR
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="glass w-full py-3 rounded-lg text-sm border border-gray-600/30"
              >
                ↩️ TENTAR NOVAMENTE
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer">
                  Detalhes do erro (dev)
                </summary>
                <pre className="text-xs text-red-300 mt-2 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
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