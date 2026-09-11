
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function FinalCtaSection() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,127,115,0.1)_0%,transparent_70%)]" />
      
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground mb-8">
          Bring the Experience of Every Well <br className="hidden md:block" />
          Into the Next Drilling Decision.
        </h2>
        
        <p className="text-lg text-text-secondary mb-12">
          AI-assisted decision support for drilling operations.
        </p>
        
        <Link to="/login">
          <Button size="lg" className="uppercase tracking-widest text-xs font-bold px-10">
            Open NWIS Platform
          </Button>
        </Link>
      </div>
    </section>
  );
}
