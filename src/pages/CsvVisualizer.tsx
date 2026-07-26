// src/pages/CsvVisualizer.tsx
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Copy, Table as TableIcon, Database, FileSpreadsheet, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import { useTitle } from '@/hooks/use-title';
import { cn } from '@/lib/utils';


const CsvVisualizer = () => {
  const [csvInput, setCsvInput] = useState('');
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const { toast } = useToast();
  useTitle('CSV Visualizer');

  const parseCsv = () => {
    if (!csvInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please paste CSV data first',
      });
      return;
    }

    Papa.parse(csvInput.trim(), {
      skipEmptyLines: true,
      trimHeaders: true,
      transform: (value: string) => value.trim(),

      complete: (result) => {
        const rows = result.data as string[][];

        if (rows.length === 0) return;

        // Determine the correct number of columns from the header row
        const headerRow = rows[0];
        const maxColumns = headerRow.length;

        // Clean rows: remove trailing empty cells caused by trailing commas
        const cleanRows = rows.map(row => {
          // If row is longer than headers, trim it
          // If shorter, pad with empty strings
          const normalized = row.slice(0, maxColumns);
          while (normalized.length < maxColumns) {
            normalized.push('');
          }
          return normalized;
        });

        const parsedHeaders = cleanRows[0];
        const parsedData = cleanRows.slice(1);

        setHeaders(parsedHeaders);
        setData(parsedData);
        toast({ title: 'CSV parsed successfully!' });
      },

      error: () => {
        toast({
          variant: 'destructive',
          title: 'Parsing error',
          description: 'Failed to parse CSV data',
        });
      },
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const exportCsv = () => {
    const csv = Papa.unparse([headers, ...data]);
    setCsvInput(csv);
    toast({ title: 'CSV updated in the input field!' });
  };

  const handleCopy = async () => {
    const csv = Papa.unparse([headers, ...data]);
    await navigator.clipboard.writeText(csv);
    toast({ title: 'CSV copied to clipboard!' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      toast({ title: 'File uploaded successfully!' });
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-7xl pb-20 z-10">
        {/* Page Header */}
        <div className="flex justify-center">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
            CSV Visualizer
          </Badge>
        </div>

        <div className="grid gap-8">
          {/* Visualization Card */}
          {data.length > 0 && (
            <Card className="border-0 overflow-hidden rounded-3xl border border-[#E5DCCB] shadow-xl animate-in fade-in duration-500" style={{ background: '#FDFDFB' }}>
              <CardHeader className="px-8 pt-6 pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">

                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#2C241B' }}>Structural Preview</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(90,138,106,0.1)', color: '#5A8A6A', border: '1px solid rgba(90,138,106,0.25)' }}>{data.length} Records</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(91,127,166,0.1)', color: '#5B7FA6', border: '1px solid rgba(91,127,166,0.25)' }}>{headers.length} Columns</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="default" onClick={handleCopy} className="rounded-2xl px-5  text-xs font-bold uppercase tracking-widest border transition-all" >
                      <Copy className="mr-2 h-3.5 w-3.5" />Copy CSV
                    </Button>
                    <Button variant="default" onClick={exportCsv} className="rounded-2xl  px-5  text-xs font-bold uppercase tracking-widest border transition-all" >
                      <Download className="mr-2 h-3.5 w-3.5" />Sync to Input
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />
              <CardContent className="px-8 pb-8 pt-4 overflow-hidden">
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E3DAC9' }}>
                  <div className="overflow-auto max-h-[600px] custom-scrollbar">
                    <Table className="border-collapse">
                      <TableHeader className="sticky top-0 z-20" style={{ background: '#FAF9F5' }}>
                        <TableRow className="border-b h-12" style={{ borderColor: '#E3DAC9' }}>
                          {headers.map((header, index) => (
                            <TableHead key={index} className="font-bold uppercase tracking-[0.15em] text-[10px] px-6 min-w-[180px] border-r" style={{ color: '#8C7654', borderColor: '#E3DAC9' }}>
                              {header || '(EMPTY)'}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, rowIndex) => (
                          <TableRow key={rowIndex} className="border-b transition-colors hover:bg-[#FAF9F5]" style={{ borderColor: '#F0EAE0' }}>
                            {row.map((cell, colIndex) => (
                              <TableCell key={colIndex} className="p-0 border-r" style={{ borderColor: '#F0EAE0' }}>
                                <input
                                  value={cell}
                                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                  className="w-full h-11 border-0 shadow-none bg-transparent outline-none focus:outline-none ring-0 focus:ring-0 focus:bg-[#FAF9F5] px-6 font-mono text-sm transition-colors duration-150"
                                  style={{ color: '#2C241B' }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Input Card */}
          <Card className="border-0 overflow-hidden shadow-xl rounded-3xl border border-[#E3DAC9]" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
            <CardHeader className="px-8 pt-6 pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">

                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#2C241B' }}>Data Source</h2>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#A59582' }}>Paste raw CSV or upload a local file</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <div className="rounded-full px-5 h-10 flex items-center justify-center text-xs font-bold uppercase tracking-widest border transition-all hover:scale-105">
                      <Upload className="mr-2 h-3.5 w-3.5" />Upload Dataset
                    </div>
                  </label>
                  <Button variant='default' onClick={parseCsv} className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-md transition-all hover:scale-105">
                    Parse CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />
            <CardContent className="px-8 pb-8 pt-4">
              <Textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Paste raw CSV content here..."
                className="min-h-[220px] p-5 font-mono text-sm rounded-xl resize-none transition-all duration-300 placeholder:font-medium"
                style={{ background: 'rgba(44,36,27,0.02)', border: '1px solid #E3DAC9', color: '#2C241B' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CsvVisualizer;