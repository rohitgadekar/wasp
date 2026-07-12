import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, FolderPen, Sparkles, Wand2, ArrowRightLeft, Database, ChevronDown, Check, FileCode, Search, X } from 'lucide-react';
import { useTitle } from '@/hooks/use-title';
import { cn } from '@/lib/utils';

const labelClasses = "text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C7654] block mb-1.5";

const DOCUMENT_TYPES = [
    { label: '100 | Insurance Plan Description', value: 'insurancePlanDescription' },
    { label: '101 | Name and Address Lists', value: 'nameAddressLists' },
    { label: '104 | Air Shipment Information', value: 'airShipmentInformation' },
    { label: '105 | Business Entity Filings', value: 'businessEntityFilings' },
    { label: '106 | Motor Carrier Rate Proposal', value: 'motorCarrierRateProposal' },
    { label: '107 | Request for Motor Carrier Rate Proposal', value: 'requestMotorCarrierRateProposal' },
    { label: '108 | Response to Motor Carrier Rate Proposal', value: 'responseMotorCarrierRateProposal' },
    { label: '109 | Vessel Content Details', value: 'vesselContentDetails' },
    { label: '110 | Air Freight Details and Invoice', value: 'airFreightDetailsInvoice' },
    { label: '112 | Property Damage Report', value: 'propertyDamageReport' },
    { label: '120 | Vehicle Shipping Order', value: 'vehicleShippingOrder' },
    { label: '121 | Vehicle Service', value: 'vehicleService' },
    { label: '124 | Vehicle Damage', value: 'vehicleDamage' },
    { label: '125 | Multilevel Railcar Load Details', value: 'multilevelRailcarLoadDetails' },
    { label: '126 | Vehicle Application Advice', value: 'vehicleApplicationAdvice' },
    { label: '127 | Vehicle Baying Order', value: 'vehicleBayingOrder' },
    { label: '128 | Dealer Information', value: 'dealerInformation' },
    { label: '129 | Vehicle Carrier Rate Update', value: 'vehicleCarrierRateUpdate' },
    { label: '130 | Student Educational Record (Transcript)', value: 'studentEducationalRecord' },
    { label: '131 | Student Educational Record Acknowledgment', value: 'studentEducationalRecordAck' },
    { label: '135 | Student Loan Application', value: 'studentLoanApplication' },
    { label: '138 | Testing Results Request and Report', value: 'testingResultsRequestReport' },
    { label: '139 | Student Loan Guarantee Result', value: 'studentLoanGuaranteeResult' },
    { label: '140 | Product Registration', value: 'productRegistration' },
    { label: '141 | Product Service Claim Response', value: 'productServiceClaimResponse' },
    { label: '142 | Product Service Claim', value: 'productServiceClaim' },
    { label: '143 | Product Service Notification', value: 'productServiceNotification' },
    { label: '144 | Student Loan Transfer and Status Verification', value: 'studentLoanTransferStatusVerification' },
    { label: '146 | Request for Student Educational Record', value: 'requestStudentEducationalRecord' },
    { label: '147 | Response to Request for Student Educational Record', value: 'responseRequestStudentEducationalRecord' },
    { label: '148 | Report of Injury', value: 'reportOfInjury' },
    { label: '149 | Notice of Tax Adjustment or Assessment', value: 'noticeTaxAdjustmentAssessment' },
    { label: '150 | Tax Rate Notification', value: 'taxRateNotification' },
    { label: '151 | Electronic Filing of Tax Return Data Acknowledgment', value: 'electronicFilingTaxReturnDataAck' },
    { label: '152 | Statistical Government Information', value: 'statisticalGovernmentInformation' },
    { label: '153 | Unemployment Insurance Tax Claim or Charge Information', value: 'unemploymentInsuranceTaxClaimChargeInfo' },
    { label: '154 | Uniform Commercial Code Filing', value: 'uniformCommercialCodeFiling' },
    { label: '155 | Business Credit Report', value: 'businessCreditReport' },
    { label: '157 | Notice of Power of Attorney', value: 'noticeOfPowerOfAttorney' },
    { label: '159 | Motion Picture Booking Confirmation', value: 'motionPictureBookingConfirmation' },
    { label: '160 | Transportation Automatic Equipment Identification', value: 'transportationAutomaticEquipmentIdentification' },
    { label: '161 | Train Sheet', value: 'trainSheet' },
    { label: '163 | Transportation Appointment Schedule Information', value: 'transportationAppointmentScheduleInformation' },
    { label: '170 | Revenue Receipts Statement', value: 'revenueReceiptsStatement' },
    { label: '175 | Court and Law Enforcement Notice', value: 'courtLawEnforcementNotice' },
    { label: '176 | Court Submission', value: 'courtSubmission' },
    { label: '180 | Return Merchandise Authorization and Notification', value: 'returnMerchandiseAuthNotification' },
    { label: '185 | Royalty Regulatory Report', value: 'royaltyRegulatoryReport' },
    { label: '186 | Insurance Underwriting Requirements Reporting', value: 'insuranceUnderwritingRequirementsReporting' },
    { label: '188 | Educational Course Inventory', value: 'educationalCourseInventory' },
    { label: '189 | Application for Admission to Educational Institutions', value: 'applicationAdmissionEducationalInstitutions' },
    { label: '190 | Student Enrollment Verification', value: 'studentEnrollmentVerification' },
    { label: '191 | Student Loan Pre-Claims and Claims', value: 'studentLoanPreClaimsClaims' },
    { label: '194 | Grant or Assistance Application', value: 'grantAssistanceApplication' },
    { label: '195 | FCC License Application', value: 'fccLicenseApplication' },
    { label: '196 | Contractor Cost Data Reporting', value: 'contractorCostDataReporting' },
    { label: '197 | Real Estate Title Evidence', value: 'realEstateTitleEvidence' },
    { label: '198 | Loan Verification Information', value: 'loanVerificationInformation' },
    { label: '199 | Real Estate Settlement Information', value: 'realEstateSettlementInformation' },
    { label: '200 | Mortgage Credit Report', value: 'mortgageCreditReport' },
    { label: '201 | Residential Loan Application', value: 'residentialLoanApplication' },
    { label: '202 | Secondary Mortgage Market Loan Delivery', value: 'secondaryMortgageMarketLoanDelivery' },
    { label: '203 | Secondary Mortgage Market Investor Report', value: 'secondaryMortgageMarketInvestorReport' },
    { label: '204 | Motor Carrier Load Tender', value: 'motorCarrierLoadTender' },
    { label: '205 | Mortgage Note', value: 'mortgageNote' },
    { label: '206 | Real Estate Inspection', value: 'realEstateInspection' },
    { label: '210 | Motor Carrier Freight Details and Invoice', value: 'motorCarrierFreightDetailsInvoice' },
    { label: '211 | Motor Carrier Bill of Lading', value: 'motorCarrierBillOfLading' },
    { label: '212 | Motor Carrier Delivery Trailer Manifest', value: 'motorCarrierDeliveryTrailerManifest' },
    { label: '213 | Motor Carrier Shipment Status Inquiry', value: 'motorCarrierShipmentStatusInquiry' },
    { label: '214 | Transportation Carrier Shipment Status Message', value: 'transportationCarrierShipmentStatusMessage' },
    { label: '215 | Motor Carrier Pick-up Manifest', value: 'motorCarrierPickUpManifest' },
    { label: '216 | Motor Carrier Shipment Pick-up Notification', value: 'motorCarrierShipmentPickUpNotification' },
    { label: '217 | Motor Carrier Loading and Route Guide', value: 'motorCarrierLoadingRouteGuide' },
    { label: '218 | Motor Carrier Tariff Information', value: 'motorCarrierTariffInformation' },
    { label: '219 | Logistics Service Request', value: 'logisticsServiceRequest' },
    { label: '220 | Logistics Service Response', value: 'logisticsServiceResponse' },
    { label: '222 | Cartage Work Assignment', value: 'cartageWorkAssignment' },
    { label: '223 | Consolidators Freight Bill and Invoice', value: 'consolidatorsFreightBillInvoice' },
    { label: '224 | Motor Carrier Summary Freight Bill Manifest', value: 'motorCarrierSummaryFreightBillManifest' },
    { label: '225 | Response to a Cartage Work Assignment', value: 'responseCartageWorkAssignment' },
    { label: '242 | Data Status Tracking', value: 'dataStatusTracking' },
    { label: '244 | Product Source Information', value: 'productSourceInformation' },
    { label: '248 | Account Assignment/Inquiry and Service/Status', value: 'accountAssignmentInquiryServiceStatus' },
    { label: '249 | Animal Toxicological Data', value: 'animalToxicologicalData' },
    { label: '250 | Purchase Order Shipment Management Document', value: 'purchaseOrderShipmentManagementDoc' },
    { label: '251 | Pricing Support', value: 'pricingSupport' },
    { label: '252 | Insurance Producer Administration', value: 'insuranceProducerAdministration' },
    { label: '255 | Underwriting Information Services', value: 'underwritingInformationServices' },
    { label: '256 | Periodic Compensation', value: 'periodicCompensation' },
    { label: '260 | Application for Mortgage Insurance Benefits', value: 'applicationMortgageInsuranceBenefits' },
    { label: '261 | Real Estate Information Request', value: 'realEstateInformationRequest' },
    { label: '262 | Real Estate Information Report', value: 'realEstateInformationReport' },
    { label: '263 | Residential Mortgage Insurance Application Response', value: 'residentialMortgageInsuranceAppResponse' },
    { label: '264 | Mortgage Loan Default Status', value: 'mortgageLoanDefaultStatus' },
    { label: '265 | Real Estate Title Insurance Services Order', value: 'realEstateTitleInsuranceServicesOrder' },
    { label: '266 | Mortgage or Property Record Change Notification', value: 'mortgagePropertyRecordChangeNotification' },
    { label: '267 | Individual Life', value: 'individualLife' },
    { label: '268 | Annuity Activity', value: 'annuityActivity' },
    { label: '270 | Eligibility', value: 'eligibility270' },
    { label: '271 | Eligibility', value: 'eligibility271' },
    { label: '272 | Property and Casualty Loss Notification', value: 'propertyCasualtyLossNotification' },
    { label: '273 | Insurance/Annuity Application Status', value: 'insuranceAnnuityApplicationStatus' },
    { label: '274 | Health Care Provider Information', value: 'healthCareProviderInformation' },
    { label: '275 | Patient Information', value: 'patientInformation' },
    { label: '276 | Health Care Claim Status Request', value: 'healthCareClaimStatusRequest' },
    { label: '277 | Health Care Claim Status Notification', value: 'healthCareClaimStatusNotification' },
    { label: '278 | Health Care Services Review Information', value: 'healthCareServicesReviewInformation' },
    { label: '280 | Voter Registration Information', value: 'voterRegistrationInformation' },
    { label: '285 | Commercial Vehicle Safety and Credentials Information Exchange', value: 'commercialVehicleSafetyCredentialsInfoExchange' },
    { label: '286 | Commercial Vehicle Credentials', value: 'commercialVehicleCredentials' },
    { label: '288 | Wage Determination', value: 'wageDetermination' },
    { label: '290 | Cooperative Advertising Agreements', value: 'cooperativeAdvertisingAgreements' },
    { label: '300 | Reservation (Booking Request) (Ocean)', value: 'reservationBookingRequestOcean' },
    { label: '301 | Confirmation (Ocean)', value: 'confirmationOcean' },
    { label: '303 | Booking Cancellation (Ocean)', value: 'bookingCancellationOcean' },
    { label: '304 | Shipping Instructions', value: 'shippingInstructions' },
    { label: '309 | U.S. Customs Manifest', value: 'usCustomsManifest' },
    { label: '310 | Freight Receipt and Invoice (Ocean)', value: 'freightReceiptInvoiceOcean' },
    { label: '311 | Canadian Customs Information', value: 'canadianCustomsInformation' },
    { label: '312 | Arrival Notice (Ocean)', value: 'arrivalNoticeOcean' },
    { label: '313 | Shipment Status Inquiry (Ocean)', value: 'shipmentStatusInquiryOcean' },
    { label: '315 | Status Details (Ocean) Illness or Incident', value: 'statusDetailsOceanIllnessIncident' },
    { label: '317 | Delivery/Pickup Order', value: 'deliveryPickupOrder' },
    { label: '319 | Terminal Information', value: 'terminalInformation' },
    { label: '322 | Terminal Operations and Intermodal Ramp Activity', value: 'terminalOperationsIntermodalRampActivity' },
    { label: '323 | Vessel Schedule and Itinerary (Ocean)', value: 'vesselScheduleItineraryOcean' },
    { label: '324 | Vessel Stow Plan (Ocean)', value: 'vesselStowPlanOcean' },
    { label: '325 | Consolidation of Goods in Container', value: 'consolidationGoodsContainer' },
    { label: '326 | Consignment Summary List', value: 'consignmentSummaryList' },
    { label: '350 | U.S. Customs Status Information', value: 'usCustomsStatusInformation' },
    { label: '352 | U.S. Customs Carrier General Order Status', value: 'usCustomsCarrierGeneralOrderStatus' },
    { label: '353 | U.S. Customs Events Advisory Details', value: 'usCustomsEventsAdvisoryDetails' },
    { label: '354 | U.S. Customs Automated Manifest Archive Status', value: 'usCustomsAutomatedManifestArchiveStatus' },
    { label: '355 | U.S. Customs Acceptance/Rejection', value: 'usCustomsAcceptanceRejection' },
    { label: '356 | U.S. Customs Permit to Transfer Request', value: 'usCustomsPermitTransferRequest' },
    { label: '357 | U.S. Customs In-Bond Information', value: 'usCustomsInBondInformation' },
    { label: '358 | U.S. Customs Consist Information', value: 'usCustomsConsistInformation' },
    { label: '361 | Carrier Interchange Agreement (Ocean)', value: 'carrierInterchangeAgreementOcean' },
    { label: '362 | Cargo Insurance Advice of Shipment', value: 'cargoInsuranceAdviceShipment' },
    { label: '404 | Rail Carrier Shipment Information', value: 'railCarrierShipmentInformation' },
    { label: '410 | Rail Carrier Freight Details and Invoice', value: 'railCarrierFreightDetailsInvoice' },
    { label: '412 | Trailer or Container Repair Billing', value: 'trailerContainerRepairBilling' },
    { label: '414 | Rail Carhire Settlements', value: 'railCarhireSettlements' },
    { label: '417 | Rail Carrier Waybill Interchange', value: 'railCarrierWaybillInterchange' },
    { label: '418 | Rail Advance Interchange Consist', value: 'railAdvanceInterchangeConsist' },
    { label: '419 | Advance Car Disposition', value: 'advanceCarDisposition' },
    { label: '420 | Car Handling Information', value: 'carHandlingInformation' },
    { label: '421 | Estimated Time of Arrival and Car Scheduling', value: 'estimatedTimeArrivalCarScheduling' },
    { label: '422 | Shipper\'s Car Order', value: 'shippersCarOrder' },
    { label: '423 | Rail Industrial Switch List', value: 'railIndustrialSwitchList' },
    { label: '425 | Rail Waybill Request Response or Confirmation', value: 'railWaybillRequestResponseConfirmation' },
    { label: '426 | Rail Revenue Waybill', value: 'railRevenueWaybill' },
    { label: '429 | Railroad Retirement Activity', value: 'railroadRetirementActivity' },
    { label: '431 | Railroad Station Master File', value: 'railroadStationMasterFile' },
    { label: '432 | Rail Deprescription', value: 'railDeprescription' },
    { label: '433 | Railroad Reciprocal Switch File', value: 'railroadReciprocalSwitchFile' },
    { label: '434 | Railroad Mark Register Update Activity', value: 'railroadMarkRegisterUpdateActivity' },
    { label: '435 | Standard Transportation Commodity Code Master', value: 'standardTransportationCommodityCodeMaster' },
    { label: '436 | Locomotive Information', value: 'locomotiveInformation' },
    { label: '437 | Railroad Junctions and Interchanges Activity', value: 'railroadJunctionsInterchangesActivity' },
    { label: '440 | Shipment Weights', value: 'shipmentWeights' },
    { label: '451 | Railroad Event Report', value: 'railroadEventReport' },
    { label: '452 | Railroad Problem Log Inquiry or Advice', value: 'railroadProblemLogInquiryAdvice' },
    { label: '453 | Railroad Service Commitment Advice', value: 'railroadServiceCommitmentAdvice' },
    { label: '455 | Railroad Parameter Trace Registration', value: 'railroadParameterTraceRegistration' },
    { label: '456 | Railroad Equipment Inquiry or Advice', value: 'railroadEquipmentInquiryAdvice' },
    { label: '460 | Railroad Price Distribution Request or Response', value: 'railroadPriceDistributionRequestResponse' },
    { label: '463 | Rail Rate Reply', value: 'railRateReply' },
    { label: '466 | Rate Request', value: 'rateRequest' },
    { label: '468 | Rate Docket Journal Log', value: 'rateDocketJournalLog' },
    { label: '470 | Railroad Clearance', value: 'railroadClearance' },
    { label: '475 | Rail Route File Maintenance', value: 'railRouteFileMaintenance' },
    { label: '485 | Ratemaking Action', value: 'ratemakingAction' },
    { label: '486 | Rate Docket Expiration', value: 'rateDocketExpiration' },
    { label: '490 | Rate Group Definition', value: 'rateGroupDefinition' },
    { label: '492 | Miscellaneous Rates', value: 'miscellaneousRates' },
    { label: '494 | Rail Scale Rates', value: 'railScaleRates' },
    { label: '500 | Medical Event Reporting', value: 'medicalEventReporting' },
    { label: '501 | Vendor Performance Review', value: 'vendorPerformanceReview' },
    { label: '503 | Pricing History', value: 'pricingHistory' },
    { label: '504 | Clauses and Provisions', value: 'clausesProvisions' },
    { label: '511 | Requisition', value: 'requisition' },
    { label: '517 | Material Obligation Validation', value: 'materialObligationValidation' },
    { label: '521 | Income or Asset Offset', value: 'incomeAssetOffset' },
    { label: '527 | Material Due-In and Receipt', value: 'materialDueInReceipt' },
    { label: '536 | Logistics Reassignment', value: 'logisticsReassignment' },
    { label: '540 | Notice of Employment Status', value: 'noticeEmploymentStatus' },
    { label: '561 | Contract Abstract', value: 'contractAbstract' },
    { label: '567 | Contract Completion Status', value: 'contractCompletionStatus' },
    { label: '568 | Contract Payment Management Report', value: 'contractPaymentManagementReport' },
    { label: '601 | U.S. Customs Export Shipment Information', value: 'usCustomsExportShipmentInformation' },
    { label: '602 | Transportation Services Tender', value: 'transportationServicesTender' },
    { label: '620 | Excavation Communication', value: 'excavationCommunication' },
    { label: '625 | Well Information', value: 'wellInformation' },
    { label: '650 | Maintenance Service Order', value: 'maintenanceServiceOrder' },
    { label: '715 | Intermodal Group Loading Plan', value: 'intermodalGroupLoadingPlan' },
    { label: '805 | Contract Pricing Proposal', value: 'contractPricingProposal' },
    { label: '806 | Project Schedule Reporting', value: 'projectScheduleReporting' },
    { label: '810 | Invoice', value: 'invoice' },
    { label: '811 | Consolidated Service Invoice/Statement', value: 'consolidatedServiceInvoiceStatement' },
    { label: '812 | Credit/Debit Adjustment', value: 'creditDebitAdjustment' },
    { label: '813 | Electronic Filing of Tax Return Data', value: 'electronicFilingTaxReturnData' },
    { label: '814 | General Request', value: 'generalRequest' },
    { label: '815 | Cryptographic Service Message', value: 'cryptographicServiceMessage' },
    { label: '816 | Organizational Relationships', value: 'organizationalRelationships' },
    { label: '818 | Commission Sales Report', value: 'commissionSalesReport' },
    { label: '819 | Operating Expense Statement', value: 'operatingExpenseStatement' },
    { label: '820 | Payment Order/Remittance Advice', value: 'paymentOrderRemittanceAdvice' },
    { label: '821 | Financial Information Reporting', value: 'financialInformationReporting' },
    { label: '822 | Account Analysis', value: 'accountAnalysis' },
    { label: '823 | Lockbox', value: 'lockbox' },
    { label: '824 | Application Advice', value: 'applicationAdvice' },
    { label: '826 | Tax Information Exchange', value: 'taxInformationExchange' },
    { label: '827 | Financial Return Notice', value: 'financialReturnNotice' },
    { label: '828 | Debit Authorization', value: 'debitAuthorization' },
    { label: '829 | Payment Cancellation Request', value: 'paymentCancellationRequest' },
    { label: '830 | Planning Schedule with Release Capability', value: 'planningScheduleReleaseCapability' },
    { label: '831 | Application Control Totals', value: 'applicationControlTotals' },
    { label: '832 | Price/Sales Catalog', value: 'priceSalesCatalog' },
    { label: '833 | Mortgage Credit Report Order', value: 'mortgageCreditReportOrder' },
    { label: '834 | Benefit Enrollment and Maintenance', value: 'benefitEnrollmentMaintenance' },
    { label: '835 | Health Care Claim Payment/Advice', value: 'healthCareClaimPaymentAdvice' },
    { label: '836 | Procurement Notices', value: 'procurementNotices' },
    { label: '837 | Health Care Claim', value: 'healthCareClaim' },
    { label: '838 | Trading Partner Profile', value: 'tradingPartnerProfile' },
    { label: '839 | Project Cost Reporting', value: 'projectCostReporting' },
    { label: '840 | Request for Quotation', value: 'requestForQuotation' },
    { label: '841 | Specifications/Technical Information', value: 'specificationsTechnicalInformation' },
    { label: '842 | Nonconformance Report', value: 'nonconformanceReport' },
    { label: '843 | Response to Request for Quotation', value: 'responseRequestForQuotation' },
    { label: '844 | Product Transfer Account Adjustment', value: 'productTransferAccountAdjustment' },
    { label: '845 | Price Authorization Acknowledgment/Status', value: 'priceAuthorizationAckStatus' },
    { label: '846 | Inventory Inquiry/Advice', value: 'inventoryInquiryAdvice' },
    { label: '847 | Material Claim', value: 'materialClaim' },
    { label: '848 | Material Safety Data Sheet', value: 'materialSafetyDataSheet' },
    { label: '849 | Response to Product Transfer Account Adjustment', value: 'responseProductTransferAccountAdjustment' },
    { label: '850 | Order', value: 'order' },
    { label: '851 | Asset Schedule', value: 'assetSchedule' },
    { label: '852 | Product Activity Data', value: 'productActivityData' },
    { label: '853 | Routing and Carrier Instruction', value: 'routingCarrierInstruction' },
    { label: '854 | Shipment Delivery Discrepancy Information', value: 'shipmentDeliveryDiscrepancyInformation' },
    { label: '855 | Order Ack', value: 'orderAck' },
    { label: '856 | Shipment', value: 'shipment' },
    { label: '857 | Shipment and Billing Notice', value: 'shipmentBillingNotice' },
    { label: '858 | Shipment Information', value: 'shipmentInformation' },
    { label: '859 | Freight Invoice', value: 'freightInvoice' },
    { label: '860 | Order Change', value: 'orderChange' },
    { label: '861 | Receiving Advice/Acceptance Certificate', value: 'receivingAdviceAcceptanceCertificate' },
    { label: '862 | Shipping Schedule', value: 'shippingSchedule' },
    { label: '863 | Report of Test Results', value: 'reportTestResults' },
    { label: '864 | Text Message', value: 'textMessage' },
    { label: '865 | Purchase Order Change Acknowledgment/Request - Seller Initiated', value: 'poChangeAckRequestSellerInitiated' },
    { label: '866 | Production Sequence', value: 'productionSequence' },
    { label: '867 | Product Transfer and Resale Report', value: 'productTransferResaleReport' },
    { label: '868 | Electronic Form Structure', value: 'electronicFormStructure' },
    { label: '869 | Order Status Inquiry', value: 'orderStatusInquiry' },
    { label: '870 | Order Status Report', value: 'orderStatusReport' },
    { label: '871 | Component Parts Content', value: 'componentPartsContent' },
    { label: '872 | Residential Mortgage Insurance Application', value: 'residentialMortgageInsuranceApplication' },
    { label: '875 | Grocery Products Purchase Order', value: 'groceryProductsPurchaseOrder' },
    { label: '876 | Grocery Products Purchase Order Change', value: 'groceryProductsPurchaseOrderChange' },
    { label: '877 | Manufacturer Coupon Family Code Structure', value: 'manufacturerCouponFamilyCodeStructure' },
    { label: '878 | Product Authorization/De-authorization', value: 'productAuthorizationDeAuthorization' },
    { label: '879 | Price Information', value: 'priceInformation' },
    { label: '880 | Grocery Products Invoice', value: 'groceryProductsInvoice' },
    { label: '881 | Manufacturer Coupon Redemption Detail', value: 'manufacturerCouponRedemptionDetail' },
    { label: '882 | Direct Store Delivery Summary Information', value: 'directStoreDeliverySummaryInformation' },
    { label: '883 | Market Development Fund Allocation', value: 'marketDevelopmentFundAllocation' },
    { label: '884 | Market Development Fund Settlement', value: 'marketDevelopmentFundSettlement' },
    { label: '885 | Retail Account Characteristics', value: 'retailAccountCharacteristics' },
    { label: '886 | Customer Call Reporting', value: 'customerCallReporting' },
    { label: '887 | Coupon Notification', value: 'couponNotification' },
    { label: '888 | Item Maintenance', value: 'itemMaintenance' },
    { label: '889 | Promotion Announcement', value: 'promotionAnnouncement' },
    { label: '891 | Deduction Research Report', value: 'deductionResearchReport' },
    { label: '893 | Item Information Request', value: 'itemInformationRequest' },
    { label: '894 | Delivery/Return Base Record', value: 'deliveryReturnBaseRecord' },
    { label: '895 | Delivery/Return Acknowledgment or Adjustment', value: 'deliveryReturnAckAdjustment' },
    { label: '896 | Product Dimension Maintenance', value: 'productDimensionMaintenance' },
    { label: '920 | Loss or Damage Claim - General Commodities', value: 'lossDamageClaimGeneralCommodities' },
    { label: '924 | Loss or Damage Claim - Motor Vehicle', value: 'lossDamageClaimMotorVehicle' },
    { label: '925 | Claim Tracer', value: 'claimTracer' },
    { label: '926 | Claim Status Report and Tracer Reply', value: 'claimStatusReportTracerReply' },
    { label: '928 | Automotive Inspection Detail', value: 'automotiveInspectionDetail' },
    { label: '940 | Warehouse Shipping Order', value: 'warehouseShippingOrder' },
    { label: '943 | Warehouse Stock Transfer Shipment Advice', value: 'warehouseStockTransferShipmentAdvice' },
    { label: '944 | Warehouse Stock Transfer Receipt Advice', value: 'warehouseStockTransferReceiptAdvice' },
    { label: '945 | Warehouse Shipping Advice', value: 'warehouseShippingAdvice' },
    { label: '947 | Warehouse Inventory Adjustment Advice', value: 'warehouseInventoryAdjustmentAdvice' },
    { label: '980 | Functional Group Totals', value: 'functionalGroupTotals' },
    { label: '990 | Response to a Load Tender', value: 'responseLoadTender' },
    { label: '996 | File Transfer', value: 'fileTransfer' },
    { label: '997 | Functional Acknowledgment', value: 'functionalAcknowledgment' },
    { label: '998 | Set Cancellation', value: 'setCancellation' },
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
    const [customSchema, setCustomSchema] = useState('');
    const [includeSAP, setIncludeSAP] = useState(false);
    const [documentType, setDocumentType] = useState('');
    const [documentSearch, setDocumentSearch] = useState('');
    const [fromFlow, setFromFlow] = useState('');
    const [toFlow, setToFlow] = useState('');
    const [generatedMap, setGeneratedMap] = useState('');
    useTitle('Map Name Generator');

    // Filter documents based on search
    const filteredDocuments = documentSearch
        ? DOCUMENT_TYPES.filter(doc =>
            doc.label.toLowerCase().includes(documentSearch.toLowerCase()) ||
            doc.value.toLowerCase().includes(documentSearch.toLowerCase())
          )
        : DOCUMENT_TYPES;

    const generateMapName = () => {
        // Remove whitespace from vendor name and custom schema
        const sanitizedVendorName = vendorName.replace(/\s+/g, '');
        const sanitizedCustomSchema = customSchema.replace(/\s+/g, '');
        
        if (!sanitizedVendorName || !documentType || !fromFlow || !toFlow) {
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
            // OSR<HUBID><VENDORNAME>[.SAP][.CUSTOMSCHEMA].<DOCUMENT>.from<FROM>.to<TO>.write
            let middle = '';
            if (includeSAP) middle += '.SAP';
            if (sanitizedCustomSchema) middle += `.${sanitizedCustomSchema}`;
            mapName = `OSR${hubId}${sanitizedVendorName}${middle}.${documentType}.from${fromFlow}.to${toFlow}.write`;
        } else {
            // formats.<VENDORNAME>[.SAP][.CUSTOMSCHEMA].<DOCUMENT>.from<FROM>.to<TO>.write
            let middle = '';
            if (includeSAP) middle += '.SAP';
            if (sanitizedCustomSchema) middle += `.${sanitizedCustomSchema}`;
            mapName = `formats.${sanitizedVendorName}${middle}.${documentType}.from${fromFlow}.to${toFlow}.write`;
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
        setCustomSchema('');
        setIncludeSAP(false);
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
                                                <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g., AmazonInc"
                                                    className="pl-11 pr-4 h-11 rounded-md border bg-white/40 focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                                                    style={{ borderColor: '#E3DAC9', color: '#2C241B' }} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="customSchema" className={labelClasses}>Custom Schema (Optional)</Label>
                                            <div className="relative group/field">
                                                <FileCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                <Input id="customSchema" value={customSchema} onChange={(e) => setCustomSchema(e.target.value)} placeholder="e.g., DELVRY02"
                                                    className="pl-11 pr-4 h-11 rounded-md border bg-white/40 focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                                                    style={{ borderColor: '#E3DAC9', color: '#2C241B' }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pt-1">
                                            
                                            <Label htmlFor="includeSAP" className="text-sm font-medium cursor-pointer" style={{ color: '#2C241B' }}>
                                                SAP
                                            </Label>
                                            <Checkbox
                                                id="includeSAP"
                                                checked={includeSAP}
                                                onCheckedChange={(checked) => setIncludeSAP(checked as boolean)}
                                                className="border-[#C5A880] data-[state=checked]:bg-[#C5A880] data-[state=checked]:border-[#C5A880]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClasses}>Document Structure</Label>
                                            <DropdownMenu modal={false} onOpenChange={(open) => { if (!open) setDocumentSearch(''); }}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-medium transition-all focus:outline-none focus:border-[#C5A880]"
                                                        style={{ background: 'white', borderColor: '#E3DAC9', color: documentType ? '#2C241B' : '#A59582' }}>
                                                        <span>{DOCUMENT_TYPES.find(d => d.value === documentType)?.label || 'Select document protocol'}</span>
                                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-80 overflow-hidden border shadow-xl rounded-xl p-0" style={{ borderColor: '#E3DAC9', background: '#FFFDF9' }}>
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b" style={{ borderColor: '#E3DAC9' }}>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582]" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search documents..."
                                                                value={documentSearch}
                                                                onChange={(e) => setDocumentSearch(e.target.value)}
                                                                className="w-full pl-9 pr-8 h-9 rounded-lg border text-sm focus:outline-none focus:border-[#C5A880]"
                                                                style={{ background: 'white', borderColor: '#E3DAC9', color: '#2C241B' }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            {documentSearch && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setDocumentSearch(''); }}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#E3DAC9]/50 transition-colors"
                                                                >
                                                                    <X className="w-3.5 h-3.5 text-[#A59582]" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Document List */}
                                                    <div className="max-h-56 overflow-y-auto">
                                                        {filteredDocuments.length > 0 ? (
                                                            filteredDocuments.map((doc) => (
                                                                <DropdownMenuItem
                                                                    key={doc.value}
                                                                    onClick={() => { setDocumentType(doc.value); setDocumentSearch(''); }}
                                                                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer text-sm focus:bg-[#C5A880]/10 focus:text-[#2C241B] mx-1 rounded-lg"
                                                                    style={{ color: '#2C241B' }}
                                                                >
                                                                    <span className="truncate">{doc.label}</span>
                                                                    {documentType === doc.value && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" style={{ color: '#C5A880' }} />}
                                                                </DropdownMenuItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-6 text-center">
                                                                <p className="text-sm text-[#A59582]">No documents found</p>
                                                                <p className="text-xs text-[#A59582]/60 mt-1">Try a different search term</p>
                                                            </div>
                                                        )}
                                                    </div>
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
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1" style={{ borderColor: '#E3DAC9', background: '#FFFDF9' }}>
                                                    {FLOW_TYPES.map((flow) => (
                                                        <DropdownMenuItem key={flow} onClick={() => setFromFlow(flow)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-mono focus:bg-[#C5A880]/10 focus:text-[#2C241B]" style={{ color: '#2C241B' }}>
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
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1" style={{ borderColor: '#E3DAC9', background: '#FFFDF9' }}>
                                                    {FLOW_TYPES.map((flow) => (
                                                        <DropdownMenuItem key={flow} onClick={() => setToFlow(flow)}
                                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-mono focus:bg-[#C5A880]/10 focus:text-[#2C241B]" style={{ color: '#2C241B' }}>
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