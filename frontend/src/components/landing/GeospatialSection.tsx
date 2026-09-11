
import { SectionHeading } from "../ui/SectionHeading";
import { Badge } from "../ui/Badge";

export function GeospatialSection() {
  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <SectionHeading 
              eyebrow="GEOSPATIAL INTELLIGENCE"
              title="Know What's Happened Around You."
              align="left"
              className="mb-8"
            />
            <p className="text-text-secondary text-lg leading-relaxed mb-10">
              The NWIS map concept visualizes active wells, historical wells, and high-risk zones. 
              By understanding spatial proximity, engineers can anticipate formations, depths, and potential hazards based on offset experience.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
                <span className="text-sm font-medium text-text-primary uppercase tracking-widest">Active Operations</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-text-muted"></div>
                <span className="text-sm font-medium text-text-primary uppercase tracking-widest">Historical Offset</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-danger ring-4 ring-danger/20"></div>
                <span className="text-sm font-medium text-text-primary uppercase tracking-widest">High-Risk Zone</span>
              </div>
            </div>
          </div>

          {/* Map Preview Mock */}
          <div className="relative aspect-square md:aspect-[4/3] rounded-md border border-border bg-background overflow-hidden shadow-2xl">
            {/* Fake map background using grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(42,42,42,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(42,42,42,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
            
            {/* Map Markers (Mocks) */}
            <div className="absolute top-[30%] left-[40%] flex flex-col items-center group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/30 z-10" />
              <div className="mt-2 px-2 py-1 bg-surface border border-border rounded text-[10px] text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                WELL-A12
              </div>
            </div>

            <div className="absolute top-[50%] left-[60%] flex flex-col items-center group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-danger ring-4 ring-danger/30 z-10" />
              <div className="absolute w-32 h-32 rounded-full border border-danger/30 bg-danger/5 -top-14 -left-14" />
              <div className="mt-2 px-2 py-1 bg-surface border border-border rounded text-[10px] text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                WELL-B04 (MUD LOSS)
              </div>
            </div>

            <div className="absolute top-[70%] left-[30%] flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-text-muted" />
            </div>

            <div className="absolute top-[20%] left-[70%] flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-text-muted" />
            </div>

            {/* UI Overlay */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Badge variant="outline" className="bg-surface/80 backdrop-blur-sm border-border">DEMO PREVIEW</Badge>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
