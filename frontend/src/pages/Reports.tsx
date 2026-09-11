import { useState } from "react";
import { useReports, downloadWellReport } from "../api";
import { Search, FileText, Download, Filter } from "lucide-react";
import { Badge } from "../components/ui/Badge";

export function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const { data: reports, isLoading } = useReports(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchTerm);
  };

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Knowledge & Reports</h2>
        <p className="text-text-secondary">Search and download end-of-well reports, incident analyses, and formation evaluations.</p>
      </div>

      <div className="flex space-x-4 mb-8 max-w-4xl">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reports by title, type, or content..."
            className="w-full bg-surface border border-border rounded-lg py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </form>
        <button className="flex items-center space-x-2 bg-surface border border-border text-text-primary px-4 py-2 rounded shadow-sm hover:bg-surface-hover transition-colors">
          <Filter size={18} />
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {isLoading && <div className="text-text-secondary animate-pulse">Loading reports...</div>}
        
        {!isLoading && reports?.length === 0 && (
          <div className="text-text-secondary p-8 text-center bg-surface border border-border rounded-lg">
            No reports found matching your criteria.
          </div>
        )}

        {reports?.map((report: any) => (
          <div key={report.id} className="bg-surface border border-border rounded-lg p-5 shadow-sm hover:border-primary/30 transition-colors flex justify-between items-start group">
            <div className="flex space-x-4">
              <div className="mt-1 p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{report.title}</h3>
                  {report.well_id && <Badge variant="outline" className="border-border text-text-muted">{report.well_id}</Badge>}
                </div>
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">{report.extracted_text}</p>
                <div className="flex items-center space-x-4 text-xs text-text-muted">
                  <span className="font-bold uppercase tracking-widest text-text-secondary">{report.report_type}</span>
                  {report.report_date && <span>{new Date(report.report_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => report.well_id && downloadWellReport(report.well_id)}
              disabled={!report.well_id}
              className={`p-2 rounded border ${report.well_id ? 'border-border bg-surface hover:bg-surface-hover text-primary' : 'border-border/50 bg-surface/50 text-text-muted cursor-not-allowed'} transition-colors ml-4 shrink-0`}
              title={report.well_id ? "Download PDF Report" : "No PDF available for this report type"}
            >
              <Download size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
