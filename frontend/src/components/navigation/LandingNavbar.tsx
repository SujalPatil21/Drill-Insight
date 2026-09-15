import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { BrandLogo } from "../ui/BrandLogo";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b",
        scrolled 
          ? "bg-background/95 backdrop-blur-md border-border py-4" 
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        {/* Brand */}
        <BrandLogo isLink={true} hideTextOnMobile={true} />

        {/* Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#capabilities" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            Capabilities
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            How It Works
          </a>
          <a href="#intelligence" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            Intelligence
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center">
          <Link to="/login">
            <Button variant="primary" size="sm" className="font-semibold tracking-wide uppercase text-[11px] px-6">
              Open Platform
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
