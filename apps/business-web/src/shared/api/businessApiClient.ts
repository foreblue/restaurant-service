import { QueryClient } from "@tanstack/react-query";

export interface LinkedRestaurant {
  id: number | null;
  status: string;
}

export interface BusinessUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
  status: string;
  restaurant: LinkedRestaurant;
}

export interface BusinessLoginRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetRequestResult {
  accepted: boolean;
  resetToken?: string | null;
  expiresAt?: string | null;
}

export interface RestaurantApplicationSaveRequest {
  restaurantName?: string | null;
  restaurantDescription?: string | null;
  restaurantPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  cuisineTypes?: string[] | null;
  coverImageFileId?: number | null;
  businessRegistrationNo?: string | null;
  businessName?: string | null;
  representativeName?: string | null;
  businessAddress?: string | null;
  businessLicenseFileId?: number | null;
  managerName?: string | null;
  managerPhone?: string | null;
  managerEmail?: string | null;
  contactVerified?: boolean | null;
}

export type BusinessFilePurpose = "business_license" | "restaurant_image";

export interface BusinessFileUploadResponse {
  id: number;
  purpose: BusinessFilePurpose;
  visibility: "PRIVATE" | "PUBLIC";
  originalFilename: string;
  contentType: string;
  byteSize: number;
  checksumSha256: string | null;
  publicUrl: string | null;
  createdAt: string | null;
}

export interface RestaurantApplicationResponse {
  id: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  restaurant: {
    id: number;
    status: string;
    name: string | null;
    slug: string | null;
    description: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    cuisineTypes: string[];
    coverImageFileId: number | null;
    timezone: string;
  };
  businessRegistrationNo: string | null;
  businessName: string | null;
  representativeName: string | null;
  businessAddress: string | null;
  businessLicenseFileId: number | null;
  managerName: string | null;
  managerPhone: string | null;
  managerEmail: string | null;
  contactVerified: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
}

export interface RestaurantSettingsUpdateRequest {
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  cuisineTypes?: string[] | null;
  coverImageFileId?: number | null;
}

export interface ReservationPageSettingsResponse {
  id: number;
  slug: string | null;
  status: "DRAFT" | "PRIVATE" | "PUBLIC" | "DISABLED";
  publishedAt: string | null;
  unpublishedAt: string | null;
  publicUrl: string | null;
  publishable: boolean;
  publishBlockers: string[];
}

export type BusinessDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface BusinessHourSaveItem {
  dayOfWeek: BusinessDayOfWeek;
  opensAt?: string | null;
  closesAt?: string | null;
  closed?: boolean | null;
}

export interface BusinessHoursSaveRequest {
  hours: BusinessHourSaveItem[];
}

export interface BusinessHourResponse {
  id: number;
  dayOfWeek: BusinessDayOfWeek;
  sequence: number;
  opensAt: string | null;
  closesAt: string | null;
  closed: boolean;
}

export type HolidayRuleType =
  | "WEEKLY"
  | "MONTHLY_DATE"
  | "MONTHLY_NTH_WEEKDAY"
  | "TEMPORARY_DATE"
  | "TEMPORARY_TIME";

export interface HolidayRuleSaveItem {
  type: HolidayRuleType;
  dayOfWeek?: BusinessDayOfWeek | null;
  dayOfMonth?: number | null;
  weekOfMonth?: number | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface HolidayRulesSaveRequest {
  rules: HolidayRuleSaveItem[];
}

export interface HolidayRuleResponse {
  id: number;
  type: HolidayRuleType;
  dayOfWeek: BusinessDayOfWeek | null;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface ReservationPageSaveRequest {
  slug?: string | null;
  status: "PUBLIC" | "PRIVATE";
}

export interface ReservationProductSaveRequest {
  name?: string | null;
  description?: string | null;
  priceAmount?: number | null;
  visible?: boolean | null;
  minPartySize?: number | null;
  maxPartySize?: number | null;
  availableDays?: BusinessDayOfWeek[] | null;
  availableStartTime?: string | null;
  availableEndTime?: string | null;
  slotCapacity?: number | null;
}

export type ReservationProductPaymentMode = "NONE" | "DEPOSIT" | "PREPAY" | "CARD_GUARANTEE";
export type ReservationProductDepositType = "PER_RESERVATION" | "PER_PERSON";

export interface ReservationProductPaymentPolicyRequest {
  paymentMode: ReservationProductPaymentMode;
  depositType?: ReservationProductDepositType | null;
  paymentAmount?: number | null;
  noShowFeeAmount?: number | null;
}

export interface ReservationProductPaymentPolicyResponse {
  productId: number;
  paymentMode: ReservationProductPaymentMode;
  depositType: ReservationProductDepositType | null;
  paymentAmount: number | null;
  noShowFeeAmount: number | null;
  updatedAt: string | null;
}

export interface CancellationPolicyRuleRequest {
  beforeVisitHours: number;
  refundRate: number;
}

export interface CancellationPolicyNoShowRuleRequest {
  refundRate: number;
  feeAmount: number;
}

export interface ReservationProductCancellationPolicyRequest {
  name: string;
  rules: CancellationPolicyRuleRequest[];
  noShowRule: CancellationPolicyNoShowRuleRequest;
}

export interface ReservationProductCancellationPolicyResponse {
  policyId: string;
  productId: number;
  isActive: boolean;
  name: string;
  rules: CancellationPolicyRuleRequest[];
  noShowRule: CancellationPolicyNoShowRuleRequest;
  updatedAt: string | null;
}

export interface ReservationProductResponse {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  priceAmount: number;
  visible: boolean;
  status: "ACTIVE" | "DELETED";
  minPartySize: number;
  maxPartySize: number;
  availableDays: BusinessDayOfWeek[];
  availableStartTime: string | null;
  availableEndTime: string | null;
  slotCapacity: number;
  paymentPolicyType: ReservationProductPaymentMode;
  paymentAmount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type BusinessReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "MODIFIED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_RESTAURANT"
  | "COMPLETED"
  | "NO_SHOW";

export type BusinessReservationSource =
  | "ONLINE"
  | "MANUAL_PHONE"
  | "MANUAL_WALK_IN"
  | "OWNER_ADJUSTED";

export interface BusinessReservationListQuery {
  date?: string | null;
  from?: string | null;
  to?: string | null;
  status?: BusinessReservationStatus | null;
  productId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  query?: string | null;
  includeCancelled?: boolean | null;
}

export interface BusinessReservationCalendarQuery {
  from?: string | null;
  to?: string | null;
  status?: BusinessReservationStatus | null;
  productId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface BusinessReservationSummaryResponse {
  totalReservations: number;
  totalPartySize: number;
  confirmedCount: number;
  modifiedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
}

export interface BusinessReservationCustomerSummaryResponse {
  id: number;
  name: string;
  phoneMasked: string;
}

export interface BusinessReservationListItemResponse {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  statusLabel: string;
  statusTone: string;
  source: BusinessReservationSource;
  reservedStartAt: string;
  reservedEndAt: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  productId: number;
  productName: string;
  customer: BusinessReservationCustomerSummaryResponse;
  hasCustomerRequest: boolean;
  hasOwnerNote: boolean;
  paymentStatus: string;
  paymentActionRequired: boolean;
}

export interface BusinessReservationListResponse {
  date: string | null;
  from: string;
  to: string;
  summary: BusinessReservationSummaryResponse;
  items: BusinessReservationListItemResponse[];
}

export interface BusinessReservationCalendarDayResponse {
  date: string;
  isOpen: boolean;
  reservationCount: number;
  partySizeTotal: number;
  confirmedCount: number;
  modifiedCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
}

export interface BusinessReservationCalendarResponse {
  from: string;
  to: string;
  days: BusinessReservationCalendarDayResponse[];
}

export interface BusinessReservationProductSummaryResponse {
  id: number;
  name: string;
}

export interface BusinessReservationCustomerDetailResponse {
  id: number;
  name: string;
  phoneNumber: string;
  visitCount: number;
  noShowCount: number;
  vip: boolean;
  caution: boolean;
  blockedScopeLabel: string | null;
}

export interface BusinessReservationAuditLogResponse {
  id: number;
  action: string;
  createdAt: string | null;
}

export interface BusinessReservationDetailResponse {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  statusLabel: string;
  statusTone: string;
  source: BusinessReservationSource;
  reservedStartAt: string;
  reservedEndAt: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  product: BusinessReservationProductSummaryResponse;
  customer: BusinessReservationCustomerDetailResponse;
  customerRequest: string | null;
  ownerNote: string | null;
  paymentStatus: string;
  paymentActionRequired: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  auditLogs: BusinessReservationAuditLogResponse[];
}

export type BusinessManualReservationSource = "MANUAL_PHONE" | "MANUAL_WALK_IN";

export interface BusinessManualReservationCreateRequest {
  source?: BusinessManualReservationSource | null;
  productId?: number | null;
  visitDate?: string | null;
  startTime?: string | null;
  partySize?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerRequest?: string | null;
}

export interface BusinessReservationUpdateRequest {
  productId?: number | null;
  visitDate?: string | null;
  startTime?: string | null;
  partySize?: number | null;
}

export interface BusinessReservationCancelRequest {
  reason?: string | null;
}

export interface BusinessReservationNoShowRequest {
  reason?: string | null;
  force?: boolean | null;
}

export interface BusinessReservationOperationNoteRequest {
  ownerNote?: string | null;
}

export interface BusinessReservationRefundPreviewResponse {
  reservationId: number;
  reservationNumber: string;
  cancelActor: "CUSTOMER" | "RESTAURANT";
  paymentStatus: string;
  paymentStatusLabel: string;
  refundStatus: string;
  refundStatusLabel: string;
  refundStatusTone: string;
  paidAmount: number;
  expectedRefundAmount: number;
  nonRefundableAmount: number;
  currency: string;
  policySummary: string;
  actionRequired: boolean;
  adminContactRequired: boolean;
  settlementNotice: string;
}

export type BusinessSeatType = "HALL" | "ROOM" | "BAR" | "TERRACE";
export type BusinessTableCombinationPolicy = "NONE" | "ADJACENT" | "SAME_TYPE";

export interface BusinessTableResponse {
  id: number;
  name: string;
  seatType: BusinessSeatType;
  seatTypeLabel: string;
  minPartySize: number;
  maxPartySize: number;
  isActive: boolean;
  combinationPolicy: BusinessTableCombinationPolicy;
  combinationPolicyLabel: string;
  hasReservations: boolean;
  updatedAt: string;
}

export interface BusinessTableListResponse {
  summary: {
    totalCount: number;
    activeCount: number;
    totalCapacity: number;
    roomCount: number;
  };
  items: BusinessTableResponse[];
}

export interface BusinessTableSaveRequest {
  name?: string | null;
  seatType?: BusinessSeatType | null;
  minPartySize?: number | null;
  maxPartySize?: number | null;
  isActive?: boolean | null;
  combinationPolicy?: BusinessTableCombinationPolicy | null;
}

export interface ReservationProductSeatRulesRequest {
  allowedSeatTypes?: BusinessSeatType[] | null;
  allowedTableIds?: number[] | null;
  defaultDurationMinutes?: number | null;
  slotIntervalMinutes?: number | null;
}

export interface ReservationProductSeatRulesResponse {
  productId: number;
  allowedSeatTypes: BusinessSeatType[];
  allowedSeatTypeLabels: string[];
  allowedTableIds: number[];
  allowedTables: Array<{
    id: number;
    name: string;
    seatTypeLabel: string;
    maxPartySize: number;
    combinationPolicyLabel: string;
  }>;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  tableCombinationSummary: string;
  summary: string;
  updatedAt: string;
}

export type BusinessTimeSlotStatus = "AVAILABLE" | "CLOSED" | "TEMP_CLOSED";

export interface BusinessTimeSlotListQuery {
  date?: string | null;
  productId?: number | null;
  seatType?: BusinessSeatType | null;
}

export interface BusinessTimeSlotActionRequest {
  date?: string | null;
  productId?: number | null;
  seatType?: BusinessSeatType | null;
  startTime?: string | null;
  reason?: string | null;
}

export interface BusinessTimeSlotResponse {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  productId: number;
  productName: string;
  seatType: BusinessSeatType;
  seatTypeLabel: string;
  capacity: number;
  reservedCount: number;
  availableCount: number;
  status: BusinessTimeSlotStatus;
  statusLabel: string;
  statusTone: string;
  duplicateGuarded: boolean;
  customerAvailabilityAffected: boolean;
  lastUpdatedAt: string;
}

export interface BusinessTimeSlotListResponse {
  date: string;
  summary: {
    totalCount: number;
    availableCount: number;
    closedCount: number;
    tempClosedCount: number;
    duplicateGuardedCount: number;
  };
  items: BusinessTimeSlotResponse[];
}

export interface BusinessAuditLogListQuery {
  targetType?: string | null;
  targetId?: number | null;
}

export interface BusinessAuditLogResponse {
  id: number;
  actorUserId: number | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: number;
  beforeValue: Record<string, unknown> | null;
  afterValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
}

export interface BusinessAuditLogListResponse {
  items: BusinessAuditLogResponse[];
}

export interface BusinessPaymentListQuery {
  status?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface BusinessPaymentListItemResponse {
  id: number;
  paymentNumber: string;
  reservationId: number;
  reservationNumber: string;
  customerName: string;
  productName: string;
  paymentType: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  dueAt: string | null;
  cardGuaranteeHeld: boolean;
  actionRequired: boolean;
}

export interface BusinessPaymentListResponse {
  summary: {
    totalCount: number;
    paidAmount: number;
    cardGuaranteeCount: number;
    actionRequiredCount: number;
  };
  items: BusinessPaymentListItemResponse[];
}

export interface BusinessRefundListQuery {
  status?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface BusinessRefundListItemResponse {
  id: number;
  refundNumber: string;
  paymentId: number;
  reservationId: number;
  reservationNumber: string;
  customerName: string;
  productName: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  refundAmount: number;
  currency: string;
  requestedAt: string | null;
  completedAt: string | null;
  failureMessage: string | null;
  actionRequired: boolean;
}

export interface BusinessRefundListResponse {
  summary: {
    totalCount: number;
    refundAmount: number;
    failedCount: number;
    actionRequiredCount: number;
  };
  items: BusinessRefundListItemResponse[];
}

export type BusinessCustomerSegment =
  | "ALL"
  | "HAS_VISIT_HISTORY"
  | "HAS_NO_SHOW"
  | "HAS_PREFERENCES";

export interface BusinessCustomerListQuery {
  query?: string | null;
  segment?: BusinessCustomerSegment | null;
}

export interface BusinessCustomerListItemResponse {
  id: number;
  name: string;
  phoneMasked: string;
  totalReservations: number;
  completedCount: number;
  noShowCount: number;
  cancelledCount: number;
  lastVisitedAt: string | null;
  nextReservationAt: string | null;
  lastRequest: string | null;
  allergySummary: string | null;
  anniversarySummary: string | null;
  privacyLevelLabel: string;
}

export interface BusinessCustomerListResponse {
  summary: {
    totalCount: number;
    visitedCount: number;
    noShowCount: number;
    preferenceCount: number;
  };
  items: BusinessCustomerListItemResponse[];
}

export interface BusinessCustomerAnniversaryResponse {
  label: string;
  date: string;
}

export type BusinessCustomerBlockedScope = "NONE" | "STORE_REVIEW_REQUIRED";

export interface BusinessCustomerFlagStatusResponse {
  customerId: number;
  vip: boolean;
  caution: boolean;
  blockedScope: BusinessCustomerBlockedScope;
  blockedScopeLabel: string | null;
  updatedAt: string | null;
}

export interface BusinessCustomerNoteResponse {
  id: number;
  customerId: number;
  content: string;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
  auditActionLabel: string;
}

export interface BusinessCustomerDetailResponse {
  id: number;
  name: string;
  phoneNumber: string;
  phoneMasked: string;
  totalReservations: number;
  visitCount: number;
  noShowCount: number;
  cancelledCount: number;
  firstReservationAt: string | null;
  lastReservationAt: string | null;
  lastVisitedAt: string | null;
  nextReservationAt: string | null;
  recentRequests: string[];
  allergies: string[];
  anniversaries: BusinessCustomerAnniversaryResponse[];
  flagStatus: BusinessCustomerFlagStatusResponse;
  notes: BusinessCustomerNoteResponse[];
  privacyNotice: string;
}

export interface BusinessCustomerNoteSaveRequest {
  content?: string | null;
}

export interface BusinessCustomerFlagsSaveRequest {
  vip?: boolean | null;
  caution?: boolean | null;
}

export interface BusinessCustomerAnonymizeRequest {
  reason?: string | null;
  confirm?: boolean | null;
}

export interface BusinessCustomerAnonymizeResponse {
  accepted: boolean;
  customerId: number;
  requestedAt: string | null;
  notice: string;
}

export type BusinessCustomerDuplicateMatchType = "PHONE" | "EMAIL";

export interface BusinessCustomerDuplicateCandidateItemResponse {
  id: number;
  name: string;
  phoneMasked: string;
  email: string | null;
  reservationCount: number;
  noteCount: number;
  vip: boolean;
  caution: boolean;
  blocked: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BusinessCustomerDuplicateCandidateGroupResponse {
  matchType: BusinessCustomerDuplicateMatchType;
  matchKeyMasked: string;
  customers: BusinessCustomerDuplicateCandidateItemResponse[];
}

export interface BusinessCustomerDuplicateCandidatesResponse {
  totalGroups: number;
  groups: BusinessCustomerDuplicateCandidateGroupResponse[];
}

export interface BusinessCustomerMergeRequest {
  targetCustomerId?: number | null;
  sourceCustomerIds?: number[] | null;
  confirmIrreversible?: boolean | null;
  reason?: string | null;
}

export interface BusinessCustomerMergeResponse {
  targetCustomerId: number;
  mergedCustomerIds: number[];
  movedReservationCount: number;
  movedNoteCount: number;
  anonymizedCustomerIds: number[];
  warning: string;
}

export interface BusinessCustomerReservationHistoryItemResponse {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  statusLabel: string;
  statusTone: string;
  visitDate: string;
  startTime: string;
  partySize: number;
  productName: string;
  source: BusinessReservationSource;
  customerRequest: string | null;
  allergyNote: string | null;
  anniversaryNote: string | null;
  completedAt: string | null;
  noShowAt: string | null;
}

export interface BusinessCustomerReservationHistoryResponse {
  items: BusinessCustomerReservationHistoryItemResponse[];
}

export interface RestaurantSettingsResponse {
  id: number;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  name: string | null;
  slug: string | null;
  description: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  cuisineTypes: string[];
  coverImageFileId: number | null;
  timezone: string;
  approvedAt: string | null;
  reservationPage: ReservationPageSettingsResponse | null;
  businessHours: BusinessHourResponse[];
  holidayRules: HolidayRuleResponse[];
}

interface BusinessLoginResponse {
  user: BusinessUser;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedApiError extends ApiError {
  constructor(message = "인증이 필요합니다.") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedApiError";
  }
}

export interface BusinessApiClient {
  getCurrentUser(): Promise<BusinessUser>;
  login(request: BusinessLoginRequest): Promise<BusinessUser>;
  logout(): Promise<void>;
  requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetRequestResult>;
  getCurrentRestaurantApplication(): Promise<RestaurantApplicationResponse | null>;
  createRestaurantApplication(
    request: RestaurantApplicationSaveRequest,
  ): Promise<RestaurantApplicationResponse>;
  updateRestaurantApplication(
    applicationId: number,
    request: RestaurantApplicationSaveRequest,
  ): Promise<RestaurantApplicationResponse>;
  uploadBusinessFile(purpose: BusinessFilePurpose, file: File): Promise<BusinessFileUploadResponse>;
  submitRestaurantApplication(applicationId: number): Promise<RestaurantApplicationResponse>;
  getCurrentRestaurant(): Promise<RestaurantSettingsResponse>;
  updateRestaurant(
    restaurantId: number,
    request: RestaurantSettingsUpdateRequest,
  ): Promise<RestaurantSettingsResponse>;
  saveBusinessHours(
    restaurantId: number,
    request: BusinessHoursSaveRequest,
  ): Promise<BusinessHourResponse[]>;
  saveHolidayRules(
    restaurantId: number,
    request: HolidayRulesSaveRequest,
  ): Promise<HolidayRuleResponse[]>;
  updateReservationPage(
    restaurantId: number,
    request: ReservationPageSaveRequest,
  ): Promise<ReservationPageSettingsResponse>;
  listReservationProducts(): Promise<ReservationProductResponse[]>;
  createReservationProduct(
    request: ReservationProductSaveRequest,
  ): Promise<ReservationProductResponse>;
  updateReservationProduct(
    productId: number,
    request: ReservationProductSaveRequest,
  ): Promise<ReservationProductResponse>;
  deleteReservationProduct(productId: number): Promise<void>;
  updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ): Promise<ReservationProductPaymentPolicyResponse>;
  saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ): Promise<ReservationProductCancellationPolicyResponse>;
  listBusinessReservations(
    query: BusinessReservationListQuery,
  ): Promise<BusinessReservationListResponse>;
  listBusinessReservationCalendar(
    query: BusinessReservationCalendarQuery,
  ): Promise<BusinessReservationCalendarResponse>;
  getBusinessReservationDetail(reservationId: number): Promise<BusinessReservationDetailResponse>;
  createManualBusinessReservation(
    request: BusinessManualReservationCreateRequest,
  ): Promise<BusinessReservationDetailResponse>;
  updateBusinessReservation(
    reservationId: number,
    request: BusinessReservationUpdateRequest,
  ): Promise<BusinessReservationDetailResponse>;
  cancelBusinessReservation(
    reservationId: number,
    request: BusinessReservationCancelRequest,
  ): Promise<BusinessReservationDetailResponse>;
  completeBusinessReservation(reservationId: number): Promise<BusinessReservationDetailResponse>;
  markBusinessReservationNoShow(
    reservationId: number,
    request: BusinessReservationNoShowRequest,
  ): Promise<BusinessReservationDetailResponse>;
  updateBusinessReservationOperationNote(
    reservationId: number,
    request: BusinessReservationOperationNoteRequest,
  ): Promise<BusinessReservationDetailResponse>;
  getBusinessReservationRefundPreview(
    reservationId: number,
  ): Promise<BusinessReservationRefundPreviewResponse>;
  listBusinessTables(): Promise<BusinessTableListResponse>;
  createBusinessTable(request: BusinessTableSaveRequest): Promise<BusinessTableResponse>;
  updateBusinessTable(
    tableId: number,
    request: BusinessTableSaveRequest,
  ): Promise<BusinessTableResponse>;
  saveReservationProductSeatRules(
    productId: number,
    request: ReservationProductSeatRulesRequest,
  ): Promise<ReservationProductSeatRulesResponse>;
  listBusinessTimeSlots(query: BusinessTimeSlotListQuery): Promise<BusinessTimeSlotListResponse>;
  closeBusinessTimeSlot(request: BusinessTimeSlotActionRequest): Promise<BusinessTimeSlotResponse>;
  reopenBusinessTimeSlot(request: BusinessTimeSlotActionRequest): Promise<BusinessTimeSlotResponse>;
  listBusinessAuditLogs(query: BusinessAuditLogListQuery): Promise<BusinessAuditLogListResponse>;
  listBusinessPayments(query: BusinessPaymentListQuery): Promise<BusinessPaymentListResponse>;
  listBusinessRefunds(query: BusinessRefundListQuery): Promise<BusinessRefundListResponse>;
  listBusinessCustomers(query: BusinessCustomerListQuery): Promise<BusinessCustomerListResponse>;
  getBusinessCustomer(customerId: number): Promise<BusinessCustomerDetailResponse>;
  listBusinessCustomerReservations(
    customerId: number,
  ): Promise<BusinessCustomerReservationHistoryResponse>;
  createBusinessCustomerNote(
    customerId: number,
    request: BusinessCustomerNoteSaveRequest,
  ): Promise<BusinessCustomerNoteResponse>;
  updateBusinessCustomerNote(
    noteId: number,
    request: BusinessCustomerNoteSaveRequest,
  ): Promise<BusinessCustomerNoteResponse>;
  deleteBusinessCustomerNote(noteId: number): Promise<void>;
  updateBusinessCustomerFlags(
    customerId: number,
    request: BusinessCustomerFlagsSaveRequest,
  ): Promise<BusinessCustomerFlagStatusResponse>;
  requestBusinessCustomerAnonymize(
    customerId: number,
    request: BusinessCustomerAnonymizeRequest,
  ): Promise<BusinessCustomerAnonymizeResponse>;
  listBusinessCustomerDuplicateCandidates(): Promise<BusinessCustomerDuplicateCandidatesResponse>;
  mergeBusinessCustomers(
    request: BusinessCustomerMergeRequest,
  ): Promise<BusinessCustomerMergeResponse>;
}

export function createBusinessQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof UnauthorizedApiError) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}

class HttpBusinessApiClient implements BusinessApiClient {
  constructor(private readonly baseUrl: string) {}

  getCurrentUser() {
    return this.request<BusinessUser>("/api/business/me");
  }

  async login(request: BusinessLoginRequest) {
    const response = await this.request<BusinessLoginResponse>("/api/business/auth/login", {
      method: "POST",
      body: request,
    });

    return response.user;
  }

  async logout() {
    await this.request<void>("/api/business/auth/logout", {
      method: "POST",
    });
  }

  requestPasswordReset(request: PasswordResetRequest) {
    return this.request<PasswordResetRequestResult>("/api/business/auth/password-reset-requests", {
      method: "POST",
      body: request,
    });
  }

  async getCurrentRestaurantApplication() {
    try {
      return await this.request<RestaurantApplicationResponse>(
        "/api/business/restaurant-applications/current",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  createRestaurantApplication(request: RestaurantApplicationSaveRequest) {
    return this.request<RestaurantApplicationResponse>("/api/business/restaurant-applications", {
      method: "POST",
      body: request,
    });
  }

  updateRestaurantApplication(applicationId: number, request: RestaurantApplicationSaveRequest) {
    return this.request<RestaurantApplicationResponse>(
      `/api/business/restaurant-applications/${applicationId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  uploadBusinessFile(purpose: BusinessFilePurpose, file: File) {
    const formData = new FormData();
    formData.append("purpose", purpose);
    formData.append("file", file);

    return this.request<BusinessFileUploadResponse>("/api/business/files", {
      method: "POST",
      body: formData,
    });
  }

  submitRestaurantApplication(applicationId: number) {
    return this.request<RestaurantApplicationResponse>(
      `/api/business/restaurant-applications/${applicationId}/submit`,
      {
        method: "POST",
      },
    );
  }

  getCurrentRestaurant() {
    return this.request<RestaurantSettingsResponse>("/api/business/restaurants/current");
  }

  updateRestaurant(restaurantId: number, request: RestaurantSettingsUpdateRequest) {
    return this.request<RestaurantSettingsResponse>(`/api/business/restaurants/${restaurantId}`, {
      method: "PUT",
      body: request,
    });
  }

  saveBusinessHours(restaurantId: number, request: BusinessHoursSaveRequest) {
    return this.request<BusinessHourResponse[]>(
      `/api/business/restaurants/${restaurantId}/business-hours`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  saveHolidayRules(restaurantId: number, request: HolidayRulesSaveRequest) {
    return this.request<HolidayRuleResponse[]>(
      `/api/business/restaurants/${restaurantId}/holiday-rules`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  updateReservationPage(restaurantId: number, request: ReservationPageSaveRequest) {
    return this.request<ReservationPageSettingsResponse>(
      `/api/business/restaurants/${restaurantId}/reservation-page`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  listReservationProducts() {
    return this.request<ReservationProductResponse[]>("/api/business/reservation-products");
  }

  createReservationProduct(request: ReservationProductSaveRequest) {
    return this.request<ReservationProductResponse>("/api/business/reservation-products", {
      method: "POST",
      body: request,
    });
  }

  updateReservationProduct(productId: number, request: ReservationProductSaveRequest) {
    return this.request<ReservationProductResponse>(
      `/api/business/reservation-products/${productId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  async deleteReservationProduct(productId: number) {
    await this.request<void>(`/api/business/reservation-products/${productId}`, {
      method: "DELETE",
    });
  }

  updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ) {
    return this.request<ReservationProductPaymentPolicyResponse>(
      `/api/business/reservation-products/${productId}/payment-policy`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ) {
    return this.request<ReservationProductCancellationPolicyResponse>(
      `/api/business/reservation-products/${productId}/cancellation-policy`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  listBusinessReservations(query: BusinessReservationListQuery) {
    return this.request<BusinessReservationListResponse>(
      `/api/business/reservations${queryString(query)}`,
    );
  }

  listBusinessReservationCalendar(query: BusinessReservationCalendarQuery) {
    return this.request<BusinessReservationCalendarResponse>(
      `/api/business/reservations/calendar${queryString(query)}`,
    );
  }

  getBusinessReservationDetail(reservationId: number) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}`,
    );
  }

  createManualBusinessReservation(request: BusinessManualReservationCreateRequest) {
    return this.request<BusinessReservationDetailResponse>("/api/business/reservations/manual", {
      method: "POST",
      body: request,
    });
  }

  updateBusinessReservation(reservationId: number, request: BusinessReservationUpdateRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  cancelBusinessReservation(reservationId: number, request: BusinessReservationCancelRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/cancel`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  completeBusinessReservation(reservationId: number) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/complete`,
      {
        method: "POST",
      },
    );
  }

  markBusinessReservationNoShow(reservationId: number, request: BusinessReservationNoShowRequest) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/no-show`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  updateBusinessReservationOperationNote(
    reservationId: number,
    request: BusinessReservationOperationNoteRequest,
  ) {
    return this.request<BusinessReservationDetailResponse>(
      `/api/business/reservations/${reservationId}/operation-note`,
      {
        method: "PUT",
        body: request,
      },
    );
  }

  getBusinessReservationRefundPreview(reservationId: number) {
    return this.request<BusinessReservationRefundPreviewResponse>(
      `/api/public/reservations/${reservationId}/refund-preview`,
    );
  }

  listBusinessTables() {
    return this.request<BusinessTableListResponse>("/api/business/tables");
  }

  createBusinessTable(request: BusinessTableSaveRequest) {
    return this.request<BusinessTableResponse>("/api/business/tables", {
      method: "POST",
      body: request,
    });
  }

  updateBusinessTable(tableId: number, request: BusinessTableSaveRequest) {
    return this.request<BusinessTableResponse>(`/api/business/tables/${tableId}`, {
      method: "PUT",
      body: request,
    });
  }

  saveReservationProductSeatRules(productId: number, request: ReservationProductSeatRulesRequest) {
    return this.request<ReservationProductSeatRulesResponse>(
      `/api/business/reservation-products/${productId}/seat-rules`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  listBusinessTimeSlots(query: BusinessTimeSlotListQuery) {
    return this.request<BusinessTimeSlotListResponse>(
      `/api/business/time-slots${queryString(query)}`,
    );
  }

  closeBusinessTimeSlot(request: BusinessTimeSlotActionRequest) {
    return this.request<BusinessTimeSlotResponse>("/api/business/time-slots/close", {
      method: "POST",
      body: request,
    });
  }

  reopenBusinessTimeSlot(request: BusinessTimeSlotActionRequest) {
    return this.request<BusinessTimeSlotResponse>("/api/business/time-slots/reopen", {
      method: "POST",
      body: request,
    });
  }

  listBusinessAuditLogs(query: BusinessAuditLogListQuery) {
    return this.request<BusinessAuditLogListResponse>(
      `/api/business/audit-logs${queryString(query)}`,
    );
  }

  listBusinessPayments(query: BusinessPaymentListQuery) {
    return this.request<BusinessPaymentListResponse>(`/api/business/payments${queryString(query)}`);
  }

  listBusinessRefunds(query: BusinessRefundListQuery) {
    return this.request<BusinessRefundListResponse>(`/api/business/refunds${queryString(query)}`);
  }

  listBusinessCustomers(query: BusinessCustomerListQuery) {
    return this.request<BusinessCustomerListResponse>(
      `/api/business/customers${queryString(query)}`,
    );
  }

  getBusinessCustomer(customerId: number) {
    return this.request<BusinessCustomerDetailResponse>(`/api/business/customers/${customerId}`);
  }

  listBusinessCustomerReservations(customerId: number) {
    return this.request<BusinessCustomerReservationHistoryResponse>(
      `/api/business/customers/${customerId}/reservations`,
    );
  }

  createBusinessCustomerNote(customerId: number, request: BusinessCustomerNoteSaveRequest) {
    return this.request<BusinessCustomerNoteResponse>(
      `/api/business/customers/${customerId}/notes`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  updateBusinessCustomerNote(noteId: number, request: BusinessCustomerNoteSaveRequest) {
    return this.request<BusinessCustomerNoteResponse>(`/api/business/customer-notes/${noteId}`, {
      method: "PUT",
      body: request,
    });
  }

  async deleteBusinessCustomerNote(noteId: number) {
    await this.request<void>(`/api/business/customer-notes/${noteId}`, {
      method: "DELETE",
    });
  }

  updateBusinessCustomerFlags(customerId: number, request: BusinessCustomerFlagsSaveRequest) {
    return this.request<BusinessCustomerFlagStatusResponse>(
      `/api/business/customers/${customerId}/flags`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  requestBusinessCustomerAnonymize(customerId: number, request: BusinessCustomerAnonymizeRequest) {
    return this.request<BusinessCustomerAnonymizeResponse>(
      `/api/business/customers/${customerId}/anonymize`,
      {
        method: "POST",
        body: request,
      },
    );
  }

  listBusinessCustomerDuplicateCandidates() {
    return this.request<BusinessCustomerDuplicateCandidatesResponse>(
      "/api/business/customers/duplicate-candidates",
    );
  }

  mergeBusinessCustomers(request: BusinessCustomerMergeRequest) {
    return this.request<BusinessCustomerMergeResponse>("/api/business/customers/merge", {
      method: "POST",
      body: request,
    });
  }

  private async request<T>(path: string, init: { method?: string; body?: unknown } = {}) {
    const requestInit: RequestInit = {
      method: init.method ?? "GET",
      credentials: "include",
    };

    if (typeof FormData !== "undefined" && init.body instanceof FormData) {
      requestInit.body = init.body;
    } else if (init.body !== undefined) {
      requestInit.headers = { "Content-Type": "application/json" };
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, requestInit);

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);

      if (response.status === 401) {
        throw new UnauthorizedApiError(errorBody.message);
      }

      throw new ApiError(
        errorBody.message ?? "요청을 처리하지 못했습니다.",
        response.status,
        errorBody.code,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

class MockBusinessApiClient implements BusinessApiClient {
  private readonly storageKey = "restaurant-business-web.mock-session";
  private readonly applicationStorageKey = "restaurant-business-web.mock-application";
  private readonly restaurantStorageKey = "restaurant-business-web.mock-restaurant";
  private readonly reservationProductsStorageKey =
    "restaurant-business-web.mock-reservation-products";
  private readonly businessTablesStorageKey = "restaurant-business-web.mock-business-tables";
  private readonly productSeatRulesStorageKey = "restaurant-business-web.mock-product-seat-rules";
  private readonly timeSlotClosuresStorageKey = "restaurant-business-web.mock-time-slot-closures";
  private readonly manualReservationsStorageKey =
    "restaurant-business-web.mock-manual-reservations";
  private readonly reservationOverridesStorageKey =
    "restaurant-business-web.mock-reservation-overrides";
  private readonly reservationNotesStorageKey = "restaurant-business-web.mock-reservation-notes";
  private readonly customerFlagsStorageKey = "restaurant-business-web.mock-customer-flags";
  private readonly customerNotesStorageKey = "restaurant-business-web.mock-customer-notes";
  private memoryUser: BusinessUser | null = null;
  private memoryApplication: RestaurantApplicationResponse | null = null;
  private memoryRestaurant: RestaurantSettingsResponse | null = null;
  private memoryReservationProducts: ReservationProductResponse[] | null = null;
  private memoryBusinessTables: BusinessTableResponse[] | null = null;
  private memoryProductSeatRules: Record<string, ReservationProductSeatRulesResponse> | null = null;
  private memoryTimeSlotClosures: Record<string, string> | null = null;
  private memoryManualReservations: BusinessReservationListItemResponse[] | null = null;
  private memoryReservationOverrides: BusinessReservationListItemResponse[] | null = null;
  private memoryReservationNotes: Record<string, string | null> | null = null;
  private memoryCustomerFlags: Record<string, BusinessCustomerFlagStatusResponse> | null = null;
  private memoryCustomerNotes: Record<string, BusinessCustomerNoteResponse[]> | null = null;
  private nextFileId = 3001;

  async getCurrentUser() {
    const user = this.readUser();

    if (!user) {
      throw new UnauthorizedApiError();
    }

    return user;
  }

  async login(request: BusinessLoginRequest) {
    if (!request.email.trim() || !request.password.trim()) {
      throw new ApiError("이메일과 비밀번호를 입력해 주세요.", 400, "INVALID_LOGIN_REQUEST");
    }

    if (request.email === "invalid@example.com") {
      throw new UnauthorizedApiError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const user: BusinessUser = {
      id: 1,
      email: request.email,
      displayName: "청담 본점 오너",
      role: "OWNER",
      status: "ACTIVE",
      restaurant: {
        id: 1,
        status: "APPROVED",
      },
    };

    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.storageKey, JSON.stringify(user));
    } else {
      this.memoryUser = user;
    }

    return user;
  }

  async logout() {
    getBrowserStorage()?.removeItem(this.storageKey);
    this.memoryUser = null;
  }

  async requestPasswordReset(request: PasswordResetRequest) {
    if (!request.email.trim()) {
      throw new ApiError("이메일을 입력해 주세요.", 400, "INVALID_PASSWORD_RESET_REQUEST");
    }

    return {
      accepted: true,
      resetToken: null,
      expiresAt: null,
    };
  }

  async getCurrentRestaurantApplication() {
    return this.readApplication();
  }

  async createRestaurantApplication(request: RestaurantApplicationSaveRequest) {
    const application = toMockApplication(1001, request);
    this.writeApplication(application);
    return application;
  }

  async updateRestaurantApplication(
    applicationId: number,
    request: RestaurantApplicationSaveRequest,
  ) {
    const previous = this.readApplication();
    const application = toMockApplication(applicationId, {
      ...fromApplication(previous),
      ...request,
    });
    this.writeApplication(application);
    return application;
  }

  async uploadBusinessFile(purpose: BusinessFilePurpose, file: File) {
    return {
      id: this.nextFileId++,
      purpose,
      visibility: purpose === "restaurant_image" ? "PUBLIC" : "PRIVATE",
      originalFilename: file.name,
      contentType: file.type || "application/octet-stream",
      byteSize: file.size,
      checksumSha256: null,
      publicUrl: purpose === "restaurant_image" ? `mock://business-files/${file.name}` : null,
      createdAt: new Date().toISOString(),
    } satisfies BusinessFileUploadResponse;
  }

  async submitRestaurantApplication(applicationId: number) {
    const application = this.readApplication();

    if (!application || application.id !== applicationId) {
      throw new ApiError("입점 신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const missing = submissionMissingFields(application);

    if (missing.length > 0) {
      throw new ApiError(
        `승인 요청 필수 정보가 부족합니다: ${missing.join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const submitted: RestaurantApplicationResponse = {
      ...application,
      status: "SUBMITTED",
      contactVerified: true,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: null,
      rejectionReason: null,
      restaurant: {
        ...application.restaurant,
        status: "APPROVAL_REQUESTED",
      },
    };
    this.writeApplication(submitted);
    return submitted;
  }

  async getCurrentRestaurant() {
    return this.readRestaurant() ?? defaultMockRestaurant();
  }

  async updateRestaurant(restaurantId: number, request: RestaurantSettingsUpdateRequest) {
    const previous = this.readRestaurant() ?? defaultMockRestaurant();

    if (previous.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const updated: RestaurantSettingsResponse = {
      ...previous,
      name: request.name ?? null,
      description: request.description ?? null,
      phone: request.phone ?? null,
      addressLine1: request.addressLine1 ?? null,
      addressLine2: request.addressLine2 ?? null,
      postalCode: request.postalCode ?? null,
      cuisineTypes: request.cuisineTypes ?? [],
      coverImageFileId: request.coverImageFileId ?? null,
    };
    this.writeRestaurant(updated);
    return updated;
  }

  async saveBusinessHours(restaurantId: number, request: BusinessHoursSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const businessHours = request.hours.map((item, index) => ({
      id: 4000 + index + 1,
      dayOfWeek: item.dayOfWeek,
      sequence: index + 1,
      opensAt: item.opensAt ?? null,
      closesAt: item.closesAt ?? null,
      closed: item.closed ?? false,
    }));
    this.writeRestaurant({ ...restaurant, businessHours });
    return businessHours;
  }

  async saveHolidayRules(restaurantId: number, request: HolidayRulesSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const holidayRules = request.rules.map((item, index) => ({
      id: 5000 + index + 1,
      type: item.type,
      dayOfWeek: item.dayOfWeek ?? null,
      dayOfMonth: item.dayOfMonth ?? null,
      weekOfMonth: item.weekOfMonth ?? null,
      date: item.date ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      reason: item.reason ?? null,
    }));
    this.writeRestaurant({ ...restaurant, holidayRules });
    return holidayRules;
  }

  async updateReservationPage(restaurantId: number, request: ReservationPageSaveRequest) {
    const restaurant = this.readRestaurant() ?? defaultMockRestaurant();

    if (restaurant.id !== restaurantId) {
      throw new ApiError("매장을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const slug = request.slug?.trim() || restaurant.slug || "cheongdam-main";
    const blockers = reservationPageBlockers(restaurant, slug);

    if (request.status === "PUBLIC" && blockers.length > 0) {
      throw new ApiError(
        `예약 페이지를 공개할 수 없습니다: ${blockers.join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const page: ReservationPageSettingsResponse = {
      id: restaurant.reservationPage?.id ?? 1,
      slug,
      status: request.status,
      publishedAt: request.status === "PUBLIC" ? new Date().toISOString() : null,
      unpublishedAt: request.status === "PRIVATE" ? new Date().toISOString() : null,
      publicUrl: `/r/${slug}`,
      publishable: blockers.length === 0,
      publishBlockers: blockers,
    };
    this.writeRestaurant({ ...restaurant, slug, reservationPage: page });
    return page;
  }

  async listReservationProducts() {
    return sortMockReservationProducts(
      this.readReservationProducts().filter((product) => product.status === "ACTIVE"),
    );
  }

  async createReservationProduct(request: ReservationProductSaveRequest) {
    const products = this.readReservationProducts();
    const product = toMockReservationProduct(nextReservationProductId(products), request);
    this.writeReservationProducts(sortMockReservationProducts([...products, product]));
    return product;
  }

  async updateReservationProduct(productId: number, request: ReservationProductSaveRequest) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const updated = toMockReservationProduct(productId, request, current);
    this.writeReservationProducts(
      sortMockReservationProducts(
        products.map((product) => (product.id === productId ? updated : product)),
      ),
    );
    return updated;
  }

  async deleteReservationProduct(productId: number) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const deleted: ReservationProductResponse = {
      ...current,
      visible: false,
      status: "DELETED",
      updatedAt: new Date().toISOString(),
    };
    this.writeReservationProducts(
      products.map((product) => (product.id === productId ? deleted : product)),
    );
  }

  async updateReservationProductPaymentPolicy(
    productId: number,
    request: ReservationProductPaymentPolicyRequest,
  ) {
    const products = this.readReservationProducts();
    const current = products.find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const policy = normalizePaymentPolicy(productId, request, current);
    const updated: ReservationProductResponse = {
      ...current,
      paymentPolicyType: policy.paymentMode,
      paymentAmount: policy.paymentAmount,
      updatedAt: policy.updatedAt,
    };
    this.writeReservationProducts(
      sortMockReservationProducts(
        products.map((product) => (product.id === productId ? updated : product)),
      ),
    );
    return policy;
  }

  async saveReservationProductCancellationPolicy(
    productId: number,
    request: ReservationProductCancellationPolicyRequest,
  ) {
    const current = this.readReservationProducts().find(
      (product) => product.id === productId && product.status === "ACTIVE",
    );

    if (!current) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const name = request.name.trim();
    const rules = request.rules.map((rule) => ({
      beforeVisitHours: rule.beforeVisitHours,
      refundRate: rule.refundRate,
    }));
    const noShowRule = {
      refundRate: request.noShowRule.refundRate,
      feeAmount: request.noShowRule.feeAmount,
    };

    if (!name) {
      throw new ApiError("취소 정책명을 입력해 주세요.", 400, "VALIDATION_ERROR");
    }

    rules.forEach((rule) => validateRefundRate(rule.refundRate));
    validateRefundRate(noShowRule.refundRate);

    if (!Number.isInteger(noShowRule.feeAmount) || noShowRule.feeAmount < 0) {
      throw new ApiError("노쇼 수수료는 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
    }

    return {
      policyId: `mock-cancel-${productId}`,
      productId,
      isActive: true,
      name,
      rules,
      noShowRule,
      updatedAt: new Date().toISOString(),
    } satisfies ReservationProductCancellationPolicyResponse;
  }

  async listBusinessReservations(query: BusinessReservationListQuery) {
    const date = query.date ?? todayDateString();
    const from = query.from ?? date;
    const to = query.to ?? date;
    const items = filterMockBusinessReservations(this.readBusinessReservations(), {
      ...query,
      date,
      from,
      to,
    });

    return {
      date,
      from,
      to,
      summary: toBusinessReservationSummary(items),
      items,
    } satisfies BusinessReservationListResponse;
  }

  async listBusinessReservationCalendar(query: BusinessReservationCalendarQuery) {
    const from = query.from ?? firstDayOfMonth(todayDateString());
    const to = query.to ?? lastDayOfMonth(from);
    const filtered = filterMockBusinessReservations(this.readBusinessReservations(), {
      ...query,
      from,
      to,
      includeCancelled: true,
    });

    return {
      from,
      to,
      days: eachDate(from, to).map((date) => {
        const items = filtered.filter((reservation) => reservation.visitDate === date);

        return {
          date,
          isOpen: true,
          reservationCount: items.length,
          partySizeTotal: items.reduce((total, item) => total + item.partySize, 0),
          confirmedCount: items.filter((item) => item.status === "CONFIRMED").length,
          modifiedCount: items.filter((item) => item.status === "MODIFIED").length,
          completedCount: items.filter((item) => item.status === "COMPLETED").length,
          cancelledCount: items.filter(isCancelledReservation).length,
          noShowCount: items.filter((item) => item.status === "NO_SHOW").length,
        };
      }),
    } satisfies BusinessReservationCalendarResponse;
  }

  async getBusinessReservationDetail(reservationId: number) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const ownerNote = this.readReservationNoteOverride(reservation.id);

    return this.toBusinessReservationDetail(
      reservation,
      ownerNote !== undefined ? { ownerNote } : {},
    );
  }

  async createManualBusinessReservation(request: BusinessManualReservationCreateRequest) {
    const normalized = normalizeManualReservationRequest(request);
    const product = this.findMockReservationProduct(normalized.productId);

    if (!product) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (normalized.startTime < "10:00:00" || normalized.startTime >= "22:00:00") {
      throw new ApiError("예약 가능한 시간이 아닙니다.", 409, "CONFLICT");
    }
    if (normalized.partySize > product.maxPartySize) {
      throw new ApiError("예약 가능한 재고가 없습니다.", 409, "CONFLICT");
    }

    const manualReservations = this.readManualReservations();
    const reservation = toMockBusinessReservation({
      id: nextBusinessReservationId([...defaultMockBusinessReservations(), ...manualReservations]),
      reservationNumber: `M${normalized.visitDate.replaceAll("-", "")}-${manualReservations.length + 1}`,
      status: "CONFIRMED",
      source: normalized.source,
      visitDate: normalized.visitDate,
      startTime: normalized.startTime,
      endTime: addMinutes(normalized.startTime, 90),
      partySize: normalized.partySize,
      productId: product.id,
      productName: product.name,
      customerId: 9000 + manualReservations.length + 1,
      customerName: normalized.customerName,
      phoneMasked: maskPhoneNumber(normalized.customerPhone),
      hasCustomerRequest: Boolean(normalized.customerRequest),
      hasOwnerNote: false,
      paymentStatus: "OFFLINE",
      paymentActionRequired: false,
    });

    this.writeManualReservations(
      sortMockBusinessReservations([...manualReservations, reservation]),
    );
    return this.toBusinessReservationDetail(reservation, {
      customerPhone: normalized.customerPhone,
      customerRequest: normalized.customerRequest,
    });
  }

  async updateBusinessReservation(
    reservationId: number,
    request: BusinessReservationUpdateRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const normalized = normalizeBusinessReservationUpdateRequest(request, reservation);
    const product = this.findMockReservationProduct(normalized.productId);

    if (!product) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (normalized.startTime < "10:00:00" || normalized.startTime >= "22:00:00") {
      throw new ApiError("예약 가능한 시간이 아닙니다.", 409, "CONFLICT");
    }
    if (normalized.partySize > product.maxPartySize) {
      throw new ApiError("예약 가능한 재고가 없습니다.", 409, "CONFLICT");
    }

    const updatedReservation = patchMockBusinessReservation(reservation, {
      status: "MODIFIED",
      visitDate: normalized.visitDate,
      startTime: normalized.startTime,
      endTime: addMinutes(normalized.startTime, 90),
      partySize: normalized.partySize,
      productId: product.id,
      productName: product.name,
    });

    this.writeBusinessReservation(updatedReservation);
    return this.toBusinessReservationDetail(updatedReservation);
  }

  async cancelBusinessReservation(
    reservationId: number,
    request: BusinessReservationCancelRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const reason = normalizeBusinessReservationCancelRequest(request);
    const cancelledReservation = patchMockBusinessReservation(reservation, {
      status: "CANCELLED_BY_RESTAURANT",
    });

    this.writeBusinessReservation(cancelledReservation);
    return this.toBusinessReservationDetail(cancelledReservation, {
      cancelReason: reason,
    });
  }

  async completeBusinessReservation(reservationId: number) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    const completedReservation = patchMockBusinessReservation(reservation, {
      status: "COMPLETED",
    });

    this.writeBusinessReservation(completedReservation);
    return this.toBusinessReservationDetail(completedReservation);
  }

  async markBusinessReservationNoShow(
    reservationId: number,
    request: BusinessReservationNoShowRequest,
  ) {
    const reservation = this.findMockBusinessReservationForAction(reservationId);
    normalizeBusinessReservationNoShowRequest(request);
    const noShowReservation = patchMockBusinessReservation(reservation, {
      status: "NO_SHOW",
    });

    this.writeBusinessReservation(noShowReservation);
    return this.toBusinessReservationDetail(noShowReservation);
  }

  async updateBusinessReservationOperationNote(
    reservationId: number,
    request: BusinessReservationOperationNoteRequest,
  ) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const ownerNote = normalizeBusinessReservationOperationNoteRequest(request);
    const updatedReservation = patchMockBusinessReservation(reservation, {
      hasOwnerNote: ownerNote !== null,
    });

    this.writeBusinessReservation(updatedReservation);
    this.writeReservationNoteOverride(reservationId, ownerNote);

    return this.toBusinessReservationDetail(updatedReservation, {
      ownerNote,
    });
  }

  async getBusinessReservationRefundPreview(reservationId: number) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return toMockBusinessReservationRefundPreview(reservation);
  }

  async listBusinessTables() {
    const items = this.readBusinessTables();

    return {
      summary: {
        totalCount: items.length,
        activeCount: items.filter((item) => item.isActive).length,
        totalCapacity: items
          .filter((item) => item.isActive)
          .reduce((total, item) => total + item.maxPartySize, 0),
        roomCount: items.filter((item) => item.seatType === "ROOM").length,
      },
      items,
    } satisfies BusinessTableListResponse;
  }

  async createBusinessTable(request: BusinessTableSaveRequest) {
    const tables = this.readBusinessTables();
    const normalized = normalizeBusinessTableRequest(request);
    const table = {
      ...normalized,
      id: nextBusinessTableId(tables),
      seatTypeLabel: businessSeatTypeLabel(normalized.seatType),
      combinationPolicyLabel: businessTableCombinationPolicyLabel(normalized.combinationPolicy),
      hasReservations: false,
      updatedAt: new Date().toISOString(),
    } satisfies BusinessTableResponse;

    this.writeBusinessTables([...tables, table]);
    return table;
  }

  async updateBusinessTable(tableId: number, request: BusinessTableSaveRequest) {
    const tables = this.readBusinessTables();
    const current = tables.find((item) => item.id === tableId);

    if (!current) {
      throw new ApiError("테이블을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const normalized = normalizeBusinessTableRequest(request, current);
    const table = {
      ...current,
      ...normalized,
      seatTypeLabel: businessSeatTypeLabel(normalized.seatType),
      combinationPolicyLabel: businessTableCombinationPolicyLabel(normalized.combinationPolicy),
      updatedAt: new Date().toISOString(),
    } satisfies BusinessTableResponse;

    this.writeBusinessTables(tables.map((item) => (item.id === table.id ? table : item)));
    return table;
  }

  async saveReservationProductSeatRules(
    productId: number,
    request: ReservationProductSeatRulesRequest,
  ) {
    const product = this.readReservationProducts().find(
      (item) => item.id === productId && item.status === "ACTIVE",
    );

    if (!product) {
      throw new ApiError("예약 상품을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const rules = toReservationProductSeatRulesResponse(
      product,
      normalizeReservationProductSeatRulesRequest(request, this.readBusinessTables()),
    );

    this.writeProductSeatRules({
      ...this.readProductSeatRules(),
      [String(productId)]: rules,
    });

    return rules;
  }

  async listBusinessTimeSlots(query: BusinessTimeSlotListQuery) {
    const date = normalizeBusinessTimeSlotDate(query.date);
    const productId = query.productId ?? null;
    const seatType = query.seatType ?? null;
    const slots = this.buildBusinessTimeSlots({ date, productId, seatType });

    return toBusinessTimeSlotListResponse(date, slots);
  }

  async closeBusinessTimeSlot(request: BusinessTimeSlotActionRequest) {
    const normalized = normalizeBusinessTimeSlotActionRequest(request);
    const slots = this.buildBusinessTimeSlots({
      date: normalized.date,
      productId: normalized.productId,
      seatType: normalized.seatType,
    });
    const slot = slots.find((item) => item.startTime === normalized.startTime);

    if (!slot) {
      throw new ApiError("임시 마감할 타임슬롯을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    this.writeTimeSlotClosures({
      ...this.readTimeSlotClosures(),
      [timeSlotClosureKey(normalized)]: normalized.reason ?? "OWNER_TEMP_CLOSE",
    });

    return {
      ...slot,
      availableCount: 0,
      status: "TEMP_CLOSED",
      statusLabel: "임시마감",
      statusTone: "warning",
      customerAvailabilityAffected: true,
      lastUpdatedAt: new Date().toISOString(),
    } satisfies BusinessTimeSlotResponse;
  }

  async reopenBusinessTimeSlot(request: BusinessTimeSlotActionRequest) {
    const normalized = normalizeBusinessTimeSlotActionRequest(request);
    const closures = this.readTimeSlotClosures();

    delete closures[timeSlotClosureKey(normalized)];
    this.writeTimeSlotClosures(closures);

    const slots = this.buildBusinessTimeSlots({
      date: normalized.date,
      productId: normalized.productId,
      seatType: normalized.seatType,
    });
    const slot = slots.find((item) => item.startTime === normalized.startTime);

    if (!slot) {
      throw new ApiError("해제할 타임슬롯을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return slot;
  }

  async listBusinessAuditLogs(query: BusinessAuditLogListQuery) {
    const targetType = query.targetType ?? null;
    const targetId = query.targetId ?? null;
    const items = this.readBusinessReservations()
      .flatMap((reservation) => toMockBusinessAuditLogs(reservation))
      .filter((item) => {
        if (targetType && item.targetType !== targetType) {
          return false;
        }
        if (targetId && item.targetId !== targetId) {
          return false;
        }

        return true;
      });

    return { items } satisfies BusinessAuditLogListResponse;
  }

  async listBusinessPayments(query: BusinessPaymentListQuery) {
    const items = defaultMockBusinessPayments().filter((payment) => {
      const paymentDate = payment.paidAt ?? payment.dueAt;

      if (query.status && payment.status !== query.status) {
        return false;
      }
      if (query.from && paymentDate && paymentDate.slice(0, 10) < query.from) {
        return false;
      }
      if (query.to && paymentDate && paymentDate.slice(0, 10) > query.to) {
        return false;
      }

      return true;
    });

    return {
      summary: {
        totalCount: items.length,
        paidAmount: items
          .filter((payment) => payment.status === "PAID")
          .reduce((total, payment) => total + payment.amount, 0),
        cardGuaranteeCount: items.filter((payment) => payment.cardGuaranteeHeld).length,
        actionRequiredCount: items.filter((payment) => payment.actionRequired).length,
      },
      items,
    } satisfies BusinessPaymentListResponse;
  }

  async listBusinessRefunds(query: BusinessRefundListQuery) {
    const items = defaultMockBusinessRefunds().filter((refund) => {
      if (query.status && refund.status !== query.status) {
        return false;
      }
      if (query.from && refund.requestedAt && refund.requestedAt.slice(0, 10) < query.from) {
        return false;
      }
      if (query.to && refund.requestedAt && refund.requestedAt.slice(0, 10) > query.to) {
        return false;
      }

      return true;
    });

    return {
      summary: {
        totalCount: items.length,
        refundAmount: items
          .filter((refund) => refund.status === "SUCCEEDED")
          .reduce((total, refund) => total + refund.refundAmount, 0),
        failedCount: items.filter((refund) => refund.status === "FAILED").length,
        actionRequiredCount: items.filter((refund) => refund.actionRequired).length,
      },
      items,
    } satisfies BusinessRefundListResponse;
  }

  async listBusinessCustomers(query: BusinessCustomerListQuery) {
    const customers = filterMockBusinessCustomers(
      toMockBusinessCustomers(this.readBusinessReservations()),
      query,
    );

    return {
      summary: {
        totalCount: customers.length,
        visitedCount: customers.filter((customer) => customer.completedCount > 0).length,
        noShowCount: customers.filter((customer) => customer.noShowCount > 0).length,
        preferenceCount: customers.filter(
          (customer) => customer.allergySummary !== null || customer.anniversarySummary !== null,
        ).length,
      },
      items: customers,
    } satisfies BusinessCustomerListResponse;
  }

  async getBusinessCustomer(customerId: number) {
    const customer = toMockBusinessCustomerDetail(this.readBusinessReservations(), customerId, {
      flagStatus: this.readCustomerFlagStatus(customerId),
      notes: this.readCustomerNotesForCustomer(customerId),
    });

    if (!customer) {
      throw new ApiError("고객을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return customer;
  }

  async listBusinessCustomerReservations(customerId: number) {
    const customer = toMockBusinessCustomerDetail(this.readBusinessReservations(), customerId, {
      flagStatus: this.readCustomerFlagStatus(customerId),
      notes: this.readCustomerNotesForCustomer(customerId),
    });

    if (!customer) {
      throw new ApiError("고객을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    return {
      items: toMockBusinessCustomerReservationHistory(this.readBusinessReservations(), customerId),
    } satisfies BusinessCustomerReservationHistoryResponse;
  }

  async createBusinessCustomerNote(customerId: number, request: BusinessCustomerNoteSaveRequest) {
    this.assertCustomerExists(customerId);
    const content = normalizeBusinessCustomerNoteRequest(request);
    const notesByCustomer = this.readAllCustomerNotes();
    const currentNotes = notesByCustomer[String(customerId)] ?? [];
    const note = {
      id: nextBusinessCustomerNoteId(notesByCustomer),
      customerId,
      content,
      authorName: "청담 본점 오너",
      createdAt: new Date().toISOString(),
      updatedAt: null,
      auditActionLabel: "메모 생성",
    } satisfies BusinessCustomerNoteResponse;

    this.writeCustomerNotes({
      ...this.readCustomerNotes(),
      [String(customerId)]: [note, ...currentNotes],
    });

    return note;
  }

  async updateBusinessCustomerNote(noteId: number, request: BusinessCustomerNoteSaveRequest) {
    const content = normalizeBusinessCustomerNoteRequest(request);
    const notesByCustomer = this.readAllCustomerNotes();
    const entry = findBusinessCustomerNoteEntry(notesByCustomer, noteId);

    if (!entry) {
      throw new ApiError("고객 메모를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const [customerId, notes] = entry;
    const updatedNote = {
      ...notes.find((note) => note.id === noteId)!,
      content,
      updatedAt: new Date().toISOString(),
      auditActionLabel: "메모 수정",
    } satisfies BusinessCustomerNoteResponse;

    this.writeCustomerNotes({
      ...this.readCustomerNotes(),
      [customerId]: notes.map((note) => (note.id === noteId ? updatedNote : note)),
    });

    return updatedNote;
  }

  async deleteBusinessCustomerNote(noteId: number) {
    const notesByCustomer = this.readAllCustomerNotes();
    const entry = findBusinessCustomerNoteEntry(notesByCustomer, noteId);

    if (!entry) {
      throw new ApiError("고객 메모를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const [customerId, notes] = entry;

    this.writeCustomerNotes({
      ...this.readCustomerNotes(),
      [customerId]: notes.filter((note) => note.id !== noteId),
    });
  }

  async updateBusinessCustomerFlags(customerId: number, request: BusinessCustomerFlagsSaveRequest) {
    this.assertCustomerExists(customerId);
    const current = this.readCustomerFlagStatus(customerId);
    const updated = {
      ...current,
      vip: request.vip ?? current.vip,
      caution: request.caution ?? current.caution,
      updatedAt: new Date().toISOString(),
    } satisfies BusinessCustomerFlagStatusResponse;

    this.writeCustomerFlags({
      ...this.readCustomerFlags(),
      [String(customerId)]: updated,
    });

    return updated;
  }

  async requestBusinessCustomerAnonymize(
    customerId: number,
    request: BusinessCustomerAnonymizeRequest,
  ) {
    this.assertCustomerExists(customerId);
    const reason = request.reason?.trim() ?? "";

    if (!request.confirm) {
      throw new ApiError("개인정보 처리 요청 확인이 필요합니다.", 400, "VALIDATION_ERROR");
    }
    if (reason.length < 5) {
      throw new ApiError("요청 사유를 5자 이상 입력해 주세요.", 400, "VALIDATION_ERROR");
    }

    return {
      accepted: true,
      customerId,
      requestedAt: new Date().toISOString(),
      notice: "개인정보 삭제/익명화 요청이 접수되었습니다. 감사 로그와 운영 검토 후 처리합니다.",
    } satisfies BusinessCustomerAnonymizeResponse;
  }

  async listBusinessCustomerDuplicateCandidates() {
    const customers = toMockBusinessCustomers(this.readBusinessReservations());
    const duplicateGroups = defaultMockBusinessCustomerDuplicateGroups()
      .map((group) => ({
        matchType: group.matchType,
        matchKeyMasked: group.matchKeyMasked,
        customers: group.customerIds
          .map((customerId) => customers.find((customer) => customer.id === customerId))
          .filter(
            (customer): customer is BusinessCustomerListItemResponse => customer !== undefined,
          )
          .map((customer) =>
            toMockBusinessCustomerDuplicateCandidateItem(
              customer,
              this.readCustomerNotesForCustomer(customer.id),
              this.readCustomerFlagStatus(customer.id),
            ),
          ),
      }))
      .filter((group) => group.customers.length > 1);

    return {
      totalGroups: duplicateGroups.length,
      groups: duplicateGroups,
    } satisfies BusinessCustomerDuplicateCandidatesResponse;
  }

  async mergeBusinessCustomers(request: BusinessCustomerMergeRequest) {
    const normalized = normalizeBusinessCustomerMergeRequest(request);
    const reservations = this.readBusinessReservations();
    const targetReservations = reservations.filter(
      (reservation) => reservation.customer.id === normalized.targetCustomerId,
    );
    const targetReservation = targetReservations[0];

    if (!targetReservation) {
      throw new ApiError("기준 고객을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    let movedReservationCount = 0;
    normalized.sourceCustomerIds.forEach((sourceCustomerId) => {
      this.assertCustomerExists(sourceCustomerId);
      reservations
        .filter((reservation) => reservation.customer.id === sourceCustomerId)
        .forEach((reservation) => {
          this.writeBusinessReservation({
            ...reservation,
            customer: {
              ...targetReservation.customer,
              id: normalized.targetCustomerId,
            },
          });
          movedReservationCount += 1;
        });
    });

    const notesByCustomer = this.readAllCustomerNotes();
    const targetNotes = notesByCustomer[String(normalized.targetCustomerId)] ?? [];
    const sourceNotes = normalized.sourceCustomerIds.flatMap(
      (sourceCustomerId) => notesByCustomer[String(sourceCustomerId)] ?? [],
    );
    const movedNoteCount = sourceNotes.length;
    this.writeCustomerNotes({
      ...this.readCustomerNotes(),
      [String(normalized.targetCustomerId)]: [
        ...sourceNotes.map((note) => ({
          ...note,
          customerId: normalized.targetCustomerId,
          auditActionLabel: "병합 이동",
        })),
        ...targetNotes,
      ],
      ...Object.fromEntries(
        normalized.sourceCustomerIds.map((sourceCustomerId) => [sourceCustomerId, []]),
      ),
    });

    const targetFlags = this.readCustomerFlagStatus(normalized.targetCustomerId);
    const sourceFlags = normalized.sourceCustomerIds.map((sourceCustomerId) =>
      this.readCustomerFlagStatus(sourceCustomerId),
    );
    const blockedFlag =
      sourceFlags.find((flag) => flag.blockedScope !== "NONE") ??
      (targetFlags.blockedScope !== "NONE" ? targetFlags : null);
    this.writeCustomerFlags({
      ...this.readCustomerFlags(),
      [String(normalized.targetCustomerId)]: {
        ...targetFlags,
        vip: targetFlags.vip || sourceFlags.some((flag) => flag.vip),
        caution: targetFlags.caution || sourceFlags.some((flag) => flag.caution),
        blockedScope: blockedFlag?.blockedScope ?? targetFlags.blockedScope,
        blockedScopeLabel: blockedFlag?.blockedScopeLabel ?? targetFlags.blockedScopeLabel,
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      targetCustomerId: normalized.targetCustomerId,
      mergedCustomerIds: normalized.sourceCustomerIds,
      movedReservationCount,
      movedNoteCount,
      anonymizedCustomerIds: normalized.sourceCustomerIds,
      warning: "고객 병합은 되돌릴 수 없으며, 병합된 고객의 개인정보는 익명화됩니다.",
    } satisfies BusinessCustomerMergeResponse;
  }

  private readBusinessReservations() {
    const overrides = new Map(
      this.readReservationOverrides().map((reservation) => [reservation.id, reservation]),
    );

    return [...defaultMockBusinessReservations(), ...this.readManualReservations()].map(
      (reservation) => overrides.get(reservation.id) ?? reservation,
    );
  }

  private toBusinessReservationDetail(
    reservation: BusinessReservationListItemResponse,
    overrides: Parameters<typeof toMockBusinessReservationDetail>[1] = {},
  ) {
    return toMockBusinessReservationDetail(reservation, {
      ...overrides,
      customerFlags: this.readCustomerFlagStatus(reservation.customer.id),
    });
  }

  private assertCustomerExists(customerId: number) {
    const exists = this.readBusinessReservations().some(
      (reservation) => reservation.customer.id === customerId,
    );

    if (!exists) {
      throw new ApiError("고객을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
  }

  private findMockBusinessReservationForAction(reservationId: number) {
    const reservation = this.readBusinessReservations().find((item) => item.id === reservationId);

    if (!reservation) {
      throw new ApiError("예약을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (!isActionableBusinessReservation(reservation.status)) {
      throw new ApiError("현재 상태에서는 처리할 수 없는 예약입니다.", 409, "CONFLICT");
    }

    return reservation;
  }

  private findMockReservationProduct(productId: number) {
    const product = this.readReservationProducts().find(
      (item) => item.id === productId && item.status === "ACTIVE",
    );

    if (product) {
      return {
        id: product.id,
        name: product.name,
        maxPartySize: product.maxPartySize,
      };
    }

    return defaultMockReservationProducts().find((item) => item.id === productId) ?? null;
  }

  private readManualReservations() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryManualReservations ?? [];
    }

    const raw = storage.getItem(this.manualReservationsStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as BusinessReservationListItemResponse[];
    } catch {
      storage.removeItem(this.manualReservationsStorageKey);
      return [];
    }
  }

  private writeManualReservations(reservations: BusinessReservationListItemResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.manualReservationsStorageKey, JSON.stringify(reservations));
    } else {
      this.memoryManualReservations = reservations;
    }
  }

  private readReservationOverrides() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryReservationOverrides ?? [];
    }

    const raw = storage.getItem(this.reservationOverridesStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as BusinessReservationListItemResponse[];
    } catch {
      storage.removeItem(this.reservationOverridesStorageKey);
      return [];
    }
  }

  private writeReservationOverrides(reservations: BusinessReservationListItemResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.reservationOverridesStorageKey, JSON.stringify(reservations));
    } else {
      this.memoryReservationOverrides = reservations;
    }
  }

  private readReservationNoteOverrides() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryReservationNotes ?? {};
    }

    const raw = storage.getItem(this.reservationNotesStorageKey);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, string | null>;
    } catch {
      storage.removeItem(this.reservationNotesStorageKey);
      return {};
    }
  }

  private readReservationNoteOverride(reservationId: number) {
    const notes = this.readReservationNoteOverrides();
    const key = String(reservationId);

    return Object.prototype.hasOwnProperty.call(notes, key) ? notes[key] : undefined;
  }

  private writeReservationNoteOverride(reservationId: number, ownerNote: string | null) {
    const notes = {
      ...this.readReservationNoteOverrides(),
      [reservationId]: ownerNote,
    };
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.reservationNotesStorageKey, JSON.stringify(notes));
    } else {
      this.memoryReservationNotes = notes;
    }
  }

  private readCustomerFlagStatus(customerId: number) {
    return (
      this.readCustomerFlags()[String(customerId)] ??
      defaultMockBusinessCustomerFlagStatus(customerId)
    );
  }

  private readCustomerFlags() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryCustomerFlags ?? {};
    }

    const raw = storage.getItem(this.customerFlagsStorageKey);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, BusinessCustomerFlagStatusResponse>;
    } catch {
      storage.removeItem(this.customerFlagsStorageKey);
      return {};
    }
  }

  private writeCustomerFlags(flags: Record<string, BusinessCustomerFlagStatusResponse>) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.customerFlagsStorageKey, JSON.stringify(flags));
    } else {
      this.memoryCustomerFlags = flags;
    }
  }

  private readCustomerNotesForCustomer(customerId: number) {
    return this.readAllCustomerNotes()[String(customerId)] ?? [];
  }

  private readAllCustomerNotes() {
    return {
      ...defaultMockBusinessCustomerNotes(),
      ...this.readCustomerNotes(),
    };
  }

  private readCustomerNotes() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryCustomerNotes ?? {};
    }

    const raw = storage.getItem(this.customerNotesStorageKey);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, BusinessCustomerNoteResponse[]>;
    } catch {
      storage.removeItem(this.customerNotesStorageKey);
      return {};
    }
  }

  private writeCustomerNotes(notes: Record<string, BusinessCustomerNoteResponse[]>) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.customerNotesStorageKey, JSON.stringify(notes));
    } else {
      this.memoryCustomerNotes = notes;
    }
  }

  private writeBusinessReservation(reservation: BusinessReservationListItemResponse) {
    const manualReservations = this.readManualReservations();
    const manualIndex = manualReservations.findIndex((item) => item.id === reservation.id);

    if (manualIndex >= 0) {
      const nextManualReservations = [...manualReservations];
      nextManualReservations[manualIndex] = reservation;
      this.writeManualReservations(sortMockBusinessReservations(nextManualReservations));
      return;
    }

    this.writeReservationOverrides([
      ...this.readReservationOverrides().filter((item) => item.id !== reservation.id),
      reservation,
    ]);
  }

  private readUser() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryUser;
    }

    const raw = storage.getItem(this.storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as BusinessUser;
    } catch {
      storage.removeItem(this.storageKey);
      return null;
    }
  }

  private readApplication() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryApplication;
    }

    const raw = storage.getItem(this.applicationStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RestaurantApplicationResponse;
    } catch {
      storage.removeItem(this.applicationStorageKey);
      return null;
    }
  }

  private writeApplication(application: RestaurantApplicationResponse) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.applicationStorageKey, JSON.stringify(application));
    } else {
      this.memoryApplication = application;
    }
  }

  private readRestaurant() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryRestaurant;
    }

    const raw = storage.getItem(this.restaurantStorageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RestaurantSettingsResponse;
    } catch {
      storage.removeItem(this.restaurantStorageKey);
      return null;
    }
  }

  private writeRestaurant(restaurant: RestaurantSettingsResponse) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.restaurantStorageKey, JSON.stringify(restaurant));
    } else {
      this.memoryRestaurant = restaurant;
    }
  }

  private readReservationProducts() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryReservationProducts ?? [];
    }

    const raw = storage.getItem(this.reservationProductsStorageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ReservationProductResponse[];
    } catch {
      storage.removeItem(this.reservationProductsStorageKey);
      return [];
    }
  }

  private writeReservationProducts(products: ReservationProductResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.reservationProductsStorageKey, JSON.stringify(products));
    } else {
      this.memoryReservationProducts = products;
    }
  }

  private readBusinessTables() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryBusinessTables ?? defaultMockBusinessTables();
    }

    const raw = storage.getItem(this.businessTablesStorageKey);

    if (!raw) {
      return defaultMockBusinessTables();
    }

    try {
      return JSON.parse(raw) as BusinessTableResponse[];
    } catch {
      storage.removeItem(this.businessTablesStorageKey);
      return defaultMockBusinessTables();
    }
  }

  private writeBusinessTables(tables: BusinessTableResponse[]) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.businessTablesStorageKey, JSON.stringify(tables));
    } else {
      this.memoryBusinessTables = tables;
    }
  }

  private buildBusinessTimeSlots({
    date,
    productId,
    seatType,
  }: {
    date: string;
    productId?: number | null;
    seatType?: BusinessSeatType | null;
  }) {
    const products = businessTimeSlotProducts(this.readReservationProducts()).filter((product) => {
      if (productId && product.id !== productId) {
        return false;
      }

      return product.status === "ACTIVE";
    });
    const seatTypes = activeBusinessSeatTypes(this.readBusinessTables()).filter(
      (item) => !seatType || item === seatType,
    );
    const reservations = this.readBusinessReservations().filter(
      (reservation) =>
        reservation.visitDate === date &&
        reservation.status !== "CANCELLED_BY_CUSTOMER" &&
        reservation.status !== "CANCELLED_BY_RESTAURANT",
    );
    const closures = this.readTimeSlotClosures();

    return products
      .flatMap((product) =>
        seatTypes.flatMap((slotSeatType) =>
          businessTimeSlotStartTimes(product).map((startTime) =>
            toBusinessTimeSlotResponse({
              date,
              product,
              seatType: slotSeatType,
              startTime,
              reservations,
              closures,
            }),
          ),
        ),
      )
      .sort((a, b) => {
        const timeDiff = a.startTime.localeCompare(b.startTime);

        if (timeDiff !== 0) {
          return timeDiff;
        }

        const productDiff = a.productName.localeCompare(b.productName);

        if (productDiff !== 0) {
          return productDiff;
        }

        return a.seatTypeLabel.localeCompare(b.seatTypeLabel);
      });
  }

  private readTimeSlotClosures() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryTimeSlotClosures ?? {};
    }

    const raw = storage.getItem(this.timeSlotClosuresStorageKey);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      storage.removeItem(this.timeSlotClosuresStorageKey);
      return {};
    }
  }

  private writeTimeSlotClosures(closures: Record<string, string>) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.timeSlotClosuresStorageKey, JSON.stringify(closures));
    } else {
      this.memoryTimeSlotClosures = closures;
    }
  }

  private readProductSeatRules() {
    const storage = getBrowserStorage();

    if (!storage) {
      return this.memoryProductSeatRules ?? {};
    }

    const raw = storage.getItem(this.productSeatRulesStorageKey);

    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, ReservationProductSeatRulesResponse>;
    } catch {
      storage.removeItem(this.productSeatRulesStorageKey);
      return {};
    }
  }

  private writeProductSeatRules(rules: Record<string, ReservationProductSeatRulesResponse>) {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(this.productSeatRulesStorageKey, JSON.stringify(rules));
    } else {
      this.memoryProductSeatRules = rules;
    }
  }
}

function queryString(query: object) {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();

  return serialized ? `?${serialized}` : "";
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {
      message: response.statusText,
    };
  }
}

export function createBusinessApiClient(): BusinessApiClient {
  const mode = import.meta.env.VITE_BUSINESS_API_MODE ?? "mock";

  if (mode === "http") {
    return new HttpBusinessApiClient(import.meta.env.VITE_BUSINESS_API_BASE_URL);
  }

  return new MockBusinessApiClient();
}

function getBrowserStorage() {
  const storage = typeof window === "undefined" ? null : window.localStorage;

  if (
    storage &&
    typeof storage.getItem === "function" &&
    typeof storage.setItem === "function" &&
    typeof storage.removeItem === "function"
  ) {
    return storage;
  }

  return null;
}

function toMockApplication(
  id: number,
  request: RestaurantApplicationSaveRequest,
): RestaurantApplicationResponse {
  return {
    id,
    status: "DRAFT",
    restaurant: {
      id: 2001,
      status: "DRAFT",
      name: request.restaurantName ?? null,
      slug: null,
      description: request.restaurantDescription ?? null,
      phone: request.restaurantPhone ?? null,
      addressLine1: request.addressLine1 ?? null,
      addressLine2: request.addressLine2 ?? null,
      postalCode: request.postalCode ?? null,
      cuisineTypes: request.cuisineTypes ?? [],
      coverImageFileId: request.coverImageFileId ?? null,
      timezone: "Asia/Seoul",
    },
    businessRegistrationNo: request.businessRegistrationNo ?? null,
    businessName: request.businessName ?? null,
    representativeName: request.representativeName ?? null,
    businessAddress: request.businessAddress ?? null,
    businessLicenseFileId: request.businessLicenseFileId ?? null,
    managerName: request.managerName ?? null,
    managerPhone: request.managerPhone ?? null,
    managerEmail: request.managerEmail ?? null,
    contactVerified: request.contactVerified ?? false,
    submittedAt: null,
    reviewedAt: null,
    reviewNote: null,
    rejectionReason: null,
  };
}

function fromApplication(
  application: RestaurantApplicationResponse | null,
): RestaurantApplicationSaveRequest {
  if (!application) {
    return {};
  }

  return {
    restaurantName: application.restaurant.name,
    restaurantDescription: application.restaurant.description,
    restaurantPhone: application.restaurant.phone,
    addressLine1: application.restaurant.addressLine1,
    addressLine2: application.restaurant.addressLine2,
    postalCode: application.restaurant.postalCode,
    cuisineTypes: application.restaurant.cuisineTypes,
    coverImageFileId: application.restaurant.coverImageFileId,
    businessRegistrationNo: application.businessRegistrationNo,
    businessName: application.businessName,
    representativeName: application.representativeName,
    businessAddress: application.businessAddress,
    businessLicenseFileId: application.businessLicenseFileId,
    managerName: application.managerName,
    managerPhone: application.managerPhone,
    managerEmail: application.managerEmail,
    contactVerified: application.contactVerified,
  };
}

function submissionMissingFields(application: RestaurantApplicationResponse) {
  const missing: string[] = [];

  if (!application.restaurant.name?.trim()) missing.push("restaurantName");
  if (!application.restaurant.phone?.trim()) missing.push("restaurantPhone");
  if (!application.restaurant.addressLine1?.trim()) missing.push("addressLine1");
  if (application.restaurant.cuisineTypes.length === 0) missing.push("cuisineTypes");
  if (!application.businessRegistrationNo?.trim()) missing.push("businessRegistrationNo");
  if (!application.businessName?.trim()) missing.push("businessName");
  if (!application.representativeName?.trim()) missing.push("representativeName");
  if (!application.businessAddress?.trim()) missing.push("businessAddress");
  if (!application.businessLicenseFileId) missing.push("businessLicenseFileId");
  if (!application.managerName?.trim()) missing.push("managerName");
  if (!application.managerPhone?.trim()) missing.push("managerPhone");
  if (!application.contactVerified) missing.push("contactVerified");

  return missing;
}

function defaultMockRestaurant(): RestaurantSettingsResponse {
  return {
    id: 1,
    status: "APPROVED",
    name: "청담 본점",
    slug: "cheongdam-main",
    description: "제철 식재료로 준비하는 예약제 다이닝입니다.",
    phone: "02-1234-5678",
    addressLine1: "서울시 강남구 테스트로 1",
    addressLine2: "2층",
    postalCode: "06000",
    cuisineTypes: ["한식", "코스"],
    coverImageFileId: null,
    timezone: "Asia/Seoul",
    approvedAt: new Date().toISOString(),
    reservationPage: {
      id: 1,
      slug: "cheongdam-main",
      status: "PRIVATE",
      publishedAt: null,
      unpublishedAt: null,
      publicUrl: "/r/cheongdam-main",
      publishable: false,
      publishBlockers: ["businessHours"],
    },
    businessHours: [],
    holidayRules: [],
  };
}

function reservationPageBlockers(restaurant: RestaurantSettingsResponse, slug: string) {
  const blockers: string[] = [];

  if (restaurant.status !== "APPROVED") blockers.push("restaurantStatus");
  if (!restaurant.name?.trim()) blockers.push("name");
  if (!restaurant.phone?.trim()) blockers.push("phone");
  if (!restaurant.addressLine1?.trim()) blockers.push("addressLine1");
  if (restaurant.cuisineTypes.length === 0) blockers.push("cuisineTypes");
  if (!slug.trim()) blockers.push("slug");
  if (restaurant.businessHours.length === 0) blockers.push("businessHours");

  return blockers;
}

const defaultReservationProductDays: BusinessDayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function toMockReservationProduct(
  id: number,
  request: ReservationProductSaveRequest,
  current?: ReservationProductResponse,
): ReservationProductResponse {
  const now = new Date().toISOString();
  const name = request.name === undefined ? (current?.name ?? "") : (request.name?.trim() ?? "");
  const description =
    request.description === undefined
      ? (current?.description ?? null)
      : trimToNull(request.description);
  const priceAmount = request.priceAmount ?? current?.priceAmount ?? 0;
  const minPartySize = request.minPartySize ?? current?.minPartySize ?? 1;
  const maxPartySize = request.maxPartySize ?? current?.maxPartySize ?? minPartySize;
  const slotCapacity = request.slotCapacity ?? current?.slotCapacity ?? 1;
  const availableStartTime =
    request.availableStartTime === undefined
      ? (current?.availableStartTime ?? null)
      : trimToNull(request.availableStartTime);
  const availableEndTime =
    request.availableEndTime === undefined
      ? (current?.availableEndTime ?? null)
      : trimToNull(request.availableEndTime);

  if (!name) {
    throw new ApiError("상품명이 필요합니다.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(priceAmount) || priceAmount < 0) {
    throw new ApiError("가격은 0 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (
    !Number.isInteger(minPartySize) ||
    !Number.isInteger(maxPartySize) ||
    minPartySize < 1 ||
    maxPartySize < 1 ||
    minPartySize > maxPartySize
  ) {
    throw new ApiError("예약 인원 범위가 올바르지 않습니다.", 400, "VALIDATION_ERROR");
  }
  if (maxPartySize > 20) {
    throw new ApiError("단체 예약 상품은 MVP 범위에서 제외됩니다.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(slotCapacity) || slotCapacity < 1) {
    throw new ApiError("슬롯 재고는 1 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (Boolean(availableStartTime) !== Boolean(availableEndTime)) {
    throw new ApiError("예약 가능 시작/종료 시간을 함께 입력해야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (availableStartTime && availableEndTime && availableStartTime >= availableEndTime) {
    throw new ApiError(
      "예약 가능 시작 시간은 종료 시간보다 빨라야 합니다.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return {
    id,
    restaurantId: current?.restaurantId ?? 1,
    name,
    description,
    priceAmount,
    visible: request.visible ?? current?.visible ?? true,
    status: current?.status ?? "ACTIVE",
    minPartySize,
    maxPartySize,
    availableDays: normalizeReservationProductDays(request.availableDays, current),
    availableStartTime,
    availableEndTime,
    slotCapacity,
    paymentPolicyType: current?.paymentPolicyType ?? "NONE",
    paymentAmount: current?.paymentAmount ?? null,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeReservationProductDays(
  requestedDays: BusinessDayOfWeek[] | null | undefined,
  current?: ReservationProductResponse,
) {
  if (requestedDays === undefined) {
    return current?.availableDays ?? defaultReservationProductDays;
  }

  if (!requestedDays || requestedDays.length === 0) {
    return defaultReservationProductDays;
  }

  return Array.from(new Set(requestedDays));
}

function nextReservationProductId(products: ReservationProductResponse[]) {
  return products.reduce((maxId, product) => Math.max(maxId, product.id), 6000) + 1;
}

function sortMockReservationProducts(products: ReservationProductResponse[]) {
  return [...products].sort((a, b) => {
    const createdAtDiff = timestamp(b.createdAt) - timestamp(a.createdAt);

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return b.id - a.id;
  });
}

function timestamp(value: string | null) {
  return value ? Date.parse(value) || 0 : 0;
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePaymentPolicy(
  productId: number,
  request: ReservationProductPaymentPolicyRequest,
  product: ReservationProductResponse,
): ReservationProductPaymentPolicyResponse {
  const paymentAmount = request.paymentAmount ?? null;
  const noShowFeeAmount = request.noShowFeeAmount ?? null;

  if (paymentAmount !== null && (!Number.isInteger(paymentAmount) || paymentAmount < 0)) {
    throw new ApiError("결제 금액은 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (noShowFeeAmount !== null && (!Number.isInteger(noShowFeeAmount) || noShowFeeAmount < 0)) {
    throw new ApiError("노쇼 수수료는 0 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }

  if (request.paymentMode === "DEPOSIT" && (!paymentAmount || paymentAmount < 1)) {
    throw new ApiError("예약금은 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (request.paymentMode === "PREPAY" && product.priceAmount < 1) {
    throw new ApiError("전액 선결제 상품은 가격이 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (request.paymentMode === "CARD_GUARANTEE" && (!noShowFeeAmount || noShowFeeAmount < 1)) {
    throw new ApiError("카드 보증 수수료는 1원 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    productId,
    paymentMode: request.paymentMode,
    depositType:
      request.paymentMode === "DEPOSIT" ? (request.depositType ?? "PER_RESERVATION") : null,
    paymentAmount:
      request.paymentMode === "DEPOSIT"
        ? paymentAmount
        : request.paymentMode === "PREPAY"
          ? product.priceAmount
          : null,
    noShowFeeAmount: request.paymentMode === "CARD_GUARANTEE" ? noShowFeeAmount : null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBusinessTableRequest(
  request: BusinessTableSaveRequest,
  current?: BusinessTableResponse,
) {
  const name = request.name !== undefined ? request.name?.trim() : current?.name;
  const seatType = request.seatType ?? current?.seatType ?? "HALL";
  const minPartySize = request.minPartySize ?? current?.minPartySize ?? 1;
  const maxPartySize = request.maxPartySize ?? current?.maxPartySize ?? 2;
  const combinationPolicy = request.combinationPolicy ?? current?.combinationPolicy ?? "NONE";

  if (!name) {
    throw new ApiError("테이블명을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (name.length > 30) {
    throw new ApiError("테이블명은 30자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (!isBusinessSeatType(seatType)) {
    throw new ApiError("좌석 유형을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (
    !Number.isInteger(minPartySize) ||
    !Number.isInteger(maxPartySize) ||
    minPartySize < 1 ||
    maxPartySize < 1
  ) {
    throw new ApiError("수용 인원은 1명 이상 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (minPartySize > maxPartySize) {
    throw new ApiError(
      "최소 수용 인원은 최대 수용 인원보다 클 수 없습니다.",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (maxPartySize > 20) {
    throw new ApiError(
      "대형 단체 예약 테이블은 현재 범위에서 제외됩니다.",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (!isBusinessTableCombinationPolicy(combinationPolicy)) {
    throw new ApiError("테이블 조합 범위를 선택해 주세요.", 400, "VALIDATION_ERROR");
  }

  return {
    name,
    seatType,
    minPartySize,
    maxPartySize,
    isActive: request.isActive ?? current?.isActive ?? true,
    combinationPolicy,
  };
}

function normalizeReservationProductSeatRulesRequest(
  request: ReservationProductSeatRulesRequest,
  tables: BusinessTableResponse[],
) {
  const activeTables = tables.filter((table) => table.isActive);
  const allowedSeatTypes = Array.from(new Set(request.allowedSeatTypes ?? []));
  const defaultDurationMinutes = request.defaultDurationMinutes ?? 90;
  const slotIntervalMinutes = request.slotIntervalMinutes ?? 30;
  const requestedTableIds = Array.from(new Set(request.allowedTableIds ?? []));

  if (allowedSeatTypes.length === 0) {
    throw new ApiError("허용 좌석 유형을 하나 이상 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (allowedSeatTypes.some((seatType) => !isBusinessSeatType(seatType))) {
    throw new ApiError("허용 좌석 유형을 다시 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (activeTables.length === 0) {
    throw new ApiError("사용 중인 테이블이 없습니다.", 400, "VALIDATION_ERROR");
  }
  if (
    !Number.isInteger(defaultDurationMinutes) ||
    defaultDurationMinutes < 30 ||
    defaultDurationMinutes > 360
  ) {
    throw new ApiError(
      "기본 이용 시간은 30분부터 360분까지 입력해 주세요.",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (![15, 30, 60].includes(slotIntervalMinutes)) {
    throw new ApiError("슬롯 간격은 15분, 30분, 60분 중 하나여야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (defaultDurationMinutes % slotIntervalMinutes !== 0) {
    throw new ApiError("기본 이용 시간은 슬롯 간격의 배수여야 합니다.", 400, "VALIDATION_ERROR");
  }

  const tableIds = requestedTableIds.length
    ? requestedTableIds
    : activeTables
        .filter((table) => allowedSeatTypes.includes(table.seatType))
        .map((table) => table.id);
  const allowedTables = tableIds.map((tableId) =>
    activeTables.find((table) => table.id === tableId),
  );

  if (allowedTables.some((table) => !table)) {
    throw new ApiError("연결할 테이블을 다시 선택해 주세요.", 400, "VALIDATION_ERROR");
  }

  const selectedTables = allowedTables.filter(Boolean) as BusinessTableResponse[];

  if (selectedTables.length === 0) {
    throw new ApiError("연결할 테이블을 하나 이상 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (selectedTables.some((table) => !allowedSeatTypes.includes(table.seatType))) {
    throw new ApiError(
      "연결 테이블의 좌석 유형이 허용 유형에 포함되어야 합니다.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return {
    allowedSeatTypes,
    allowedTables: selectedTables,
    defaultDurationMinutes,
    slotIntervalMinutes,
  };
}

function toReservationProductSeatRulesResponse(
  product: ReservationProductResponse,
  rules: ReturnType<typeof normalizeReservationProductSeatRulesRequest>,
): ReservationProductSeatRulesResponse {
  const maxSingleTableSize = rules.allowedTables.reduce(
    (maxPartySize, table) => Math.max(maxPartySize, table.maxPartySize),
    0,
  );
  const seatTypeLabels = rules.allowedSeatTypes.map(businessSeatTypeLabel);
  const capacitySummary =
    product.maxPartySize > maxSingleTableSize
      ? `상품 최대 ${product.maxPartySize}명은 단일 테이블 최대 ${maxSingleTableSize}명을 초과하므로 조합 정책 확인이 필요합니다.`
      : `상품 인원 ${product.minPartySize}-${product.maxPartySize}명을 단일 테이블로 수용할 수 있습니다.`;
  const tableCombinationSummary = productSeatRulesCombinationSummary(rules.allowedTables);

  return {
    productId: product.id,
    allowedSeatTypes: rules.allowedSeatTypes,
    allowedSeatTypeLabels: seatTypeLabels,
    allowedTableIds: rules.allowedTables.map((table) => table.id),
    allowedTables: rules.allowedTables.map((table) => ({
      id: table.id,
      name: table.name,
      seatTypeLabel: table.seatTypeLabel,
      maxPartySize: table.maxPartySize,
      combinationPolicyLabel: table.combinationPolicyLabel,
    })),
    defaultDurationMinutes: rules.defaultDurationMinutes,
    slotIntervalMinutes: rules.slotIntervalMinutes,
    tableCombinationSummary,
    summary: `${product.name}: ${seatTypeLabels.join(", ")} 좌석, 기본 ${rules.defaultDurationMinutes}분, ${rules.slotIntervalMinutes}분 간격. ${capacitySummary}`,
    updatedAt: new Date().toISOString(),
  };
}

function productSeatRulesCombinationSummary(tables: BusinessTableResponse[]) {
  const policyLabels = Array.from(new Set(tables.map((table) => table.combinationPolicyLabel)));
  const maxSingleTableSize = tables.reduce(
    (maxPartySize, table) => Math.max(maxPartySize, table.maxPartySize),
    0,
  );

  return `테이블 조합 가능 범위: ${policyLabels.join(", ")} · 단일 테이블 최대 ${maxSingleTableSize}명`;
}

function toBusinessTimeSlotListResponse(
  date: string,
  items: BusinessTimeSlotResponse[],
): BusinessTimeSlotListResponse {
  return {
    date,
    summary: {
      totalCount: items.length,
      availableCount: items.filter((item) => item.status === "AVAILABLE").length,
      closedCount: items.filter((item) => item.status === "CLOSED").length,
      tempClosedCount: items.filter((item) => item.status === "TEMP_CLOSED").length,
      duplicateGuardedCount: items.filter((item) => item.duplicateGuarded).length,
    },
    items,
  };
}

function toBusinessTimeSlotResponse({
  date,
  product,
  seatType,
  startTime,
  reservations,
  closures,
}: {
  date: string;
  product: ReservationProductResponse;
  seatType: BusinessSeatType;
  startTime: string;
  reservations: BusinessReservationListItemResponse[];
  closures: Record<string, string>;
}): BusinessTimeSlotResponse {
  const key = timeSlotClosureKey({ date, productId: product.id, seatType, startTime });
  const reservedCount = reservations
    .filter(
      (reservation) => reservation.productId === product.id && reservation.startTime === startTime,
    )
    .reduce((total, reservation) => total + reservation.partySize, 0);
  const isTemporarilyClosed = Boolean(closures[key]);
  const availableCount = isTemporarilyClosed
    ? 0
    : Math.max(product.slotCapacity - reservedCount, 0);
  const status: BusinessTimeSlotStatus = isTemporarilyClosed
    ? "TEMP_CLOSED"
    : availableCount === 0
      ? "CLOSED"
      : "AVAILABLE";

  return {
    id: key,
    date,
    startTime,
    endTime: addMinutes(startTime, 90),
    productId: product.id,
    productName: product.name,
    seatType,
    seatTypeLabel: businessSeatTypeLabel(seatType),
    capacity: product.slotCapacity,
    reservedCount,
    availableCount,
    status,
    statusLabel: businessTimeSlotStatusLabel(status),
    statusTone: businessTimeSlotStatusTone(status),
    duplicateGuarded: true,
    customerAvailabilityAffected: status !== "AVAILABLE",
    lastUpdatedAt: new Date().toISOString(),
  };
}

function normalizeBusinessTimeSlotDate(value: string | null | undefined) {
  const date = value?.trim() || todayDateString();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError("조회 날짜를 다시 선택해 주세요.", 400, "VALIDATION_ERROR");
  }

  return date;
}

function normalizeBusinessTimeSlotActionRequest(request: BusinessTimeSlotActionRequest) {
  const date = normalizeBusinessTimeSlotDate(request.date);
  const productId = request.productId ?? 0;
  const seatType = request.seatType ?? "";
  const startTime = normalizeTime(request.startTime) ?? "";
  const reason = request.reason?.trim() || "OWNER_TEMP_CLOSE";

  if (!Number.isInteger(productId) || productId < 1) {
    throw new ApiError("예약 상품을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!isBusinessSeatType(seatType)) {
    throw new ApiError("좌석 유형을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError("타임슬롯 시간을 다시 선택해 주세요.", 400, "VALIDATION_ERROR");
  }

  return {
    date,
    productId,
    seatType,
    startTime,
    reason,
  };
}

function timeSlotClosureKey({
  date,
  productId,
  seatType,
  startTime,
}: {
  date: string;
  productId: number;
  seatType: BusinessSeatType;
  startTime: string;
}) {
  return `${date}:${productId}:${seatType}:${startTime}`;
}

function businessTimeSlotProducts(products: ReservationProductResponse[]) {
  return products.length > 0 ? products : defaultBusinessTimeSlotProducts();
}

function activeBusinessSeatTypes(tables: BusinessTableResponse[]) {
  return Array.from(
    new Set(tables.filter((table) => table.isActive).map((table) => table.seatType)),
  );
}

function businessTimeSlotStartTimes(product: ReservationProductResponse) {
  const start = normalizeTime(product.availableStartTime) ?? "11:30:00";
  const end = normalizeTime(product.availableEndTime) ?? "21:00:00";
  const times: string[] = [];
  let current = start;

  while (current < end && times.length < 20) {
    times.push(current);
    current = addMinutes(current, 30);
  }

  return times;
}

function businessTimeSlotStatusLabel(status: BusinessTimeSlotStatus) {
  const labels: Record<BusinessTimeSlotStatus, string> = {
    AVAILABLE: "예약 가능",
    CLOSED: "마감",
    TEMP_CLOSED: "임시마감",
  };

  return labels[status];
}

function businessTimeSlotStatusTone(status: BusinessTimeSlotStatus) {
  const tones: Record<BusinessTimeSlotStatus, string> = {
    AVAILABLE: "success",
    CLOSED: "danger",
    TEMP_CLOSED: "warning",
  };

  return tones[status];
}

function nextBusinessTableId(tables: BusinessTableResponse[]) {
  return tables.reduce((maxId, table) => Math.max(maxId, table.id), 4000) + 1;
}

function isBusinessSeatType(value: string): value is BusinessSeatType {
  return ["HALL", "ROOM", "BAR", "TERRACE"].includes(value);
}

function isBusinessTableCombinationPolicy(value: string): value is BusinessTableCombinationPolicy {
  return ["NONE", "ADJACENT", "SAME_TYPE"].includes(value);
}

function businessSeatTypeLabel(value: BusinessSeatType) {
  const labels: Record<BusinessSeatType, string> = {
    HALL: "홀",
    ROOM: "룸",
    BAR: "바",
    TERRACE: "테라스",
  };

  return labels[value];
}

function businessTableCombinationPolicyLabel(value: BusinessTableCombinationPolicy) {
  const labels: Record<BusinessTableCombinationPolicy, string> = {
    NONE: "단독 사용",
    ADJACENT: "인접 테이블 조합",
    SAME_TYPE: "같은 좌석 유형 조합",
  };

  return labels[value];
}

function validateRefundRate(refundRate: number) {
  if (!Number.isInteger(refundRate) || refundRate < 0 || refundRate > 100) {
    throw new ApiError("환불율은 0부터 100 사이 정수로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
}

function defaultMockBusinessTables(): BusinessTableResponse[] {
  const updatedAt = new Date().toISOString();

  return [
    {
      id: 4001,
      name: "홀 A1",
      seatType: "HALL",
      seatTypeLabel: "홀",
      minPartySize: 1,
      maxPartySize: 2,
      isActive: true,
      combinationPolicy: "ADJACENT",
      combinationPolicyLabel: "인접 테이블 조합",
      hasReservations: true,
      updatedAt,
    },
    {
      id: 4002,
      name: "홀 A2",
      seatType: "HALL",
      seatTypeLabel: "홀",
      minPartySize: 2,
      maxPartySize: 4,
      isActive: true,
      combinationPolicy: "ADJACENT",
      combinationPolicyLabel: "인접 테이블 조합",
      hasReservations: false,
      updatedAt,
    },
    {
      id: 4003,
      name: "룸 1",
      seatType: "ROOM",
      seatTypeLabel: "룸",
      minPartySize: 3,
      maxPartySize: 6,
      isActive: true,
      combinationPolicy: "SAME_TYPE",
      combinationPolicyLabel: "같은 좌석 유형 조합",
      hasReservations: true,
      updatedAt,
    },
    {
      id: 4004,
      name: "바 1",
      seatType: "BAR",
      seatTypeLabel: "바",
      minPartySize: 1,
      maxPartySize: 1,
      isActive: false,
      combinationPolicy: "NONE",
      combinationPolicyLabel: "단독 사용",
      hasReservations: false,
      updatedAt,
    },
  ];
}

function defaultMockBusinessReservations(): BusinessReservationListItemResponse[] {
  const today = todayDateString();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  return [
    toMockBusinessReservation({
      id: 7001,
      reservationNumber: "RSV-7001",
      status: "CONFIRMED",
      source: "ONLINE",
      visitDate: today,
      startTime: "11:30:00",
      endTime: "13:00:00",
      partySize: 2,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8001,
      customerName: "김예약",
      phoneMasked: "010-****-5678",
      hasCustomerRequest: true,
      hasOwnerNote: false,
      paymentStatus: "PAID",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7002,
      reservationNumber: "RSV-7002",
      status: "MODIFIED",
      source: "MANUAL_PHONE",
      visitDate: today,
      startTime: "13:00:00",
      endTime: "14:30:00",
      partySize: 4,
      productId: 6002,
      productName: "런치 코스",
      customerId: 8002,
      customerName: "이수정",
      phoneMasked: "010-****-9988",
      hasCustomerRequest: false,
      hasOwnerNote: true,
      paymentStatus: "OFFLINE",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7003,
      reservationNumber: "RSV-7003",
      status: "CANCELLED_BY_CUSTOMER",
      source: "ONLINE",
      visitDate: today,
      startTime: "18:30:00",
      endTime: "20:00:00",
      partySize: 3,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8003,
      customerName: "박취소",
      phoneMasked: "010-****-0000",
      hasCustomerRequest: false,
      hasOwnerNote: false,
      paymentStatus: "REFUND_PENDING",
      paymentActionRequired: true,
    }),
    toMockBusinessReservation({
      id: 7004,
      reservationNumber: "RSV-7004",
      status: "COMPLETED",
      source: "MANUAL_WALK_IN",
      visitDate: tomorrow,
      startTime: "12:00:00",
      endTime: "13:30:00",
      partySize: 2,
      productId: 6002,
      productName: "런치 코스",
      customerId: 8004,
      customerName: "최방문",
      phoneMasked: "010-****-1122",
      hasCustomerRequest: false,
      hasOwnerNote: true,
      paymentStatus: "PAID",
      paymentActionRequired: false,
    }),
    toMockBusinessReservation({
      id: 7005,
      reservationNumber: "RSV-7005",
      status: "NO_SHOW",
      source: "ONLINE",
      visitDate: nextWeek,
      startTime: "19:00:00",
      endTime: "20:30:00",
      partySize: 2,
      productId: 6001,
      productName: "디너 코스",
      customerId: 8005,
      customerName: "오민준",
      phoneMasked: "010-****-4455",
      hasCustomerRequest: true,
      hasOwnerNote: true,
      paymentStatus: "CARD_GUARANTEE",
      paymentActionRequired: true,
    }),
  ];
}

interface MockBusinessCustomerProfile {
  phoneNumber: string;
  allergies: string[];
  anniversaries: BusinessCustomerAnniversaryResponse[];
  recentRequests: string[];
  historicalVisitCount: number;
  historicalNoShowCount: number;
}

function defaultMockBusinessCustomerProfiles(): Record<number, MockBusinessCustomerProfile> {
  return {
    8001: {
      phoneNumber: "010-1234-5678",
      allergies: ["갑각류"],
      anniversaries: [{ label: "결혼기념일", date: "06-18" }],
      recentRequests: ["창가 좌석 요청", "갑각류 알레르기 확인 필요"],
      historicalVisitCount: 4,
      historicalNoShowCount: 0,
    },
    8002: {
      phoneNumber: "010-8899-9988",
      allergies: [],
      anniversaries: [{ label: "생일", date: "11-02" }],
      recentRequests: ["조용한 좌석 선호"],
      historicalVisitCount: 2,
      historicalNoShowCount: 0,
    },
    8003: {
      phoneNumber: "010-9999-0000",
      allergies: [],
      anniversaries: [],
      recentRequests: [],
      historicalVisitCount: 1,
      historicalNoShowCount: 0,
    },
    8004: {
      phoneNumber: "010-2211-1122",
      allergies: ["견과류"],
      anniversaries: [],
      recentRequests: ["견과류 제외 요청"],
      historicalVisitCount: 3,
      historicalNoShowCount: 0,
    },
    8005: {
      phoneNumber: "010-3344-4455",
      allergies: ["유제품"],
      anniversaries: [{ label: "프로포즈", date: "09-20" }],
      recentRequests: ["기념일 디저트 문구 요청", "유제품 대체 메뉴 문의"],
      historicalVisitCount: 1,
      historicalNoShowCount: 1,
    },
  };
}

function defaultMockBusinessCustomerDuplicateGroups(): Array<{
  matchType: BusinessCustomerDuplicateMatchType;
  matchKeyMasked: string;
  customerIds: number[];
}> {
  return [
    {
      matchType: "EMAIL",
      matchKeyMasked: "r***n@example.com",
      customerIds: [8001, 8002],
    },
  ];
}

function defaultMockBusinessCustomerFlagStatus(
  customerId: number,
): BusinessCustomerFlagStatusResponse {
  const flagStatus: Record<number, Omit<BusinessCustomerFlagStatusResponse, "customerId">> = {
    8001: {
      vip: true,
      caution: false,
      blockedScope: "NONE",
      blockedScopeLabel: null,
      updatedAt: null,
    },
    8005: {
      vip: false,
      caution: true,
      blockedScope: "STORE_REVIEW_REQUIRED",
      blockedScopeLabel: "매장 검토 후 예약 확정",
      updatedAt: null,
    },
  };

  return {
    customerId,
    ...(flagStatus[customerId] ?? {
      vip: false,
      caution: false,
      blockedScope: "NONE",
      blockedScopeLabel: null,
      updatedAt: null,
    }),
  };
}

function defaultMockBusinessCustomerNotes(): Record<string, BusinessCustomerNoteResponse[]> {
  const now = new Date().toISOString();

  return {
    "8001": [
      {
        id: 10001,
        customerId: 8001,
        content: "창가 좌석을 선호하며, 갑각류 알레르기 확인 필요.",
        authorName: "청담 본점 오너",
        createdAt: now,
        updatedAt: null,
        auditActionLabel: "메모 생성",
      },
    ],
    "8005": [
      {
        id: 10002,
        customerId: 8005,
        content: "최근 노쇼 이력이 있어 카드 보증 상태 확인 필요.",
        authorName: "청담 본점 오너",
        createdAt: now,
        updatedAt: null,
        auditActionLabel: "메모 생성",
      },
    ],
  };
}

function defaultMockReservationProducts() {
  return [
    {
      id: 6001,
      name: "디너 코스",
      maxPartySize: 6,
    },
    {
      id: 6002,
      name: "런치 코스",
      maxPartySize: 8,
    },
  ];
}

function defaultBusinessTimeSlotProducts(): ReservationProductResponse[] {
  const now = new Date().toISOString();

  return [
    {
      id: 6001,
      restaurantId: 1,
      name: "디너 코스",
      description: "계절 메뉴 코스",
      priceAmount: 80000,
      visible: true,
      status: "ACTIVE",
      minPartySize: 1,
      maxPartySize: 6,
      availableDays: defaultReservationProductDays,
      availableStartTime: "18:00",
      availableEndTime: "21:00",
      slotCapacity: 8,
      paymentPolicyType: "NONE",
      paymentAmount: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 6002,
      restaurantId: 1,
      name: "런치 코스",
      description: "점심 코스",
      priceAmount: 50000,
      visible: true,
      status: "ACTIVE",
      minPartySize: 1,
      maxPartySize: 8,
      availableDays: defaultReservationProductDays,
      availableStartTime: "11:30",
      availableEndTime: "14:00",
      slotCapacity: 10,
      paymentPolicyType: "NONE",
      paymentAmount: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function defaultMockBusinessPayments(): BusinessPaymentListItemResponse[] {
  const today = todayDateString();
  const yesterday = addDays(today, -1);

  return [
    {
      id: 9101,
      paymentNumber: "PAY-9101",
      reservationId: 7001,
      reservationNumber: "RSV-7001",
      customerName: "김예약",
      productName: "디너 코스",
      paymentType: "DEPOSIT",
      status: "PAID",
      statusLabel: "결제 완료",
      statusTone: "success",
      amount: 30000,
      currency: "KRW",
      paidAt: toDateTimeIsoString(today, "10:10:00"),
      dueAt: null,
      cardGuaranteeHeld: false,
      actionRequired: false,
    },
    {
      id: 9102,
      paymentNumber: "PAY-9102",
      reservationId: 7002,
      reservationNumber: "RSV-7002",
      customerName: "이수정",
      productName: "런치 코스",
      paymentType: "ONSITE",
      status: "OFFLINE",
      statusLabel: "현장 결제",
      statusTone: "muted",
      amount: 0,
      currency: "KRW",
      paidAt: null,
      dueAt: null,
      cardGuaranteeHeld: false,
      actionRequired: false,
    },
    {
      id: 9103,
      paymentNumber: "PAY-9103",
      reservationId: 7005,
      reservationNumber: "RSV-7005",
      customerName: "오민준",
      productName: "디너 코스",
      paymentType: "CARD_GUARANTEE",
      status: "CARD_GUARANTEE",
      statusLabel: "카드 보증",
      statusTone: "warning",
      amount: 50000,
      currency: "KRW",
      paidAt: null,
      dueAt: toDateTimeIsoString(today, "19:00:00"),
      cardGuaranteeHeld: true,
      actionRequired: true,
    },
    {
      id: 9104,
      paymentNumber: "PAY-9104",
      reservationId: 7003,
      reservationNumber: "RSV-7003",
      customerName: "박취소",
      productName: "디너 코스",
      paymentType: "PREPAID",
      status: "REFUND_PENDING",
      statusLabel: "환불 대기",
      statusTone: "danger",
      amount: 120000,
      currency: "KRW",
      paidAt: toDateTimeIsoString(yesterday, "18:00:00"),
      dueAt: null,
      cardGuaranteeHeld: false,
      actionRequired: true,
    },
  ];
}

function defaultMockBusinessRefunds(): BusinessRefundListItemResponse[] {
  const today = todayDateString();
  const yesterday = addDays(today, -1);

  return [
    {
      id: 9201,
      refundNumber: "REF-9201",
      paymentId: 9104,
      reservationId: 7003,
      reservationNumber: "RSV-7003",
      customerName: "박취소",
      productName: "디너 코스",
      status: "PENDING",
      statusLabel: "환불 처리중",
      statusTone: "warning",
      refundAmount: 120000,
      currency: "KRW",
      requestedAt: toDateTimeIsoString(today, "09:30:00"),
      completedAt: null,
      failureMessage: null,
      actionRequired: true,
    },
    {
      id: 9202,
      refundNumber: "REF-9202",
      paymentId: 9101,
      reservationId: 7001,
      reservationNumber: "RSV-7001",
      customerName: "김예약",
      productName: "디너 코스",
      status: "SUCCEEDED",
      statusLabel: "환불 완료",
      statusTone: "success",
      refundAmount: 30000,
      currency: "KRW",
      requestedAt: toDateTimeIsoString(yesterday, "16:20:00"),
      completedAt: toDateTimeIsoString(yesterday, "16:22:00"),
      failureMessage: null,
      actionRequired: false,
    },
    {
      id: 9203,
      refundNumber: "REF-9203",
      paymentId: 9103,
      reservationId: 7005,
      reservationNumber: "RSV-7005",
      customerName: "오민준",
      productName: "디너 코스",
      status: "FAILED",
      statusLabel: "환불 실패",
      statusTone: "danger",
      refundAmount: 50000,
      currency: "KRW",
      requestedAt: toDateTimeIsoString(today, "20:30:00"),
      completedAt: null,
      failureMessage: "PG 승인 거절",
      actionRequired: true,
    },
  ];
}

function toMockBusinessReservationRefundPreview(
  reservation: BusinessReservationListItemResponse,
): BusinessReservationRefundPreviewResponse {
  const payment = defaultMockBusinessPayments().find(
    (item) => item.reservationId === reservation.id,
  );
  const existingRefund = defaultMockBusinessRefunds().find(
    (item) => item.reservationId === reservation.id,
  );
  const refund =
    isCancelledReservation(reservation) || reservation.status === "NO_SHOW"
      ? existingRefund
      : undefined;
  const paidAmount = payment?.amount ?? 0;
  const refundAmount = refund?.refundAmount ?? refundableAmountForPayment(payment);
  const cancelActor = reservation.status === "CANCELLED_BY_CUSTOMER" ? "CUSTOMER" : "RESTAURANT";

  if (refund) {
    return {
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      cancelActor,
      paymentStatus: reservation.paymentStatus,
      paymentStatusLabel: mockPaymentStatusLabel(reservation.paymentStatus),
      refundStatus: refund.status,
      refundStatusLabel: refund.statusLabel,
      refundStatusTone: refund.statusTone,
      paidAmount,
      expectedRefundAmount: refundAmount,
      nonRefundableAmount: Math.max(paidAmount - refundAmount, 0),
      currency: refund.currency,
      policySummary:
        refund.status === "FAILED"
          ? "환불 실패 건은 플랫폼 관리자 확인 후 PG 또는 운영 절차로 보정합니다."
          : refund.status === "PENDING"
            ? "환불 요청이 접수되어 PG 처리 결과를 기다리는 상태입니다."
            : "환불이 완료된 상태입니다.",
      actionRequired: refund.actionRequired,
      adminContactRequired: refund.status === "FAILED" || refund.actionRequired,
      settlementNotice: "정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.",
    };
  }

  return {
    reservationId: reservation.id,
    reservationNumber: reservation.reservationNumber,
    cancelActor,
    paymentStatus: reservation.paymentStatus,
    paymentStatusLabel: mockPaymentStatusLabel(reservation.paymentStatus),
    refundStatus: refundAmount > 0 ? "EXPECTED" : "NOT_REQUIRED",
    refundStatusLabel: refundAmount > 0 ? "환불 예상" : "환불 없음",
    refundStatusTone: refundAmount > 0 ? "warning" : "muted",
    paidAmount,
    expectedRefundAmount: refundAmount,
    nonRefundableAmount: Math.max(paidAmount - refundAmount, 0),
    currency: payment?.currency ?? "KRW",
    policySummary:
      refundAmount > 0
        ? "매장 취소는 결제 금액 전액 환불을 기본으로 안내합니다."
        : "결제 금액이 없거나 현장 결제 예약이라 자동 환불 예정 금액이 없습니다.",
    actionRequired: false,
    adminContactRequired: false,
    settlementNotice: "정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.",
  };
}

function refundableAmountForPayment(payment: BusinessPaymentListItemResponse | undefined) {
  if (!payment) {
    return 0;
  }
  if (payment.status === "PAID" || payment.status === "REFUND_PENDING") {
    return payment.amount;
  }

  return 0;
}

function mockPaymentStatusLabel(value: string) {
  const labels: Record<string, string> = {
    NOT_REQUIRED: "결제 없음",
    OFFLINE: "현장 결제",
    PENDING_PAYMENT: "결제 대기",
    PAID: "결제 완료",
    REFUND_PENDING: "환불 대기",
    CARD_GUARANTEE: "카드 보증",
  };

  return labels[value] ?? value;
}

function toMockBusinessReservation({
  id,
  reservationNumber,
  status,
  source,
  visitDate,
  startTime,
  endTime,
  partySize,
  productId,
  productName,
  customerId,
  customerName,
  phoneMasked,
  hasCustomerRequest,
  hasOwnerNote,
  paymentStatus,
  paymentActionRequired,
}: {
  id: number;
  reservationNumber: string;
  status: BusinessReservationStatus;
  source: BusinessReservationSource;
  visitDate: string;
  startTime: string;
  endTime: string;
  partySize: number;
  productId: number;
  productName: string;
  customerId: number;
  customerName: string;
  phoneMasked: string;
  hasCustomerRequest: boolean;
  hasOwnerNote: boolean;
  paymentStatus: string;
  paymentActionRequired: boolean;
}): BusinessReservationListItemResponse {
  return {
    id,
    reservationNumber,
    status,
    statusLabel: businessReservationStatusLabel(status),
    statusTone: businessReservationStatusTone(status),
    source,
    reservedStartAt: toDateTimeIsoString(visitDate, startTime),
    reservedEndAt: toDateTimeIsoString(visitDate, endTime),
    visitDate,
    startTime,
    endTime,
    partySize,
    productId,
    productName,
    customer: {
      id: customerId,
      name: customerName,
      phoneMasked,
    },
    hasCustomerRequest,
    hasOwnerNote,
    paymentStatus,
    paymentActionRequired,
  };
}

function toMockBusinessReservationDetail(
  reservation: BusinessReservationListItemResponse,
  overrides: {
    customerPhone?: string;
    customerRequest?: string | null;
    ownerNote?: string | null;
    cancelReason?: string | null;
    customerFlags?: BusinessCustomerFlagStatusResponse;
  } = {},
): BusinessReservationDetailResponse {
  const customerFlags =
    overrides.customerFlags ?? defaultMockBusinessCustomerFlagStatus(reservation.customer.id);

  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    statusLabel: reservation.statusLabel,
    statusTone: reservation.statusTone,
    source: reservation.source,
    reservedStartAt: reservation.reservedStartAt,
    reservedEndAt: reservation.reservedEndAt,
    visitDate: reservation.visitDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    partySize: reservation.partySize,
    product: {
      id: reservation.productId,
      name: reservation.productName,
    },
    customer: {
      id: reservation.customer.id,
      name: reservation.customer.name,
      phoneNumber: overrides.customerPhone ?? mockCustomerPhoneNumber(reservation.id),
      visitCount: reservation.status === "COMPLETED" ? 3 : 1,
      noShowCount: reservation.status === "NO_SHOW" ? 1 : 0,
      vip: customerFlags.vip,
      caution: customerFlags.caution,
      blockedScopeLabel: customerFlags.blockedScopeLabel,
    },
    customerRequest:
      overrides.customerRequest ??
      (reservation.hasCustomerRequest ? "창가 좌석 요청, 알레르기 확인 필요" : null),
    ownerNote:
      overrides.ownerNote !== undefined
        ? overrides.ownerNote
        : reservation.hasOwnerNote
          ? "전화 확인 완료. 방문 전 좌석 배정 확인."
          : null,
    paymentStatus: reservation.paymentStatus,
    paymentActionRequired: reservation.paymentActionRequired,
    cancelledAt: isCancelledReservation(reservation)
      ? toDateTimeIsoString(reservation.visitDate, reservation.startTime)
      : null,
    cancelReason:
      overrides.cancelReason ??
      (isCancelledReservation(reservation)
        ? reservation.status === "CANCELLED_BY_RESTAURANT"
          ? "매장 사유"
          : "고객 요청"
        : null),
    completedAt:
      reservation.status === "COMPLETED"
        ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
        : null,
    noShowAt:
      reservation.status === "NO_SHOW"
        ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
        : null,
    auditLogs: reservation.hasOwnerNote
      ? [
          {
            id: reservation.id + 9000,
            action: "reservation.owner_note_updated",
            createdAt: toDateTimeIsoString(reservation.visitDate, reservation.startTime),
          },
        ]
      : [],
  };
}

function toMockBusinessCustomers(
  reservations: BusinessReservationListItemResponse[],
): BusinessCustomerListItemResponse[] {
  const byCustomer = new Map<number, BusinessReservationListItemResponse[]>();

  reservations.forEach((reservation) => {
    const current = byCustomer.get(reservation.customer.id) ?? [];
    byCustomer.set(reservation.customer.id, [...current, reservation]);
  });

  return Array.from(byCustomer.entries())
    .map(([customerId, customerReservations]) => {
      const sortedReservations = sortMockBusinessReservations(customerReservations).reverse();
      const latestReservation = sortedReservations[0];
      const profile = mockBusinessCustomerProfile(customerId);
      const completedCount = customerReservations.filter(
        (reservation) => reservation.status === "COMPLETED",
      ).length;
      const noShowCount = customerReservations.filter(
        (reservation) => reservation.status === "NO_SHOW",
      ).length;
      const cancelledCount = customerReservations.filter(isCancelledReservation).length;
      const allergySummary = profile.allergies.length > 0 ? profile.allergies.join(", ") : null;
      const anniversarySummary =
        profile.anniversaries.length > 0
          ? profile.anniversaries.map((anniversary) => anniversary.label).join(", ")
          : null;

      return {
        id: customerId,
        name: latestReservation?.customer.name ?? "이름 없음",
        phoneMasked:
          latestReservation?.customer.phoneMasked ?? maskPhoneNumber(profile.phoneNumber),
        totalReservations: customerReservations.length,
        completedCount: Math.max(profile.historicalVisitCount, completedCount),
        noShowCount: Math.max(profile.historicalNoShowCount, noShowCount),
        cancelledCount,
        lastVisitedAt: latestReservationDateTime(
          customerReservations.filter((reservation) => reservation.status === "COMPLETED"),
        ),
        nextReservationAt: nextActiveReservationDateTime(customerReservations),
        lastRequest:
          profile.recentRequests[0] ??
          (customerReservations.some((reservation) => reservation.hasCustomerRequest)
            ? "고객 요청사항 있음"
            : null),
        allergySummary,
        anniversarySummary,
        privacyLevelLabel: "목록 마스킹",
      } satisfies BusinessCustomerListItemResponse;
    })
    .sort((a, b) => {
      const nextDiff = (b.nextReservationAt ?? "").localeCompare(a.nextReservationAt ?? "");

      if (nextDiff !== 0) {
        return nextDiff;
      }

      return (b.lastVisitedAt ?? "").localeCompare(a.lastVisitedAt ?? "");
    });
}

function toMockBusinessCustomerDetail(
  reservations: BusinessReservationListItemResponse[],
  customerId: number,
  state: {
    flagStatus?: BusinessCustomerFlagStatusResponse;
    notes?: BusinessCustomerNoteResponse[];
  } = {},
): BusinessCustomerDetailResponse | null {
  const customerReservations = reservations.filter(
    (reservation) => reservation.customer.id === customerId,
  );
  const latestReservation = sortMockBusinessReservations(customerReservations).at(-1);

  if (!latestReservation) {
    return null;
  }

  const profile = mockBusinessCustomerProfile(customerId);
  const completedCount = customerReservations.filter(
    (reservation) => reservation.status === "COMPLETED",
  ).length;
  const noShowCount = customerReservations.filter(
    (reservation) => reservation.status === "NO_SHOW",
  ).length;
  const cancelledCount = customerReservations.filter(isCancelledReservation).length;
  const requestNotes = customerReservations
    .filter((reservation) => reservation.hasCustomerRequest)
    .map(() => "창가 좌석 요청, 알레르기 확인 필요");

  return {
    id: customerId,
    name: latestReservation.customer.name,
    phoneNumber: profile.phoneNumber,
    phoneMasked: latestReservation.customer.phoneMasked,
    totalReservations: customerReservations.length,
    visitCount: Math.max(profile.historicalVisitCount, completedCount),
    noShowCount: Math.max(profile.historicalNoShowCount, noShowCount),
    cancelledCount,
    firstReservationAt: earliestReservationDateTime(customerReservations),
    lastReservationAt: latestReservationDateTime(customerReservations),
    lastVisitedAt: latestReservationDateTime(
      customerReservations.filter((reservation) => reservation.status === "COMPLETED"),
    ),
    nextReservationAt: nextActiveReservationDateTime(customerReservations),
    recentRequests: uniqueNonEmpty([...profile.recentRequests, ...requestNotes]).slice(0, 5),
    allergies: profile.allergies,
    anniversaries: profile.anniversaries,
    flagStatus: state.flagStatus ?? defaultMockBusinessCustomerFlagStatus(customerId),
    notes: state.notes ?? defaultMockBusinessCustomerNotes()[String(customerId)] ?? [],
    privacyNotice:
      "전화번호는 고객 상세에서만 표시하며, 고객 응대와 예약 확인 목적 외 사용하지 않습니다.",
  } satisfies BusinessCustomerDetailResponse;
}

function toMockBusinessCustomerDuplicateCandidateItem(
  customer: BusinessCustomerListItemResponse,
  notes: BusinessCustomerNoteResponse[],
  flagStatus: BusinessCustomerFlagStatusResponse,
): BusinessCustomerDuplicateCandidateItemResponse {
  return {
    id: customer.id,
    name: customer.name,
    phoneMasked: customer.phoneMasked,
    email: mockBusinessCustomerEmail(customer.id),
    reservationCount: customer.totalReservations,
    noteCount: notes.length,
    vip: flagStatus.vip,
    caution: flagStatus.caution,
    blocked: flagStatus.blockedScope !== "NONE",
    createdAt: customer.lastVisitedAt,
    updatedAt: flagStatus.updatedAt ?? customer.nextReservationAt ?? customer.lastVisitedAt,
  };
}

function toMockBusinessCustomerReservationHistory(
  reservations: BusinessReservationListItemResponse[],
  customerId: number,
): BusinessCustomerReservationHistoryItemResponse[] {
  const profile = mockBusinessCustomerProfile(customerId);

  return sortMockBusinessReservations(
    reservations.filter((reservation) => reservation.customer.id === customerId),
  )
    .reverse()
    .map((reservation) => ({
      id: reservation.id,
      reservationNumber: reservation.reservationNumber,
      status: reservation.status,
      statusLabel: reservation.statusLabel,
      statusTone: reservation.statusTone,
      visitDate: reservation.visitDate,
      startTime: reservation.startTime,
      partySize: reservation.partySize,
      productName: reservation.productName,
      source: reservation.source,
      customerRequest: reservation.hasCustomerRequest
        ? (profile.recentRequests[0] ?? "고객 요청사항 있음")
        : null,
      allergyNote: profile.allergies.length > 0 ? profile.allergies.join(", ") : null,
      anniversaryNote:
        profile.anniversaries.length > 0
          ? profile.anniversaries.map((anniversary) => anniversary.label).join(", ")
          : null,
      completedAt:
        reservation.status === "COMPLETED"
          ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
          : null,
      noShowAt:
        reservation.status === "NO_SHOW"
          ? toDateTimeIsoString(reservation.visitDate, reservation.endTime)
          : null,
    }));
}

function filterMockBusinessCustomers(
  customers: BusinessCustomerListItemResponse[],
  query: BusinessCustomerListQuery,
) {
  const searchTerm = query.query?.trim().toLowerCase() ?? "";
  const segment = query.segment ?? "ALL";

  return customers.filter((customer) => {
    if (segment === "HAS_VISIT_HISTORY" && customer.completedCount === 0) {
      return false;
    }
    if (segment === "HAS_NO_SHOW" && customer.noShowCount === 0) {
      return false;
    }
    if (
      segment === "HAS_PREFERENCES" &&
      customer.allergySummary === null &&
      customer.anniversarySummary === null
    ) {
      return false;
    }
    if (!searchTerm) {
      return true;
    }

    return mockBusinessCustomerSearchText(customer).includes(searchTerm);
  });
}

function filterMockBusinessReservations(
  reservations: BusinessReservationListItemResponse[],
  query: BusinessReservationListQuery,
) {
  const from = query.date ?? query.from ?? todayDateString();
  const to = query.date ?? query.to ?? from;
  const searchTerm = query.query?.trim().toLowerCase() ?? "";
  const startTime = normalizeTime(query.startTime);
  const endTime = normalizeTime(query.endTime);

  return reservations
    .filter((reservation) => {
      if (reservation.visitDate < from || reservation.visitDate > to) {
        return false;
      }
      if (!query.includeCancelled && !query.status && isCancelledReservation(reservation)) {
        return false;
      }
      if (query.status && reservation.status !== query.status) {
        return false;
      }
      if (query.productId && reservation.productId !== query.productId) {
        return false;
      }
      if (startTime && reservation.startTime < startTime) {
        return false;
      }
      if (endTime && reservation.startTime >= endTime) {
        return false;
      }
      if (searchTerm && !businessReservationSearchText(reservation).includes(searchTerm)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const timeDiff = a.startTime.localeCompare(b.startTime);

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return a.id - b.id;
    });
}

function normalizeManualReservationRequest(request: BusinessManualReservationCreateRequest) {
  const productId = request.productId ?? 0;
  const visitDate = request.visitDate?.trim() ?? "";
  const startTime = normalizeTime(request.startTime) ?? "";
  const partySize = request.partySize ?? 0;
  const customerName = request.customerName?.trim() ?? "";
  const customerPhone = request.customerPhone?.replace(/\D/g, "") ?? "";
  const customerRequest = request.customerRequest?.trim() || null;

  if (!Number.isInteger(productId) || productId < 1) {
    throw new ApiError("예약 상품을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    throw new ApiError("방문일을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError("방문 시간을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ApiError("인원은 1명 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }
  if (!customerName) {
    throw new ApiError("고객명을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (customerPhone.length < 8 || customerPhone.length > 20) {
    throw new ApiError("고객 전화번호를 확인해 주세요.", 400, "VALIDATION_ERROR");
  }

  return {
    source: request.source ?? "MANUAL_PHONE",
    productId,
    visitDate,
    startTime,
    partySize,
    customerName,
    customerPhone,
    customerRequest,
  };
}

function normalizeBusinessReservationUpdateRequest(
  request: BusinessReservationUpdateRequest,
  reservation: BusinessReservationListItemResponse,
) {
  const productId = request.productId ?? reservation.productId;
  const visitDate = request.visitDate?.trim() || reservation.visitDate;
  const startTime = normalizeTime(request.startTime) ?? reservation.startTime;
  const partySize = request.partySize ?? reservation.partySize;

  if (!Number.isInteger(productId) || productId < 1) {
    throw new ApiError("예약 상품을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    throw new ApiError("방문일을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
    throw new ApiError("방문 시간을 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new ApiError("인원은 1명 이상이어야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    productId,
    visitDate,
    startTime,
    partySize,
  };
}

function normalizeBusinessReservationCancelRequest(request: BusinessReservationCancelRequest) {
  const reason = request.reason?.trim() ?? "";

  if (!reason) {
    throw new ApiError("취소 사유를 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (reason.length > 255) {
    throw new ApiError("취소 사유는 255자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }

  return reason;
}

function normalizeBusinessReservationNoShowRequest(request: BusinessReservationNoShowRequest) {
  const reason = request.reason?.trim() ?? "";

  if (reason.length > 255) {
    throw new ApiError("노쇼 사유는 255자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }

  return {
    reason: reason || null,
    force: Boolean(request.force),
  };
}

function normalizeBusinessReservationOperationNoteRequest(
  request: BusinessReservationOperationNoteRequest,
) {
  const ownerNote = request.ownerNote?.trim() || null;

  if ((ownerNote?.length ?? 0) > 1000) {
    throw new ApiError("운영 메모는 1000자 이하여야 합니다.", 400, "VALIDATION_ERROR");
  }

  return ownerNote;
}

function normalizeBusinessCustomerNoteRequest(request: BusinessCustomerNoteSaveRequest) {
  const content = request.content?.trim() ?? "";

  if (content.length < 2) {
    throw new ApiError("고객 메모를 2자 이상 입력해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (content.length > 500) {
    throw new ApiError("고객 메모는 500자 이하로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }

  return content;
}

function normalizeBusinessCustomerMergeRequest(request: BusinessCustomerMergeRequest) {
  const targetCustomerId = request.targetCustomerId ?? 0;
  const sourceCustomerIds = Array.from(new Set(request.sourceCustomerIds ?? []));
  const reason = request.reason?.trim() ?? null;

  if (request.confirmIrreversible !== true) {
    throw new ApiError("되돌릴 수 없는 고객 병합 작업 확인이 필요합니다.", 400, "VALIDATION_ERROR");
  }
  if (!Number.isInteger(targetCustomerId) || targetCustomerId < 1) {
    throw new ApiError("기준 고객을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (sourceCustomerIds.length === 0) {
    throw new ApiError("병합 대상 고객을 선택해 주세요.", 400, "VALIDATION_ERROR");
  }
  if (sourceCustomerIds.some((sourceCustomerId) => sourceCustomerId === targetCustomerId)) {
    throw new ApiError("기준 고객과 병합 대상 고객은 달라야 합니다.", 400, "VALIDATION_ERROR");
  }
  if ((reason?.length ?? 0) > 255) {
    throw new ApiError("병합 사유는 255자 이하로 입력해 주세요.", 400, "VALIDATION_ERROR");
  }

  return {
    targetCustomerId,
    sourceCustomerIds,
    reason,
  };
}

function nextBusinessCustomerNoteId(
  notesByCustomer: Record<string, BusinessCustomerNoteResponse[]>,
) {
  return (
    Object.values(notesByCustomer)
      .flat()
      .reduce((maxId, note) => Math.max(maxId, note.id), 10000) + 1
  );
}

function findBusinessCustomerNoteEntry(
  notesByCustomer: Record<string, BusinessCustomerNoteResponse[]>,
  noteId: number,
): [string, BusinessCustomerNoteResponse[]] | null {
  return (
    Object.entries(notesByCustomer).find(([, notes]) => notes.some((note) => note.id === noteId)) ??
    null
  );
}

function patchMockBusinessReservation(
  reservation: BusinessReservationListItemResponse,
  patch: Partial<
    Pick<
      BusinessReservationListItemResponse,
      | "status"
      | "visitDate"
      | "startTime"
      | "endTime"
      | "partySize"
      | "productId"
      | "productName"
      | "hasOwnerNote"
    >
  >,
) {
  const status = patch.status ?? reservation.status;
  const visitDate = patch.visitDate ?? reservation.visitDate;
  const startTime = patch.startTime ?? reservation.startTime;
  const endTime = patch.endTime ?? reservation.endTime;

  return {
    ...reservation,
    ...patch,
    status,
    statusLabel: businessReservationStatusLabel(status),
    statusTone: businessReservationStatusTone(status),
    visitDate,
    startTime,
    endTime,
    reservedStartAt: toDateTimeIsoString(visitDate, startTime),
    reservedEndAt: toDateTimeIsoString(visitDate, endTime),
  } satisfies BusinessReservationListItemResponse;
}

function isActionableBusinessReservation(status: BusinessReservationStatus) {
  return status === "CONFIRMED" || status === "MODIFIED";
}

function toMockBusinessAuditLogs(
  reservation: BusinessReservationListItemResponse,
): BusinessAuditLogResponse[] {
  const actions: string[] = [];

  if (reservation.hasOwnerNote) {
    actions.push("RESERVATION_OWNER_NOTE_UPDATED");
  }
  if (reservation.status === "MODIFIED") {
    actions.push("RESERVATION_UPDATED");
  }
  if (reservation.status === "CANCELLED_BY_CUSTOMER") {
    actions.push("RESERVATION_CANCELLED_BY_CUSTOMER");
  }
  if (reservation.status === "CANCELLED_BY_RESTAURANT") {
    actions.push("RESERVATION_CANCELLED_BY_RESTAURANT");
  }
  if (reservation.status === "COMPLETED") {
    actions.push("RESERVATION_COMPLETED");
  }
  if (reservation.status === "NO_SHOW") {
    actions.push("RESERVATION_NO_SHOW");
  }

  return actions.map((action, index) => ({
    id: reservation.id * 100 + index,
    actorUserId: 1001,
    actorRole: "OWNER",
    action,
    targetType: "reservation",
    targetId: reservation.id,
    beforeValue: null,
    afterValue: null,
    ipAddress: "127.0.0.1",
    userAgent: "mock-business-web",
    createdAt: toDateTimeIsoString(reservation.visitDate, reservation.startTime),
  }));
}

function nextBusinessReservationId(reservations: BusinessReservationListItemResponse[]) {
  return reservations.reduce((maxId, reservation) => Math.max(maxId, reservation.id), 7000) + 1;
}

function sortMockBusinessReservations(reservations: BusinessReservationListItemResponse[]) {
  return [...reservations].sort((a, b) => {
    const dateDiff = a.visitDate.localeCompare(b.visitDate);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const timeDiff = a.startTime.localeCompare(b.startTime);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.id - b.id;
  });
}

function maskPhoneNumber(phoneNumber: string) {
  const last4 = phoneNumber.slice(-4);

  return last4 ? `010-****-${last4}` : "010-****-0000";
}

function addMinutes(time: string, minutes: number) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const date = new Date(1970, 0, 1, hour, minute + minutes);
  const nextHour = String(date.getHours()).padStart(2, "0");
  const nextMinute = String(date.getMinutes()).padStart(2, "0");

  return `${nextHour}:${nextMinute}:00`;
}

function mockCustomerPhoneNumber(reservationId: number) {
  const phoneNumbers: Record<number, string> = {
    7001: "010-1234-5678",
    7002: "010-8899-9988",
    7003: "010-9999-0000",
    7004: "010-2211-1122",
    7005: "010-3344-4455",
  };

  return phoneNumbers[reservationId] ?? "010-0000-0000";
}

function mockBusinessCustomerEmail(customerId: number) {
  const emails: Record<number, string | null> = {
    8001: "reservation@example.com",
    8002: "reservation@example.com",
    8003: "cancel@example.com",
    8004: "visit@example.com",
    8005: "risk@example.com",
  };

  return emails[customerId] ?? null;
}

function mockBusinessCustomerProfile(customerId: number): MockBusinessCustomerProfile {
  return (
    defaultMockBusinessCustomerProfiles()[customerId] ?? {
      phoneNumber: "010-0000-0000",
      allergies: [],
      anniversaries: [],
      recentRequests: [],
      historicalVisitCount: 0,
      historicalNoShowCount: 0,
    }
  );
}

function earliestReservationDateTime(reservations: BusinessReservationListItemResponse[]) {
  return reservationDateTimes(reservations).sort()[0] ?? null;
}

function latestReservationDateTime(reservations: BusinessReservationListItemResponse[]) {
  return reservationDateTimes(reservations).sort().at(-1) ?? null;
}

function nextActiveReservationDateTime(reservations: BusinessReservationListItemResponse[]) {
  const today = todayDateString();

  return (
    reservationDateTimes(
      reservations.filter(
        (reservation) =>
          reservation.visitDate >= today &&
          !isCancelledReservation(reservation) &&
          reservation.status !== "NO_SHOW",
      ),
    ).sort()[0] ?? null
  );
}

function reservationDateTimes(reservations: BusinessReservationListItemResponse[]) {
  return reservations.map((reservation) =>
    toDateTimeIsoString(reservation.visitDate, reservation.startTime),
  );
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function toBusinessReservationSummary(items: BusinessReservationListItemResponse[]) {
  return {
    totalReservations: items.length,
    totalPartySize: items.reduce((total, item) => total + item.partySize, 0),
    confirmedCount: items.filter((item) => item.status === "CONFIRMED").length,
    modifiedCount: items.filter((item) => item.status === "MODIFIED").length,
    completedCount: items.filter((item) => item.status === "COMPLETED").length,
    cancelledCount: items.filter(isCancelledReservation).length,
    noShowCount: items.filter((item) => item.status === "NO_SHOW").length,
  } satisfies BusinessReservationSummaryResponse;
}

function businessReservationSearchText(reservation: BusinessReservationListItemResponse) {
  return [
    reservation.reservationNumber,
    reservation.customer.name,
    reservation.customer.phoneMasked,
    reservation.productName,
    reservation.statusLabel,
    reservation.paymentStatus,
  ]
    .join(" ")
    .toLowerCase();
}

function mockBusinessCustomerSearchText(customer: BusinessCustomerListItemResponse) {
  return [
    customer.name,
    customer.phoneMasked,
    customer.lastRequest,
    customer.allergySummary,
    customer.anniversarySummary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function businessReservationStatusLabel(status: BusinessReservationStatus) {
  const labels: Record<BusinessReservationStatus, string> = {
    PENDING: "확인 대기",
    CONFIRMED: "확정",
    MODIFIED: "변경",
    CANCELLED_BY_CUSTOMER: "고객 취소",
    CANCELLED_BY_RESTAURANT: "매장 취소",
    COMPLETED: "방문 완료",
    NO_SHOW: "노쇼",
  };

  return labels[status];
}

function businessReservationStatusTone(status: BusinessReservationStatus) {
  const tones: Record<BusinessReservationStatus, string> = {
    PENDING: "warning",
    CONFIRMED: "success",
    MODIFIED: "info",
    CANCELLED_BY_CUSTOMER: "muted",
    CANCELLED_BY_RESTAURANT: "danger",
    COMPLETED: "success",
    NO_SHOW: "danger",
  };

  return tones[status];
}

function isCancelledReservation(reservation: BusinessReservationListItemResponse) {
  return (
    reservation.status === "CANCELLED_BY_CUSTOMER" ||
    reservation.status === "CANCELLED_BY_RESTAURANT"
  );
}

function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.length === 5 ? `${value}:00` : value;
}

function todayDateString() {
  return formatDateString(new Date());
}

function firstDayOfMonth(value: string) {
  const date = parseDateString(value);

  return formatDateString(new Date(date.getFullYear(), date.getMonth(), 1));
}

function lastDayOfMonth(value: string) {
  const date = parseDateString(value);

  return formatDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function addDays(value: string, days: number) {
  const date = parseDateString(value);
  date.setDate(date.getDate() + days);

  return formatDateString(date);
}

function eachDate(from: string, to: string) {
  const dates: string[] = [];
  const current = parseDateString(from);
  const end = parseDateString(to);

  while (current <= end) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function parseDateString(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateTimeIsoString(date: string, time: string) {
  return new Date(`${date}T${time}+09:00`).toISOString();
}
