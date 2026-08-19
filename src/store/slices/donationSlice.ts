import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import donationService, {
  DonationCampaign,
  DonationListParams,
  CampaignDonateDetails,
  DonationSubmitRequest,
} from '../../app/service/organizer/donation/donationService';

// Types
interface PresetAmount {
  amount: number;
  description: string;
}

interface PresetAmounts {
  oneTime: {
    enabled: boolean;
    presetDetails: PresetAmount[];
  };
  monthly: {
    enabled: boolean;
    presetDetails: PresetAmount[];
  };
  yearly: {
    enabled: boolean;
    presetDetails: PresetAmount[];
  };
}

export interface CampaignFormData {
  name: string;
  startDate: Date | string | null;
  endDate: Date | string | null;

  fundRaisingGoal: number | null;
  visibleToDonor: boolean;

  description: string;

  paymentAccountId: number;
  paymentMethods: string[];
  enableMonthlyRecurring?: boolean;
  enableYearlyRecurring?: boolean;

  presetAmounts?: PresetAmounts;

  themeColor: string;

  images: string[];

  customFormId?: number | null;
}

interface CacheEntry {
  data: DonationCampaign[];
  totalRecordsCount: number;
  pageCount: number;
  timestamp: number;
}

interface DonationState {
  campaigns: DonationCampaign[];
  totalRecordsCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  dateFilter: {
    startDate?: string;
    endDate?: string;
  };

  cache: {
    [key: string]: CacheEntry;
  };
  cacheExpiry: number; // Cache duration in milliseconds (5 minutes)
  lastFetchTime: number;

  // Campaign Form (Create/Edit)
  campaignForm: CampaignFormData;
  currentStep: number;
  completedSteps: number[];
  campaignId: string | null;
  isEditMode: boolean;

  currentCampaignForDonation: CampaignDonateDetails | null;

  banners: string[];

  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    donation: boolean;
    banners: boolean;
  };

  // Error states
  error: {
    list: string | null;
    detail: string | null;
    create: string | null;
    update: string | null;
    donation: string | null;
    banners: string | null;
  };

  // Success states
  successMessage: string | null;
}

const initialCampaignForm: CampaignFormData = {
  name: '',
  startDate: null,
  endDate: null,
  fundRaisingGoal: null,
  visibleToDonor: true,
  description: '',
  paymentAccountId: 0,
  paymentMethods: [],
  enableMonthlyRecurring: false,
  enableYearlyRecurring: false,
  presetAmounts: {
    oneTime: { enabled: true, presetDetails: [] },
    monthly: { enabled: false, presetDetails: [] },
    yearly: { enabled: false, presetDetails: [] },
  },
  themeColor: '#044bd9',
  images: [],
  customFormId: null,
};

const initialState: DonationState = {
  campaigns: [],
  totalRecordsCount: 0,
  pageCount: 0,
  currentPage: 1,
  pageSize: 10,
  searchTerm: '',
  dateFilter: {},

  // Cache settings
  cache: {},
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
  lastFetchTime: 0,

  campaignForm: initialCampaignForm,
  currentStep: 1,
  completedSteps: [],
  campaignId: null,
  isEditMode: false,

  currentCampaignForDonation: null,

  banners: [],

  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    donation: false,
    banners: false,
  },

  error: {
    list: null,
    detail: null,
    create: null,
    update: null,
    donation: null,
    banners: null,
  },

  successMessage: null,
};

// Helper function to generate cache key
const generateCacheKey = (params: DonationListParams): string => {
  return JSON.stringify({
    pageNo: params.pageNo,
    pageSize: params.pageSize,
    search: params.search || '',
    startDate: params.startDate || '',
    endDate: params.endDate || '',
  });
};

// Async Thunks

// Fetch donation campaign list with caching
export const fetchDonationCampaignList = createAsyncThunk(
  'donation/fetchList',
  async (params: DonationListParams & { forceRefresh?: boolean }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { donation: DonationState };
      const cacheKey = generateCacheKey(params);
      const cachedData = state.donation.cache[cacheKey];
      const now = Date.now();

      // Check if we have valid cached data and not forcing refresh
      if (!params.forceRefresh && cachedData && (now - cachedData.timestamp) < state.donation.cacheExpiry) {
        console.log('✅ Using cached data for:', cacheKey);
        return {
          fromCache: true,
          cacheKey,
          data: {
            pageNo: params.pageNo,
            pageSize: params.pageSize,
            pageCount: cachedData.pageCount,
            totalRecordsCount: cachedData.totalRecordsCount,
            pageData: cachedData.data,
          }
        };
      }

      // Fetch fresh data
      console.log('🌐 Fetching fresh data for:', cacheKey);
      const response = await donationService.getDonationCampaignList(params);
      return {
        fromCache: false,
        cacheKey,
        data: response.data,
      };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch campaigns');
    }
  }
);

// Fetch campaign detail by ID
export const fetchCampaignById = createAsyncThunk(
  'donation/fetchById',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const campaign = await donationService.getDonationCampaignById(campaignId);
      return campaign;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch campaign');
    }
  }
);

// Fetch campaign detail for editing (all steps)
export const fetchCampaignForEdit = createAsyncThunk(
  'donation/fetchForEdit',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const campaignData = await donationService.getCampaignDetailForEdit(campaignId);
      const completedSteps = await donationService.getCompletedSteps(campaignId);
      return { campaignData, completedSteps };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch campaign details');
    }
  }
);

// Create new campaign (Step 1)
export const createCampaign = createAsyncThunk(
  'donation/create',
  async (basicInfo: { name: string; startDate: Date | string; endDate: Date | string }, { rejectWithValue }) => {
    try {
      const response = await donationService.createCampaign(basicInfo);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to create campaign');
    }
  }
);

// Update basic info (Step 1)
export const updateBasicInfo = createAsyncThunk(
  'donation/updateBasicInfo',
  async ({ campaignId, basicInfo }: { campaignId: string; basicInfo: { name: string; startDate: Date | string; endDate: Date | string } }, { rejectWithValue }) => {
    try {
      const response = await donationService.updateBasicInfo(campaignId, basicInfo);
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to update basic info');
    }
  }
);

// Fetch campaign for donation page (public)
export const fetchCampaignForDonation = createAsyncThunk(
  'donation/fetchForDonation',
  async (campaignUniqueId: string, { rejectWithValue }) => {
    try {
      const campaign = await donationService.getCampaignDonateDetails(campaignUniqueId);
      return campaign;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch campaign');
    }
  }
);

// Submit donation
export const submitDonation = createAsyncThunk(
  'donation/submit',
  async ({ campaignId, donationData, turnstileToken }: { campaignId: string; donationData: DonationSubmitRequest; turnstileToken: string }, { rejectWithValue }) => {
    try {
      const response = await donationService.submitDonation(campaignId, donationData, turnstileToken);
      return response;
    } catch (error: any) {
      console.error('Donation submission error:', error?.response?.data);
      return rejectWithValue(error?.response?.data?.message || 'Failed to submit donation');
    }
  }
);

// Fetch banners for a campaign
export const fetchCampaignBanners = createAsyncThunk(
  'donation/fetchBanners',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const banners = await donationService.getBanners(campaignId);
      return { campaignId, banners };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch banners');
    }
  }
);

// Fetch completed steps
export const fetchCompletedSteps = createAsyncThunk(
  'donation/fetchCompletedSteps',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const steps = await donationService.getCompletedSteps(campaignId);
      return steps;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch completed steps');
    }
  }
);

// Slice
const donationSlice = createSlice({
  name: 'donation',
  initialState,
  reducers: {
    // Set campaign form data
    setFormData: (state, action: PayloadAction<Partial<CampaignFormData>>) => {
      state.campaignForm = { ...state.campaignForm, ...action.payload };
    },

    // Update specific form field
    updateFormField: <K extends keyof CampaignFormData>(
      state: DonationState,
      action: PayloadAction<{ field: K; value: CampaignFormData[K] }>
    ) => {
      const { field, value } = action.payload;
      state.campaignForm[field] = value;
    },

    // Set current step
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },

    // Mark step as completed
    completeStep: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },

    // Set campaign ID
    setCampaignId: (state, action: PayloadAction<string>) => {
      state.campaignId = action.payload;
    },

    // Set edit mode
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.isEditMode = action.payload;
    },

    // Reset campaign form
    resetCampaignForm: (state) => {
      state.campaignForm = initialCampaignForm;
      state.currentStep = 1;
      state.completedSteps = [];
      state.campaignId = null;
      state.isEditMode = false;
    },

    // Set search term
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    // Set date filter
    setDateFilter: (state, action: PayloadAction<{ startDate?: string; endDate?: string }>) => {
      state.dateFilter = action.payload;
    },

    // Set pagination
    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.pageSize;
    },

    // Clear success message
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Clear errors
    clearErrors: (state) => {
      state.error = {
        list: null,
        detail: null,
        create: null,
        update: null,
        donation: null,
        banners: null,
      };
    },

    // Invalidate cache (clear all cached data)
    invalidateCache: (state) => {
      state.cache = {};
      console.log('🗑️ Cache invalidated');
    },

    // Invalidate specific cache entry
    invalidateCacheEntry: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
      console.log('🗑️ Cache entry invalidated:', action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch campaign list with caching
    builder
      .addCase(fetchDonationCampaignList.pending, (state) => {
        state.loading.list = true;
        state.error.list = null;
      })
      .addCase(fetchDonationCampaignList.fulfilled, (state, action) => {
        state.loading.list = false;
        const { fromCache, cacheKey, data } = action.payload;

        state.campaigns = data.pageData;
        state.totalRecordsCount = data.totalRecordsCount;
        state.pageCount = data.pageCount;
        state.currentPage = data.pageNo;
        state.pageSize = data.pageSize;
        state.lastFetchTime = Date.now();

        // Update cache if data was fetched (not from cache)
        if (!fromCache) {
          state.cache[cacheKey] = {
            data: data.pageData,
            totalRecordsCount: data.totalRecordsCount,
            pageCount: data.pageCount,
            timestamp: Date.now(),
          };
        }
      })
      .addCase(fetchDonationCampaignList.rejected, (state, action) => {
        state.loading.list = false;
        state.error.list = action.payload as string;
      });

    // Fetch campaign by ID
    builder
      .addCase(fetchCampaignById.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.loading.detail = false;
        // Store in campaignForm if needed for editing
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      });

    // Fetch campaign for edit
    builder
      .addCase(fetchCampaignForEdit.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
      })
      .addCase(fetchCampaignForEdit.fulfilled, (state, action) => {
        state.loading.detail = false;
        const { campaignData, completedSteps } = action.payload;

        // Map campaign data to form structure
        state.campaignForm = {
          name: campaignData.title || '',
          startDate: campaignData.startDate || null,
          endDate: campaignData.endDate || null,
          fundRaisingGoal: campaignData.goalAmount || null,
          visibleToDonor: campaignData.visibleToDonor !== undefined ? campaignData.visibleToDonor : true,
          description: campaignData.description || '',
          paymentAccountId: campaignData.paymentAccountId || 0,
          paymentMethods: campaignData.paymentMethods || [],
          enableMonthlyRecurring: campaignData.enableMonthlyRecurring || false,
          enableYearlyRecurring: campaignData.enableYearlyRecurring || false,
          presetAmounts: campaignData.presetAmounts || initialCampaignForm.presetAmounts,
          themeColor: campaignData.themeColor || '#044bd9',
          images: campaignData.images || [],
          customFormId: campaignData.customFormId || null,
        };

        state.completedSteps = completedSteps;
        state.isEditMode = true;
      })
      .addCase(fetchCampaignForEdit.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload as string;
      });

    // Create campaign
    builder
      .addCase(createCampaign.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading.create = false;
        state.campaignId = action.payload.data;
        state.successMessage = 'Campaign created successfully';
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload as string;
      });

    // Update basic info
    builder
      .addCase(updateBasicInfo.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateBasicInfo.fulfilled, (state, action) => {
        state.loading.update = false;
        state.successMessage = 'Basic information updated successfully';
      })
      .addCase(updateBasicInfo.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload as string;
      });

    // Fetch campaign for donation
    builder
      .addCase(fetchCampaignForDonation.pending, (state) => {
        state.loading.donation = true;
        state.error.donation = null;
      })
      .addCase(fetchCampaignForDonation.fulfilled, (state, action) => {
        state.loading.donation = false;
        state.currentCampaignForDonation = action.payload;
      })
      .addCase(fetchCampaignForDonation.rejected, (state, action) => {
        state.loading.donation = false;
        state.error.donation = action.payload as string;
      });

    // Submit donation
    builder
      .addCase(submitDonation.pending, (state) => {
        state.loading.donation = true;
        state.error.donation = null;
      })
      .addCase(submitDonation.fulfilled, (state, action) => {
        state.loading.donation = false;
        state.successMessage = 'Donation submitted successfully';
      })
      .addCase(submitDonation.rejected, (state, action) => {
        state.loading.donation = false;
        state.error.donation = action.payload as string;
      });

    // Fetch banners
    builder
      .addCase(fetchCampaignBanners.pending, (state) => {
        state.loading.banners = true;
        state.error.banners = null;
      })
      .addCase(fetchCampaignBanners.fulfilled, (state, action) => {
        state.loading.banners = false;
        state.banners = action.payload.banners;
      })
      .addCase(fetchCampaignBanners.rejected, (state, action) => {
        state.loading.banners = false;
        state.error.banners = action.payload as string;
      });

    // Fetch completed steps
    builder
      .addCase(fetchCompletedSteps.fulfilled, (state, action) => {
        state.completedSteps = action.payload;
      });
  },
});

export const {
  setFormData,
  updateFormField,
  setCurrentStep,
  completeStep,
  setCampaignId,
  setEditMode,
  resetCampaignForm,
  setSearchTerm,
  setDateFilter,
  setPagination,
  clearSuccessMessage,
  clearErrors,
  invalidateCache,
  invalidateCacheEntry,
} = donationSlice.actions;

export default donationSlice.reducer;
