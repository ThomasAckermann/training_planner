import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: 'var(--color-danger)', backgroundColor: '#ff333311' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--color-danger)' }}>
            {this.props.title || 'Something went wrong'}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.props.hint && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {this.props.hint}
            </p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
