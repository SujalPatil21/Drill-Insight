import { Button } from "../ui/Button";
import heroImage from "../../assets/Homepageimage.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      
      {/* Hero Image - Absolute positioned to blend with background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        
        {/* The image container */}
        <div className="
          absolute 
          right-0 top-0 w-full h-full opacity-15 
          lg:right-[2%] lg:top-[15%] lg:w-[42%] lg:h-[75%] lg:opacity-80
          animate-in fade-in slide-in-from-right-8 duration-1000 ease-out
        ">
          <div className="relative w-full h-full">
            <img 
              src={heroImage} 
              alt="NWIS Industrial Operations" 
              className="w-full h-full object-cover object-center"
            />
            {/* Gradients to fade edges seamlessly into the dark background */}
            
            {/* Fade left edge into background */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background to-transparent" />
            
            {/* Fade right edge slightly into background */}
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background/50 to-transparent" />
            
            {/* Fade top edge */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />

            {/* Fade bottom edge */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
            
            {/* Subtle dark overlay over the whole image */}
            <div className="absolute inset-0 bg-black/25" />
          </div>
        </div>
        
      </div>

      {/* Grid Pattern over everything except text */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle grid/tech pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="max-w-3xl lg:w-[60%]">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-[1px] bg-primary"></div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Nearby Wells Intelligence System
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8 text-foreground">
            Turn Every Nearby Well <br className="hidden md:block" />
            Into <span className="text-primary">Drilling Intelligence.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-10 max-w-2xl">
            NWIS connects current drilling conditions with historical offset-well experience, 
            spatial intelligence and predictive decision support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="uppercase tracking-widest text-xs font-bold px-8">
              Explore NWIS
            </Button>
            <Button variant="outline" size="lg" className="uppercase tracking-widest text-xs font-bold px-8">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
