
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-6 max-w-7xl flex flex-col items-center text-center">
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-1">NWIS</h3>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-8">
          Nearby Wells Intelligence System
        </p>

        <div className="flex space-x-6 mb-12">
          <a href="#capabilities" className="text-sm text-text-muted hover:text-primary transition-colors">Capabilities</a>
          <a href="#how-it-works" className="text-sm text-text-muted hover:text-primary transition-colors">How It Works</a>
          <Link to="/dashboard" className="text-sm text-text-muted hover:text-primary transition-colors">Platform</Link>
        </div>

        <p className="text-sm text-text-muted">
          AI-assisted decision support for drilling operations.
        </p>
      </div>
    </footer>
  );
}
