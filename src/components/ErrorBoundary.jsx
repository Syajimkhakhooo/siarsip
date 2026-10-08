import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SIARSIP ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Terjadi Kesalahan Sistem</h2>
            <p className="text-xs text-gray-500 mb-5">
              Aplikasi mengalami kendala teknis sementara saat memuat data. Silakan muat ulang halaman atau kembali ke beranda.
            </p>
            {this.state.error?.message && (
              <div className="mb-5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-left">
                <p className="text-[11px] font-mono text-gray-600 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 h-9 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 h-9 rounded-lg border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
