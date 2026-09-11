import { useHistoricalSearch } from "../api";
import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "../components/ui/Badge";

export function HistoricalIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useHistoricalSearch(query, query.length > 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchTerm);
  };

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Historical Intelligence</h2>
        <p className="text-text-secondary">Search historical events, formations, causes, and mitigations across offset wells.</p>
      </div>

      <div className="max-w-4xl mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search 'mud loss', 'stuck pipe', 'shale', 'cementing'..."
            className="w-full bg-surface border border-border rounded-lg py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg transition-all"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-primary-hover transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="space-y-4 max-w-4xl">
        {isLoading && <div className="text-text-secondary animate-pulse">Searching...</div>}
        
        {!isLoading && data?.results?.length === 0 && query && (
          <div className="text-text-secondary p-8 text-center bg-surface border border-border rounded-lg">
            No historical records found for "{query}".
          </div>
        )}

        {data?.results?.map((res: any, idx: number) => (
          <div key={idx} className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{res.type.toUpperCase()}</Badge>
                  <span className="text-sm font-bold text-foreground">{res.well_id}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{res.title}</h3>
              </div>
              <Badge variant={res.severity === 'HIGH' || res.severity === 'CRITICAL' ? 'danger' : res.severity === 'MEDIUM' ? 'warning' : 'success'}>
                {res.severity}
              </Badge>
            </div>
            
            <p className="text-text-secondary mb-4">{res.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background-light p-4 rounded border border-border-light">
               <div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">ROOT CAUSE</span>
                 <p className="text-sm text-text-primary">{res.root_cause}</p>
               </div>
               <div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1">MITIGATION</span>
                 <p className="text-sm text-text-primary">{res.mitigation}</p>
               </div>
            </div>
          </div>
        ))}
        
        {!query && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {["Mud Loss", "Stuck Pipe", "High Torque", "Kick"].map(term => (
              <div 
                key={term}
                onClick={() => { setSearchTerm(term); setQuery(term); }}
                className="bg-surface border border-border rounded p-4 text-center cursor-pointer hover:border-primary hover:text-primary transition-colors text-sm text-text-secondary font-medium"
              >
                {term}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
