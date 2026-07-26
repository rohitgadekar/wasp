import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Hash, Info, Command } from 'lucide-react';
import { useTitle } from '@/hooks/use-title';

interface EDIDoc {
    code: string;
    id: string;
    description: string;
}

const EDI_DOCUMENTS: EDIDoc[] = [
    { code: '100', id: 'PG', description: 'Insurance Plan Description' },
    { code: '101', id: 'NL', description: 'Name and Address Lists' },
    { code: '104', id: 'SA', description: 'Air Shipment Information' },
    { code: '105', id: 'BF', description: 'Business Entity Filings' },
    { code: '106', id: 'MH', description: 'Motor Carrier Rate Proposal' },
    { code: '107', id: 'MC', description: 'Request for Motor Carrier Rate Proposal' },
    { code: '108', id: 'MK', description: 'Response to a Motor Carrier Rate Proposal' },
    { code: '109', id: 'VE', description: 'Vessel Content Details' },
    { code: '110', id: 'IA', description: 'Air Freight Details and Invoice' },
    { code: '112', id: 'PQ', description: 'Property Damage Report' },
    { code: '120', id: 'VC', description: 'Vehicle Shipping Order' },
    { code: '121', id: 'VS', description: 'Vehicle Service' },
    { code: '124', id: 'VD', description: 'Vehicle Damage' },
    { code: '125', id: 'MR', description: 'Multilevel Railcar Load Details' },
    { code: '126', id: 'VA', description: 'Vehicle Application Advice' },
    { code: '127', id: 'VB', description: 'Vehicle Baying Order' },
    { code: '128', id: 'DI', description: 'Dealer Information' },
    { code: '129', id: 'VH', description: 'Vehicle Carrier Rate Update' },
    { code: '130', id: 'ED', description: 'Student Educational Record (Transcript)' },
    { code: '131', id: 'AK', description: 'Student Educational Record (Transcript) Acknowledgment' },
    { code: '135', id: 'SL', description: 'Student Loan Application' },
    { code: '138', id: 'TT', description: 'Testing Results Request and Report' },
    { code: '139', id: 'SL', description: 'Student Loan Guarantee Result' },
    { code: '140', id: 'WA', description: 'Product Registration' },
    { code: '141', id: 'WA', description: 'Product Service Claim Response' },
    { code: '142', id: 'WA', description: 'Product Service Claim' },
    { code: '143', id: 'WA', description: 'Product Service Notification' },
    { code: '144', id: 'LT', description: 'Student Loan Transfer and Status Verification' },
    { code: '146', id: 'RY', description: 'Request for Student Educational Record (Transcript)' },
    { code: '147', id: 'RZ', description: 'Response to Request for Student Educational Record (Transcript)' },
    { code: '148', id: 'IJ', description: 'Report of Injury' },
    { code: '149', id: 'NT', description: 'Notice of Tax Adjustment or Assessment' },
    { code: '150', id: 'TN', description: 'Tax Rate Notification' },
    { code: '151', id: 'TA', description: 'Electronic Filing of Tax Return Data Acknowledgment' },
    { code: '152', id: 'GR', description: 'Statistical Government Information' },
    { code: '153', id: 'CB', description: 'Unemployment Insurance Tax Claim or Charge Information' },
    { code: '154', id: 'UC', description: 'Uniform Commercial Code Filing' },
    { code: '155', id: 'BC', description: 'Business Credit Report' },
    { code: '157', id: 'NP', description: 'Notice of Power of Attorney' },
    { code: '159', id: 'MP', description: 'Motion Picture Booking Confirmation' },
    { code: '160', id: 'SJ', description: 'Transportation Automatic Equipment Identification' },
    { code: '161', id: 'TR', description: 'Train Sheet' },
    { code: '163', id: 'AS', description: 'Transportation Appointment Schedule Information' },
    { code: '170', id: 'ER', description: 'Revenue Receipts Statement' },
    { code: '175', id: 'FC', description: 'Court and Law Enforcement Notice' },
    { code: '176', id: 'FC', description: 'Court Submission' },
    { code: '180', id: 'AN', description: 'Return Merchandise Authorization and Notification' },
    { code: '185', id: 'RD', description: 'Royalty Regulatory Report' },
    { code: '186', id: 'UW', description: 'Insurance Underwriting Requirements Reporting' },
    { code: '188', id: 'EC', description: 'Educational Course Inventory' },
    { code: '189', id: 'AF', description: 'Application for Admission to Educational Institutions' },
    { code: '190', id: 'SV', description: 'Student Enrollment Verification' },
    { code: '191', id: 'SD', description: 'Student Loan Pre-Claims and Claims' },
    { code: '194', id: 'GT', description: 'Grant or Assistance Application' },
    { code: '195', id: 'LA', description: 'FCC License Application' },
    { code: '196', id: 'PK', description: 'Contractor Cost Data Reporting' },
    { code: '197', id: 'TO', description: 'Real Estate Title Evidence' },
    { code: '198', id: 'ME', description: 'Loan Verification Information' },
    { code: '199', id: 'TO', description: 'Real Estate Settlement Information' },
    { code: '200', id: 'ME', description: 'Mortgage Credit Report' },
    { code: '201', id: 'ME', description: 'Residential Loan Application' },
    { code: '202', id: 'MJ', description: 'Secondary Mortgage Market Loan Delivery' },
    { code: '203', id: 'MH', description: 'Secondary Mortgage Market Investor Report' },
    { code: '204', id: 'SM', description: 'Motor Carrier Load Tender' },
    { code: '205', id: 'MN', description: 'Mortgage Note' },
    { code: '206', id: 'MG', description: 'Real Estate Inspection' },
    { code: '210', id: 'IM', description: 'Motor Carrier Freight Details and Invoice' },
    { code: '211', id: 'BL', description: 'Motor Carrier Bill of Lading' },
    { code: '212', id: 'TM', description: 'Motor Carrier Delivery Trailer Manifest' },
    { code: '213', id: 'MI', description: 'Motor Carrier Shipment Status Inquiry' },
    { code: '214', id: 'QM', description: 'Transportation Carrier Shipment Status Message' },
    { code: '215', id: 'UP', description: 'Motor Carrier Pick-up Manifest' },
    { code: '216', id: 'PU', description: 'Motor Carrier Shipment Pick-up Notification' },
    { code: '217', id: 'FG', description: 'Motor Carrier Loading and Route Guide' },
    { code: '218', id: 'FH', description: 'Motor Carrier Tariff Information' },
    { code: '219', id: 'AB', description: 'Logistics Service Request' },
    { code: '220', id: 'AH', description: 'Logistics Service Response' },
    { code: '222', id: 'CE', description: 'Cartage Work Assignment' },
    { code: '223', id: 'MQ', description: 'Consolidators Freight Bill and Invoice' },
    { code: '224', id: 'MA', description: 'Motor Carrier Summary Freight Bill Manifest' },
    { code: '225', id: 'MY', description: 'Response to a Cartage Work Assignment' },
    { code: '242', id: 'DS', description: 'Data Status Tracking' },
    { code: '244', id: 'PN', description: 'Product Source Information' },
    { code: '248', id: 'SU', description: 'Account Assignment/Inquiry and Service/Status' },
    { code: '249', id: 'AT', description: 'Animal Toxicological Data' },
    { code: '250', id: 'PV', description: 'Purchase Order Shipment Management Document' },
    { code: '251', id: 'CP', description: 'Pricing Support' },
    { code: '252', id: 'IE', description: 'Insurance Producer Administration' },
    { code: '255', id: 'UI', description: 'Underwriting Information Services' },
    { code: '256', id: 'PE', description: 'Periodic Compensation' },
    { code: '260', id: 'MG', description: 'Application for Mortgage Insurance Benefits' },
    { code: '261', id: 'ME', description: 'Real Estate Information Request' },
    { code: '262', id: 'ME', description: 'Real Estate Information Report' },
    { code: '263', id: 'ME', description: 'Residential Mortgage Insurance Application Response' },
    { code: '264', id: 'MG', description: 'Mortgage Loan Default Status' },
    { code: '265', id: 'TO', description: 'Real Estate Title Insurance Services Order' },
    { code: '266', id: 'MG', description: 'Mortgage or Property Record Change Notification' },
    { code: '267', id: 'IL', description: 'Individual Life' },
    { code: '268', id: 'PF', description: 'Annuity Activity' },
    { code: '270', id: 'HS', description: 'Eligibility' },
    { code: '271', id: 'HB', description: 'Eligibility' },
    { code: '272', id: 'LN', description: 'Property and Casualty Loss Notification' },
    { code: '273', id: 'ID', description: 'Insurance/Annuity Application Status' },
    { code: '274', id: '', description: 'Health Care Provider Information' },
    { code: '275', id: 'PI', description: 'Patient Information' },
    { code: '276', id: 'HR', description: 'Health Care Claim Status Request' },
    { code: '277', id: 'HN', description: 'Health Care Claim Status Notification' },
    { code: '278', id: 'HI', description: 'Health Care Services Review Information' },
    { code: '280', id: 'VI', description: 'Voter Registration Information' },
    { code: '285', id: 'CV', description: 'Commercial Vehicle Safety and Credentials Information Exchange' },
    { code: '286', id: 'KM', description: 'Commercial Vehicle Credentials' },
    { code: '288', id: 'WI', description: 'Wage Determination' },
    { code: '290', id: 'CO', description: 'Cooperative Advertising Agreements' },
    { code: '300', id: 'RO', description: 'Reservation (Booking Request) (Ocean)' },
    { code: '301', id: 'RO', description: 'Confirmation (Ocean)' },
    { code: '303', id: 'RO', description: 'Booking Cancellation (Ocean)' },
    { code: '304', id: 'SO', description: 'Shipping Instructions' },
    { code: '309', id: 'SO', description: 'U.S. Customs Manifest' },
    { code: '310', id: 'IO', description: 'Freight Receipt and Invoice (Ocean)' },
    { code: '311', id: 'SO', description: 'Canadian Customs Information' },
    { code: '312', id: 'IO', description: 'Arrival Notice (Ocean)' },
    { code: '313', id: 'QO', description: 'Shipment Status Inquiry (Ocean)' },
    { code: '315', id: 'QO', description: 'Status Details (Ocean) Illness or Incident' },
    { code: '317', id: 'SO', description: 'Delivery/Pickup Order' },
    { code: '319', id: 'SO', description: 'Terminal Information' },
    { code: '322', id: 'SO', description: 'Terminal Operations and Intermodal Ramp Activity' },
    { code: '323', id: 'SO', description: 'Vessel Schedule and Itinerary (Ocean)' },
    { code: '324', id: 'SO', description: 'Vessel Stow Plan (Ocean)' },
    { code: '325', id: 'SO', description: 'Consolidation of Goods in Container — Coverage/Benefit Inquiry' },
    { code: '326', id: 'SO', description: 'Consignment Summary List — Coverage/Benefit Info' },
    { code: '350', id: 'SO', description: 'U.S. Customs Status Information' },
    { code: '352', id: 'SO', description: 'U.S. Customs Carrier General Order Status' },
    { code: '353', id: 'SO', description: 'U.S. Customs Events Advisory Details' },
    { code: '354', id: 'SO', description: 'U.S. Customs Automated Manifest Archive Status' },
    { code: '355', id: 'SO', description: 'U.S. Customs Acceptance/Rejection' },
    { code: '356', id: 'SO', description: 'U.S. Customs Permit to Transfer Request' },
    { code: '357', id: 'SO', description: 'U.S. Customs In-Bond Information' },
    { code: '358', id: 'SO', description: 'U.S. Customs Consist Information' },
    { code: '361', id: 'SO', description: 'Carrier Interchange Agreement (Ocean)' },
    { code: '362', id: 'OC', description: 'Cargo Insurance Advice of Shipment' },
    { code: '404', id: 'SR', description: 'Rail Carrier Shipment Information' },
    { code: '410', id: 'IR', description: 'Rail Carrier Freight Details and Invoice' },
    { code: '412', id: '', description: 'Trailer or Container Repair Billing' },
    { code: '414', id: 'CR', description: 'Rail Carhire Settlements' },
    { code: '417', id: 'WB', description: 'Rail Carrier Waybill Interchange' },
    { code: '418', id: 'IC', description: 'Rail Advance Interchange Consist' },
    { code: '419', id: 'SR', description: 'Advance Car Disposition' },
    { code: '420', id: 'CH', description: 'Car Handling Information' },
    { code: '421', id: 'IS', description: 'Estimated Time of Arrival and Car Scheduling' },
    { code: '422', id: 'DM', description: 'Shipper\'s Car Order' },
    { code: '423', id: 'RL', description: 'Rail Industrial Switch List' },
    { code: '425', id: 'WT', description: 'Rail Waybill Request Response or Confirmation' },
    { code: '426', id: 'RW', description: 'Rail Revenue Waybill' },
    { code: '429', id: 'RU', description: 'Railroad Retirement Activity' },
    { code: '431', id: 'RM', description: 'Railroad Station Master File' },
    { code: '432', id: 'RX', description: 'Rail Deprescription' },
    { code: '433', id: 'RH', description: 'Railroad Reciprocal Switch File' },
    { code: '434', id: 'RJ', description: 'Railroad Mark Register Update Activity' },
    { code: '435', id: 'RK', description: 'Standard Transportation Commodity Code Master' },
    { code: '436', id: 'LI', description: 'Locomotive Information' },
    { code: '437', id: 'RV', description: 'Railroad Junctions and Interchanges Activity' },
    { code: '440', id: 'WR', description: 'Shipment Weights' },
    { code: '451', id: 'EV', description: 'Railroad Event Report' },
    { code: '452', id: 'PL', description: 'Railroad Problem Log Inquiry or Advice' },
    { code: '453', id: 'ST', description: 'Railroad Service Commitment Advice' },
    { code: '455', id: 'PB', description: 'Railroad Parameter Trace Registration' },
    { code: '456', id: 'EI', description: 'Railroad Equipment Inquiry or Advice' },
    { code: '460', id: 'TP', description: 'Railroad Price Distribution Request or Response' },
    { code: '463', id: 'TP', description: 'Rail Rate Reply' },
    { code: '466', id: 'TP', description: 'Rate Request' },
    { code: '468', id: 'TP', description: 'Rate Docket Journal Log' },
    { code: '470', id: 'RB', description: 'Railroad Clearance' },
    { code: '475', id: 'SN', description: 'Rail Route File Maintenance' },
    { code: '485', id: 'TP', description: 'Ratemaking Action' },
    { code: '486', id: 'TP', description: 'Rate Docket Expiration' },
    { code: '490', id: 'TP', description: 'Rate Group Definition' },
    { code: '492', id: 'TP', description: 'Miscellaneous Rates' },
    { code: '494', id: 'TP', description: 'Rail Scale Rates' },
    { code: '500', id: 'MM', description: 'Medical Event Reporting' },
    { code: '501', id: 'WG', description: 'Vendor Performance Review' },
    { code: '503', id: 'PH', description: 'Pricing History' },
    { code: '504', id: 'CC', description: 'Clauses and Provisions' },
    { code: '511', id: 'RN', description: 'Requisition' },
    { code: '517', id: 'MV', description: 'Material Obligation Validation' },
    { code: '521', id: 'AO', description: 'Income or Asset Offset' },
    { code: '527', id: 'MD', description: 'Material Due-In and Receipt' },
    { code: '536', id: 'LR', description: 'Logistics Reassignment' },
    { code: '540', id: 'ES', description: 'Notice of Employment Status' },
    { code: '561', id: 'D4', description: 'Contract Abstract' },
    { code: '567', id: 'D3', description: 'Contract Completion Status' },
    { code: '568', id: 'D5', description: 'Contract Payment Management Report' },
    { code: '601', id: 'SE', description: 'U.S. Customs Export Shipment Information' },
    { code: '602', id: 'TS', description: 'Transportation Services Tender' },
    { code: '620', id: 'EX', description: 'Excavation Communication' },
    { code: '625', id: 'WL', description: 'Well Information' },
    { code: '650', id: 'MO', description: 'Maintenance Service Order' },
    { code: '715', id: 'GL', description: 'Intermodal Group Loading Plan' },
    { code: '805', id: 'CP', description: 'Contract Pricing Proposal' },
    { code: '806', id: 'PJ', description: 'Project Schedule Reporting' },
    { code: '810', id: 'IN', description: 'Invoice' },
    { code: '811', id: 'CI', description: 'Consolidated Service Invoice/Statement' },
    { code: '812', id: 'CD', description: 'Credit/Debit Adjustment' },
    { code: '813', id: 'TF', description: 'Electronic Filing of Tax Return Data' },
    { code: '814', id: 'GE', description: 'General Request' },
    { code: '815', id: 'CS', description: 'Cryptographic Service Message' },
    { code: '816', id: 'OR', description: 'Organizational Relationships' },
    { code: '818', id: 'RP', description: 'Commission Sales Report' },
    { code: '819', id: 'IN', description: 'Operating Expense Statement' },
    { code: '820', id: 'RA', description: 'Payment Order/Remittance Advice' },
    { code: '821', id: 'FR', description: 'Financial Information Reporting' },
    { code: '822', id: 'AA', description: 'Account Analysis' },
    { code: '823', id: 'LB', description: 'Lockbox' },
    { code: '824', id: 'AG', description: 'Application Advice' },
    { code: '826', id: 'TI', description: 'Tax Information Exchange' },
    { code: '827', id: 'FR', description: 'Financial Return Notice' },
    { code: '828', id: 'DA', description: 'Debit Authorization' },
    { code: '829', id: 'PY', description: 'Payment Cancellation Request' },
    { code: '830', id: 'PS', description: 'Planning Schedule with Release Capability' },
    { code: '831', id: 'CT', description: 'Application Control Totals' },
    { code: '832', id: 'SC', description: 'Price/Sales Catalog' },
    { code: '833', id: 'ME', description: 'Mortgage Credit Report Order' },
    { code: '834', id: 'BE', description: 'Benefit Enrollment and Maintenance' },
    { code: '835', id: 'HP', description: 'Health Care Claim Payment/Advice' },
    { code: '836', id: 'RQ', description: 'Procurement Notices' },
    { code: '837', id: 'HC', description: 'Health Care Claim' },
    { code: '838', id: 'TD', description: 'Trading Partner Profile' },
    { code: '839', id: 'PK', description: 'Project Cost Reporting' },
    { code: '840', id: 'RQ', description: 'Request for Quotation' },
    { code: '841', id: 'SP', description: 'Specifications/Technical Information' },
    { code: '842', id: 'NC', description: 'Nonconformance Report' },
    { code: '843', id: 'RR', description: 'Response to Request for Quotation' },
    { code: '844', id: 'CF', description: 'Product Transfer Account Adjustment' },
    { code: '845', id: 'PA', description: 'Price Authorization Acknowledgment/Status' },
    { code: '846', id: 'IB', description: 'Inventory Inquiry/Advice' },
    { code: '847', id: 'MX', description: 'Material Claim' },
    { code: '848', id: 'MS', description: 'Material Safety Data Sheet' },
    { code: '849', id: 'CF', description: 'Response to Product Transfer Account Adjustment' },
    { code: '850', id: 'PO', description: 'Purchase Order' },
    { code: '851', id: 'LS', description: 'Asset Schedule' },
    { code: '852', id: 'PD', description: 'Product Activity Data' },
    { code: '853', id: 'RI', description: 'Routing and Carrier Instruction' },
    { code: '854', id: 'DD', description: 'Shipment Delivery Discrepancy Information' },
    { code: '855', id: 'PR', description: 'Purchase Order Acknowledgment' },
    { code: '856', id: 'SH', description: 'Ship Notice/Manifest' },
    { code: '857', id: 'BS', description: 'Shipment and Billing Notice' },
    { code: '858', id: 'SI', description: 'Shipment Information' },
    { code: '859', id: 'FB', description: 'Freight Invoice' },
    { code: '860', id: 'PC', description: 'Purchase Order Change Request - Buyer Initiated' },
    { code: '861', id: 'RC', description: 'Receiving Advice/Acceptance Certificate' },
    { code: '862', id: 'SS', description: 'Shipping Schedule' },
    { code: '863', id: 'RT', description: 'Report of Test Results' },
    { code: '864', id: 'TX', description: 'Text Message' },
    { code: '865', id: 'CA', description: 'Purchase Order Change Acknowledgment/Request - Seller Initiated' },
    { code: '866', id: 'SQ', description: 'Production Sequence' },
    { code: '867', id: 'PT', description: 'Product Transfer and Resale Report' },
    { code: '868', id: 'MT', description: 'Electronic Form Structure' },
    { code: '869', id: 'RS', description: 'Order Status Inquiry' },
    { code: '870', id: 'RS', description: 'Order Status Report' },
    { code: '871', id: 'CM', description: 'Component Parts Content' },
    { code: '872', id: 'ME', description: 'Residential Mortgage Insurance Application' },
    { code: '875', id: 'OG', description: 'Grocery Products Purchase Order' },
    { code: '876', id: 'OG', description: 'Grocery Products Purchase Order Change' },
    { code: '877', id: 'CJ', description: 'Manufacturer Coupon Family Code Structure' },
    { code: '878', id: 'QG', description: 'Product Authorization/De-authorization' },
    { code: '879', id: 'QG', description: 'Price Information' },
    { code: '880', id: 'GP', description: 'Grocery Products Invoice' },
    { code: '881', id: 'CN', description: 'Manufacturer Coupon Redemption Detail' },
    { code: '882', id: 'IG', description: 'Direct Store Delivery Summary Information' },
    { code: '883', id: 'DF', description: 'Market Development Fund Allocation' },
    { code: '884', id: 'MF', description: 'Market Development Fund Settlement' },
    { code: '885', id: 'UA', description: 'Retail Account Characteristics' },
    { code: '886', id: 'UB', description: 'Customer Call Reporting' },
    { code: '887', id: 'CN', description: 'Coupon Notification' },
    { code: '888', id: 'QG', description: 'Item Maintenance' },
    { code: '889', id: 'QG', description: 'Promotion Announcement' },
    { code: '891', id: 'UD', description: 'Deduction Research Report' },
    { code: '893', id: 'QG', description: 'Item Information Request' },
    { code: '894', id: 'DX', description: 'Delivery/Return Base Record' },
    { code: '895', id: 'DX', description: 'Delivery/Return Acknowledgment or Adjustment' },
    { code: '896', id: 'QG', description: 'Product Dimension Maintenance' },
    { code: '920', id: 'GC', description: 'Loss or Damage Claim - General Commodities' },
    { code: '924', id: 'GC', description: 'Loss or Damage Claim - Motor Vehicle' },
    { code: '925', id: 'GC', description: 'Claim Tracer' },
    { code: '926', id: 'GC', description: 'Claim Status Report and Tracer Reply' },
    { code: '928', id: 'AI', description: 'Automotive Inspection Detail' },
    { code: '940', id: 'OW', description: 'Warehouse Shipping Order' },
    { code: '943', id: 'AR', description: 'Warehouse Stock Transfer Shipment Advice' },
    { code: '944', id: 'RE', description: 'Warehouse Stock Transfer Receipt Advice' },
    { code: '945', id: 'SW', description: 'Warehouse Shipping Advice' },
    { code: '947', id: 'AW', description: 'Warehouse Inventory Adjustment Advice' },
    { code: '980', id: '', description: 'Functional Group Totals' },
    { code: '990', id: 'GF', description: 'Response to a Load Tender' },
    { code: '996', id: 'FT', description: 'File Transfer' },
    { code: '997', id: 'FA', description: 'Functional Acknowledgment' },
    { code: '998', id: 'AL', description: 'Set Cancellation' },
];

const DocumentFinder = () => {
    const [search, setSearch] = useState('');
    useTitle('EDI Document Finder');

    const filteredDocs = useMemo(() => {
        if (!search) return [];
        return EDI_DOCUMENTS.filter(doc =>
            doc.code.includes(search) ||
            doc.id.toLowerCase().includes(search.toLowerCase()) ||
            doc.description.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const exactMatch = useMemo(() => {
        return EDI_DOCUMENTS.find(doc => doc.code === search);
    }, [search]);

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-4xl pb-20 z-10">

                {/* Page Header */}
                <div className="flex justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        Document Finder
                    </Badge>
                </div>

                {/* Search */}
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors group-focus-within/search:text-[#8C7654]" style={{ color: '#A59582' }} />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Enter EDI Code (e.g., 850, 810)..."
                        className="h-14 pl-12 pr-6 text-lg font-semibold rounded-3xl border focus-visible:ring-0 focus-visible:border-[#C5A880] transition-all placeholder:font-normal"
                        style={{ borderColor: '#E3DAC9', background: 'rgba(44,36,27,0.02)', color: '#2C241B' }}
                    />
                </div>

                {/* Results */}
                <div className="space-y-6">
                    {exactMatch ? (
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: '#8C7654' }}>Primary Match</p>
                            <Card className="border-0 overflow-hidden shadow-xl rounded-3xl border ">
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="shrink-0 w-28 h-28 rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)' }}>
                                        <Hash className="w-5 h-5 mb-1" style={{ color: 'rgba(255,255,255,0.6)' }} />
                                        <span className="text-3xl font-bold leading-none" style={{ color: 'rgba(255,255,255,0.6)' }}>{exactMatch.code}</span>
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-3">
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(197,168,128,0.12)', color: '#8C7654', border: '1px solid rgba(197,168,128,0.3)' }}>
                                                ID: {exactMatch.id || 'N/A'}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(44,36,27,0.05)', color: '#A59582', border: '1px solid #E3DAC9' }}>
                                                X12 STANDARD
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: '#2C241B' }}>
                                            {exactMatch.description}
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : search.length > 0 && filteredDocs.length === 0 ? (
                        <div className="text-center py-16 space-y-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(197,168,128,0.08)', border: '1px solid #E3DAC9' }}>
                                <Info className="w-7 h-7" style={{ color: '#C5A880' }} />
                            </div>
                            <p className="text-base font-medium" style={{ color: '#A59582' }}>No document matches "{search}"</p>
                        </div>
                    ) : null}

                    {/* Suggestions Grid */}
                    {filteredDocs.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#A59582' }}>
                                {exactMatch ? '' : 'Potential Matches'}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredDocs
                                    .filter(d => d.code !== exactMatch?.code)
                                    .slice(0, 8)
                                    .map((doc) => (
                                        <div
                                            key={doc.code}
                                            onClick={() => setSearch(doc.code)}
                                            className="flex items-center gap-5 p-4 rounded-xl border cursor-pointer group/item transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                            style={{ background: '#FDFDFB', borderColor: '#E3DAC9' }}
                                        >
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover/item:shadow-sm" style={{ background: 'rgba(197,168,128,0.08)', border: '1px solid #E3DAC9' }}>
                                                <span className="text-base font-bold transition-colors group-hover/item:text-[#8C7654]" style={{ color: '#C5A880' }}>
                                                    {doc.code}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#C5A880' }}>{doc.id}</p>
                                                <h4 className="font-semibold text-sm truncate transition-colors group-hover/item:text-[#8C7654]" style={{ color: '#2C241B' }}>
                                                    {doc.description}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Popular Tags */}
                <div className="pt-6 border-t" style={{ borderColor: '#E3DAC9' }}>
                    <div className="flex items-center gap-4 mb-5">
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9)' }} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#A59582' }}>Popular Searches</p>
                        <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #E3DAC9)' }} />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {['850', '810', '855', '856', '820', '830', '997'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSearch(tag)}
                                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all hover:scale-105"
                                style={{ background: '#FDFDFB', borderColor: '#E3DAC9', color: '#8C7654' }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentFinder;
