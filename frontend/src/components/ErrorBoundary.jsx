import { Component } from "react";
import { Link } from "react-router";
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
          <div className="card bg-base-100 shadow-2xl max-w-lg w-full">
            <div className="card-body items-center text-center p-8">
              <div className="size-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangleIcon className="size-10 text-error" />
              </div>
              <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
              <p className="text-base-content/60 mb-2">
                An unexpected error occurred. This has been logged and you can
                safely continue.
              </p>
              {this.state.error && (
                <details className="w-full mt-4">
                  <summary className="text-xs text-base-content/40 cursor-pointer hover:text-base-content/60">
                    Technical details
                  </summary>
                  <pre className="mt-2 p-3 bg-base-200 rounded-lg text-xs text-error/80 text-left overflow-auto max-h-40">
                    {this.state.error.message}
                    {"\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.handleReset}
                  className="btn btn-primary gap-2"
                >
                  <RefreshCwIcon className="size-4" />
                  Try Again
                </button>
                <Link to="/dashboard" className="btn btn-outline gap-2">
                  <HomeIcon className="size-4" />
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
