export interface createDonationDto {
  name: string;
  startDate :Date ;
  endDate : Date;
  
}

export interface donationGoal {
  fundRaisingGoal: number;
}

export interface descriptionDto{
  description: string;
} 

export interface  paymentAccountDto{
    paymentAccountId: number;
    paymentMethods: string[];
};

export interface CampaignData {
  uniqueId: string;
  name: string;
  startDate: string;
  endDate: string;
  goalAmount: number | null;
  description: string | null;
  publishDate: string | null;
  campaignStatus: string;
  paymentAccount: {
    name: string;
    merchant: string;
    methods: string[];
  };
}