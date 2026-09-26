import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            backgroundColor: 'var(--bg-primary, #f5f5f7)',
            color: 'var(--text-primary, #1d1d1f)',
            fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '380px',
              width: '100%',
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '24px',
              padding: '32px 24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
              Xatolik yuz berdi
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--text-secondary, #86868b)',
                lineHeight: 1.5,
              }}
            >
              Sahifani yuklashda kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklang.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '12px 20px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#0071e3',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              Sahifani qayta yuklash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
