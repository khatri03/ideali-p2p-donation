import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, FileText } from 'lucide-react';
import HttpClient from '../../../service/httpClient/HttpClient';

export default function InvoiceListPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await HttpClient.get(
        "/api/donation/campaign/list?pageNo=1&pageSize=5000",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      // Extract campaigns from the response
      if (response && response.data && response.data.campaigns) {
        setCampaigns(response.data.campaigns);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      console.error('Error fetching campaigns:', err);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">reddevil</h1>
          <p className="text-slate-600">Select a campaign to view Payments</p>
        </div>

        {/* Campaign Selector Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Campaign
          </label>
          
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-white border-2 border-slate-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">
                  {selectedCampaign ? selectedCampaign.name : 'Choose a campaign...'}
                </span>
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Dropdown List */}
                <div className="overflow-y-auto max-h-80">
                  {loading ? (
                    <div className="p-4 text-center text-slate-500">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Loading campaigns...
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">
                      Error: {error}
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No campaigns found
                    </div>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => handleSelectCampaign(campaign)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">{campaign.name}</div>
                        <div className="text-sm text-slate-500 mt-1">ID: {campaign.id}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Campaign Details */}
          {selectedCampaign && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Selected Campaign</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Name:</span>
                  <span className="ml-2 text-blue-900">{selectedCampaign.name}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">ID:</span>
                  <span className="ml-2 text-blue-900">{selectedCampaign.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice List Placeholder */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Invoices</h2>
          {selectedCampaign ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>reddevil for "{selectedCampaign.name}" will appear here</p>
            </div>
          ) : (
            <div className="text-center p12 text-slate-500">
              <p>Please select a campaign to view reddevil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}