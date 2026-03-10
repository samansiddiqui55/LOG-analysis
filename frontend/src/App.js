import { useState, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Upload, 
  FileSpreadsheet, 
  BarChart3, 
  LineChart, 
  FileText, 
  Download, 
  Sun, 
  Moon, 
  Zap,
  AlertCircle,
  AlertTriangle,
  Info,
  Activity,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [isDark, setIsDark] = useState(true);
  const [logData, setLogData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chartType, setChartType] = useState("line");

  // Toggle theme
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark", !isDark);
  };

  // Initialize dark mode
  useState(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setLogData(response.data);
      setSummary(null);
      toast.success(`Loaded ${response.data.logs.length} log entries`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Load demo data
  const loadDemoData = async () => {
    setIsUploading(true);
    try {
      const response = await axios.get(`${API}/demo-data`);
      setLogData(response.data);
      setSummary(null);
      toast.success("Demo data loaded successfully");
    } catch (error) {
      console.error("Demo data error:", error);
      toast.error("Failed to load demo data");
    } finally {
      setIsUploading(false);
    }
  };

  // Generate AI summary
  const generateSummary = async () => {
    if (!logData) {
      toast.error("Please upload log data first");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await axios.post(`${API}/generate-summary`, {
        log_data_id: logData.id
      });
      setSummary(response.data);
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error("Summary error:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Process log data for charts
  const getChartData = () => {
    if (!logData?.logs) return [];

    const timeGroups = {};
    logData.logs.forEach(log => {
      const time = log.log_stamp.split(" ")[1]?.substring(0, 5) || log.log_stamp;
      if (!timeGroups[time]) {
        timeGroups[time] = { time, ERROR: 0, WARNING: 0, INFO: 0 };
      }
      const type = log.log_type.toUpperCase();
      if (timeGroups[time][type] !== undefined) {
        timeGroups[time][type]++;
      }
    });

    return Object.values(timeGroups).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Get log type counts for bar chart
  const getLogTypeCounts = () => {
    if (!logData?.logs) return [];
    
    const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
    logData.logs.forEach(log => {
      const type = log.log_type.toUpperCase();
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return [
      { name: "ERROR", count: counts.ERROR, fill: "hsl(4, 90%, 58%)" },
      { name: "WARNING", count: counts.WARNING, fill: "hsl(38, 92%, 50%)" },
      { name: "INFO", count: counts.INFO, fill: "hsl(211, 100%, 50%)" }
    ];
  };

  // Export summary as text
  const exportAsText = () => {
    if (!summary) {
      toast.error("Generate a summary first");
      return;
    }

    const content = `LOG ANALYSIS REPORT
==================

Total Logs: ${summary.total_logs}
Errors: ${summary.error_count}
Warnings: ${summary.warning_count}
Info: ${summary.info_count}

AI SUMMARY
----------
${summary.summary}

Generated: ${new Date().toLocaleString()}
`;
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "log-analysis-report.txt");
    toast.success("Report exported as text");
  };

  // Export summary as PDF
  const exportAsPDF = () => {
    if (!summary) {
      toast.error("Generate a summary first");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 122, 255);
    doc.text("LOG ANALYSIS REPORT", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Statistics", 20, 45);
    
    doc.setFontSize(11);
    doc.text(`Total Logs: ${summary.total_logs}`, 25, 55);
    doc.setTextColor(239, 68, 68);
    doc.text(`Errors: ${summary.error_count}`, 25, 63);
    doc.setTextColor(245, 158, 11);
    doc.text(`Warnings: ${summary.warning_count}`, 25, 71);
    doc.setTextColor(0, 122, 255);
    doc.text(`Info: ${summary.info_count}`, 25, 79);
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("AI Summary", 20, 95);
    
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(summary.summary, 170);
    doc.text(splitText, 20, 105);
    
    doc.save("log-analysis-report.pdf");
    toast.success("Report exported as PDF");
  };

  // Get log type icon
  const getLogIcon = (type) => {
    switch (type.toUpperCase()) {
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-background text-foreground noise-overlay relative">
        <Toaster position="top-right" theme={isDark ? "dark" : "light"} richColors />
        
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 glow-primary">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight" data-testid="app-title">
                  LOG INSIGHT
                </h1>
                <p className="text-xs text-muted-foreground">System Log Analyzer</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="theme-toggle-btn"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Upload Section */}
          <section className="mb-8">
            <div
              className={`drop-zone p-8 text-center cursor-pointer ${isDragOver ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("file-input").click()}
              data-testid="file-drop-zone"
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                data-testid="file-input"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Processing file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Drop your Excel file here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports .xlsx and .xls files with columns: log type, log stamp, log summary
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 justify-center">
              <Button
                onClick={loadDemoData}
                variant="outline"
                className="gap-2"
                disabled={isUploading}
                data-testid="load-demo-btn"
              >
                <Zap className="w-4 h-4" />
                Load Demo Data
              </Button>
              
              {logData && (
                <Button
                  onClick={generateSummary}
                  className="gap-2 glow-primary"
                  disabled={isGeneratingSummary}
                  data-testid="generate-summary-btn"
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate AI Summary
                </Button>
              )}
            </div>
          </section>

          {/* Stats Cards */}
          {logData && (
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
              <Card className="stats-card bg-card border-border" data-testid="total-logs-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Logs</p>
                      <p className="text-2xl font-black mt-1">{logData.logs.length}</p>
                    </div>
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card bg-card border-border" data-testid="errors-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Errors</p>
                      <p className="text-2xl font-black mt-1 text-destructive">
                        {logData.logs.filter(l => l.log_type.toUpperCase() === "ERROR").length}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-destructive/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card bg-card border-border" data-testid="warnings-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Warnings</p>
                      <p className="text-2xl font-black mt-1 text-warning">
                        {logData.logs.filter(l => l.log_type.toUpperCase() === "WARNING").length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-warning/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="stats-card bg-card border-border" data-testid="info-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Info</p>
                      <p className="text-2xl font-black mt-1 text-primary">
                        {logData.logs.filter(l => l.log_type.toUpperCase() === "INFO").length}
                      </p>
                    </div>
                    <Info className="w-8 h-8 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Dashboard Grid */}
          {logData && (
            <div className="dashboard-grid">
              {/* Chart Section */}
              <Card className="bg-card border-border animate-slide-up" data-testid="chart-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight">
                      Error Visualization
                    </CardTitle>
                    <Tabs value={chartType} onValueChange={setChartType} className="w-auto">
                      <TabsList className="h-8">
                        <TabsTrigger value="line" className="text-xs px-3" data-testid="line-chart-tab">
                          <LineChart className="w-3 h-3 mr-1" />
                          Line
                        </TabsTrigger>
                        <TabsTrigger value="bar" className="text-xs px-3" data-testid="bar-chart-tab">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Bar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="chart-container">
                    {chartType === "line" ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getChartData()}>
                          <defs>
                            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(4, 90%, 58%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(4, 90%, 58%)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="infoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="ERROR" 
                            stroke="hsl(4, 90%, 58%)" 
                            fill="url(#errorGradient)" 
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="WARNING" 
                            stroke="hsl(38, 92%, 50%)" 
                            fill="url(#warningGradient)" 
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="INFO" 
                            stroke="hsl(211, 100%, 50%)" 
                            fill="url(#infoGradient)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={getLogTypeCounts()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {getLogTypeCounts().map((entry, index) => (
                              <rect key={index} fill={entry.fill} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Log Viewer */}
              <Card className="bg-card border-border animate-slide-up" style={{ animationDelay: "0.1s" }} data-testid="log-viewer-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Log Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] rounded-md border border-border bg-background/50">
                    <div className="log-viewer p-2">
                      {logData.logs.map((log, index) => (
                        <div
                          key={index}
                          className={`log-entry ${log.log_type.toLowerCase()}`}
                          data-testid={`log-entry-${index}`}
                        >
                          <div className="flex items-start gap-2">
                            {getLogIcon(log.log_type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-0.5">
                                <span className={`font-semibold ${
                                  log.log_type.toUpperCase() === "ERROR" ? "text-destructive" :
                                  log.log_type.toUpperCase() === "WARNING" ? "text-warning" : "text-primary"
                                }`}>
                                  {log.log_type}
                                </span>
                                <span>•</span>
                                <span>{log.log_stamp}</span>
                              </div>
                              <p className="text-foreground/90 break-words">{log.log_summary}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Summary Section */}
          {summary && (
            <section className="mt-8 animate-fade-in">
              <Card className="bg-card border-border" data-testid="summary-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Analysis Report
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsText}
                        className="gap-2"
                        data-testid="export-text-btn"
                      >
                        <FileText className="w-4 h-4" />
                        Export Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportAsPDF}
                        className="gap-2"
                        data-testid="export-pdf-btn"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Analyzed</p>
                      <p className="text-xl font-bold mt-1">{summary.total_logs}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Errors</p>
                      <p className="text-xl font-bold mt-1 text-destructive">{summary.error_count}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Warnings</p>
                      <p className="text-xl font-bold mt-1 text-warning">{summary.warning_count}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Info Logs</p>
                      <p className="text-xl font-bold mt-1 text-primary">{summary.info_count}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-lg bg-muted/30 border border-border">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Mission Report
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed" data-testid="summary-content">
                        {summary.summary}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Empty State */}
          {!logData && (
            <div className="text-center py-16">
              <div className="p-6 rounded-full bg-muted/30 inline-block mb-4">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Data Loaded</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload an Excel file with your log data or click "Load Demo Data" to see the dashboard in action.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-6 mt-12">
          <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
            <p>Log Insight Viewer • System Log Analysis Dashboard</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
