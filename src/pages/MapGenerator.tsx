import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, FolderPen, Sparkles, Wand2, ArrowRightLeft, Database, ChevronDown, Check } from 'lucide-react';
import { useTitle } from '@/hooks/use-title';
import { cn } from '@/lib/utils';

const labelClasses = "text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C7654] block mb-1.5";

const DOCUMENT_TYPES = [
    { label: '810 | Invoice', value: 'invoice' },
    { label: '850 | Order', value: 'order' },
    { label: '855 | Order Ack', value: 'orderAck' },
    { label: '856 | Shipment', value: 'shipment' },
    { label: '860 | Order Change', value: 'orderChange' },
    { label: '870 | Order Status Report', value: 'orderStatusReport' },
    { label: '888 | Item Maintenance', value: 'itemMaintenance' },
    { label: '940 | Warehouse Shipping Order', value: 'warehouseShippingOrder' },
    { label: '943 | Warehouse Stock Transfer Shipment Advice', value: 'warehouseStockTransferShipmentAdvice' },
    { label: '944 | Warehouse Stock Transfer Receipt Advice', value: 'warehouseStockTransferReceiptAdvice' },
    { label: '945 | Warehouse Shipping Advice', value: 'warehouseShippingAdvice' },
    { label: '947 | Warehouse Inventory Adjustment Advice', value: 'warehouseInventoryAdjustmentAdvice' },
];


const FLOW_TYPES = [
    'RSXv7m7r0',
    'RSXv7m7r1',
    'RSXv7m7r2',
    'RSXv7m7r3',
    'RSXv7m7r4',
    'RSXv7m7r5',
    'RSXv7m7r6',
    'RSXv7m7r7',
    'RSXv7m7r8',
    'RSXv7m7r9',
    'FEDSv4010',
    'FEDSv4020',
    'FEDSv4030',
    'FEDSv5010',
    'FEDSv5030',
    'FEDSv5040',
    'FixedLength',
    'CSV',
    'SIPv7',
    'SIPv7m7r0',
    'SIPv7m7r1',
    'SIPv7m7r2',
    'SIPv7m7r3',
    'SIPv7m7r4',
    'SIPv7m7r5',
    'CommaDelimited',
    'XML',
    'JSON',
    'AsteriskDelimited',
    'PipeDelimited',
];

const MapGenerator = () => {
    const { toast } = useToast();
    const [mapType, setMapType] = useState<'osr' | 'formats'>('osr');
    const [hubId, setHubId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [fromFlow, setFromFlow] = useState('');
    const [toFlow, setToFlow] = useState('');
    const [generatedMap, setGeneratedMap] = useState('');
    useTitle('Map Name Generator');

    const generateMapName = () => {
        if (!vendorName || !documentType || !fromFlow || !toFlow) {
            toast({
                variant: 'destructive',
                title: 'Missing fields',
                description: 'Please fill in all required fields.',
            });
            return;
        }

        if (mapType === 'osr' && !hubId) {
            toast({
                variant: 'destructive',
                title: 'Missing Hub ID',
                description: 'Hub ID is required for OSR maps.',
            });
            return;
        }

        let mapName = '';
        if (mapType === 'osr') {
            // OSR<HUBID><VENDORNAME>.<DOCUMENT>.from<FROM>.to<TO>.write
            mapName = `OSR${hubId}${vendorName}.${documentType}.from${fromFlow}.to${toFlow}.write`;
        } else {
            // formats.<VENDORNAME>.<DOCUMENT>.from<FROM>.to<TO>.write
            mapName = `formats.${vendorName}.${documentType}.from${fromFlow}.to${toFlow}.write`;
        }

        setGeneratedMap(mapName);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedMap);
        toast({
            title: 'Copied!',
            description: 'Map name copied to clipboard.',
        });
    };

    const resetForm = () => {
        setHubId('');
        setVendorName('');
        setDocumentType('');
        setFromFlow('');
        setToFlow('');
        setGeneratedMap('');
    };

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-5xl pb-20 z-10">

                {/* Page Header */}
                <div className="flex justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        Map Name Generator
                    </Badge>
                </div>

                <div className="grid gap-8">
                    {/* Generated Result */}
                    {generatedMap && (
                        <Card className="border-0 overflow-hidden shadow-xl animate-in fade-in duration-500" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
                            <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #C5A880, #A8896A, #C5A880)' }} />
                            <CardHeader className="px-8 pt-6 pb-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold" style={{ color: '#2C241B' }}>Generated Identity</h2>
                                            <p className="text-[10px] font-medium mt-0.5" style={{ color: '#A59582' }}>Ready for system deployment</p>
                                        </div>
                                    </div>
                                    <Button onClick={copyToClipboard} className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-md transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)', color: '#2C241B' }}>
                                        <Copy className="mr-2 h-3.5 w-3.5" />Copy System Path
                                    </Button>
                                </div>
                            </CardHeader>
                            <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />
                            <CardContent className="px-8 pb-8 pt-5">
                                <div className="rounded-xl p-6 relative" style={{ background: 'rgba(44,36,27,0.02)', border: '1px solid #E3DAC9' }}>
                                    <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A59582' }}>System Identifier</p>
                                    <p className="font-mono text-base md:text-lg font-bold break-all" style={{ color: '#2C241B' }}>{generatedMap}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Generator Configuration */}
                    <Card className="border-0 overflow-hidden shadow-xl" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
                        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #C5A880, #A8896A, #C5A880)' }} />
                        <CardHeader className="px-8 pt-6 pb-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: '#2C241B' }}>Configuration</h2>
                                    <p className="text-[10px] font-medium mt-0.5" style={{ color: '#A59582' }}>Define architectural parameters for name generation</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" onClick={resetForm} className="rounded-full px-5 h-9 text-xs font-bold uppercase tracking-widest border transition-all" style={{ color: '#C0392B', borderColor: '#E3DAC9' }}>
                                        <RefreshCw className="mr-2 h-3.5 w-3.5" />Reset
                                    </Button>
                                    <Button onClick={generateMapName} className="rounded-full px-6 h-9 text-xs font-bold uppercase tracking-widest border-0 shadow-md transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)', color: '#2C241B' }}>
                                        <Sparkles className="mr-2 h-3.5 w-3.5" />Construct Name
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />
                        <CardContent className="px-8 pb-8 pt-6">
                            <div className="grid gap-8">
                                {/* Map Type */}
                                <div className="space-y-3">
                                    <Label className={labelClasses}>Map Architecture</Label>
                                    <RadioGroup
                                        value={mapType}
                                        onValueChange={(value: 'osr' | 'formats') => { setMapType(value); setGeneratedMap(''); }}
                                        className="flex flex-wrap gap-3"
                                    >
                                        {(['osr', 'formats'] as const).map(v => (
                                            <div key={v} className={cn(
                                                "flex items-center gap-2.5 rounded-full border px-5 py-3 cursor-pointer transition-all",
                                                mapType === v ? "shadow-sm" : ""
                                            )} style={mapType === v ? { background: 'rgba(197,168,128,0.1)', borderColor: '#C5A880' } : { background: '#FDFDFB', borderColor: '#E3DAC9' }}>
                                                <RadioGroupItem value={v} id={v} className="border-[#C5A880] text-[#C5A880]" />
                                                <Label htmlFor={v} className="cursor-pointer font-semibold text-sm" style={{ color: '#2C241B' }}>
                                                    {v === 'osr' ? 'OSR Model' : 'Formats Model'}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="grid gap-8 md:grid-cols-2">
                                    {/* Hub ID & Vendor & Document */}
                                    <div className="space-y-5">
                                        {mapType === 'osr' && (
                                            <div className="space-y-1.5">
                                                <Label htmlFor="hubId" className={labelClasses}>Hub Blueprint ID</Label>
                                                <div className="relative group/field">
                                                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                    <Input id="hubId" value={hubId} onChange={(e) => setHubId(e.target.value)} placeholder="e.g., HUB001"
                                                        className="pl-11 pr-4 h-11 rounded-md border bg-white/40 focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                                                        style={{ borderColor: '#E3DAC9', color: '#2C241B' }} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="vendorName" className={labelClasses}>Vendor Entity</Label>
                                            <div className="relative group/field">
                                                <FolderPen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g., AMAZON"
                                                    className="pl-11 pr-4 h-11 rounded-md border bg-white/40 focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                                                    style={{ borderColor: '#E3DAC9', color: '#2C241B' }} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClasses}>Document Structure</Label>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-medium transition-all focus:outline-none focus:border-[#C5A880]"
                                                        style={{ background: 'white', borderColor: '#E3DAC9', color: documentType ? '#2C241B' : '#A59582' }}>
                                                        <span>{DOCUMENT_TYPES.find(d => d.value === documentType)?.label || 'Select document protocol'}</span>
                                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1" style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}>
                                                    {DOCUMENT_TYPES.map((doc) => (
                                                        <DropdownMenuItem key={doc.value} onClick={() => setDocumentType(doc.value)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm" style={{ color: '#2C241B' }}>
                                                            {doc.label}
                                                            {documentType === doc.value && <Check className="w-3.5 h-3.5" style={{ color: '#C5A880' }} />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Flow Direction */}
                                    <div className="space-y-5 rounded-xl p-6" style={{ background: 'rgba(197,168,128,0.04)', border: '1px solid #E3DAC9' }}>
                                        <div className="flex items-center gap-2">
                                            <ArrowRightLeft className="w-4 h-4" style={{ color: '#C5A880' }} />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#8C7654' }}>Flow Direction</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClasses}>Source Origin</Label>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-mono transition-all focus:outline-none focus:border-[#C5A880]"
                                                        style={{ background: 'white', borderColor: '#E3DAC9', color: fromFlow ? '#2C241B' : '#A59582' }}>
                                                        <span>{fromFlow || 'Select source flow'}</span>
                                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1" style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}>
                                                    {FLOW_TYPES.map((flow) => (
                                                        <DropdownMenuItem key={flow} onClick={() => setFromFlow(flow)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-mono" style={{ color: '#2C241B' }}>
                                                            {flow}
                                                            {fromFlow === flow && <Check className="w-3.5 h-3.5" style={{ color: '#C5A880' }} />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClasses}>Target Destination</Label>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-mono transition-all focus:outline-none focus:border-[#C5A880]"
                                                        style={{ background: 'white', borderColor: '#E3DAC9', color: toFlow ? '#2C241B' : '#A59582' }}>
                                                        <span>{toFlow || 'Select target flow'}</span>
                                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1" style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}>
                                                    {FLOW_TYPES.map((flow) => (
                                                        <DropdownMenuItem key={flow} onClick={() => setToFlow(flow)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-mono" style={{ color: '#2C241B' }}>
                                                            {flow}
                                                            {toFlow === flow && <Check className="w-3.5 h-3.5" style={{ color: '#C5A880' }} />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MapGenerator;