import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console; in a future build this could go through the
    // Tauri log plugin. We intentionally do not add a remote reporter.
    console.error('App crash:', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    // Best-effort: re-anchor to the dashboard so a soft retry works.
    window.location.assign('/')
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0B0C10] text-[#F4F1EA] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Something went wrong.</h1>
            <p className="text-sm text-[#A9A39A]">
              The application hit an unexpected error. Your data is safe in the
              local SQLite database.
            </p>
            <pre className="text-xs text-[#7C7870] bg-[#111318] border border-[#2A2E36] rounded p-3 overflow-auto text-left">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-[#C8BFAF] text-[#0B0C10] font-semibold rounded hover:bg-[#C8BFAF]/90"
            >
              Reload workspace
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
