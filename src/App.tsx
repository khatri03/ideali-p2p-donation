import './assets/css/App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import OrganizerLayout from './app/components/organizer/dashboard/organizerDashboard';
import MemberLayout from './app/components/member/memberLayout/MemberLayout';
import DonateToCampaign from './app/components/organizer/donation/donateToCampaign';
import CreateDonationPage from './app/components/organizer/donation/createDonationPage';
import CreateMembershipPage from './app/components/organizer/membership/pages/CreateMembershipPage';
import MemberRegistrationPage from './app/components/organizer/membership/pages/MemberRegistrationPage';
import MembershipInvoiceViewPage from './app/components/organizer/membership/pages/MembershipInvoiceViewPage';
import { CustomFormCreatePage } from './app/components/organizer/membership/customForm/custom-form-bundle/customForm/pages/CustomFormCreatePage';
import InvoiceDetail from './app/components/organizer/donation/InvoiceDetail';
import ResetPassword from './app/components/auth/resetPassword';
import ForgotPassword from './app/components/auth/forgotPassword';
import CampaignList from '../src/app/components/organizer/donation/publicCampaigns/campaignList';
import FundraiserJoinPage from './app/components/organizer/donation/peerToPeer/join/FundraiserJoinPage';
import VerifyEmailPage from './app/components/organizer/donation/peerToPeer/verify/VerifyEmailPage';
import SuspenseLoader from './app/components/common/SuspenseLoader';

import {
  ChakraProvider,
  // extendTheme
} from '@chakra-ui/react';
import initialTheme from './theme/theme'; //  { themeGreen }
import { Suspense, lazy, useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

// The public fundraiser surfaces are reached by strangers following a shared link, so they are split
// out of the bundle every signed-in screen already pays for.
const FundraiserPageScreen = lazy(
  () => import('./app/components/organizer/donation/peerToPeer/page/FundraiserPage'),
);
const FundraiserDonatePage = lazy(
  () => import('./app/components/organizer/donation/peerToPeer/page/FundraiserDonatePage'),
);

ReactGA.initialize('G-R0531NLBYE');
// Chakra imports

export default function Main() {
  const location = useLocation();
  // eslint-disable-next-line
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return (
    <ChakraProvider theme={currentTheme}>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route
          path="admin/*"
          element={
            <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />
         <Route
          path="organizer/*"
          element={
            <OrganizerLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />
        <Route
          path="member/*"
          element={
            <MemberLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />
        <Route path="/donate/:campaignId" element={<DonateToCampaign />} />
        <Route
          path="/donation/campaign/:campaignUniqueId/peer-to-peer/join"
          element={<FundraiserJoinPage />}
        />
        <Route
          path="/donation/campaign/:campaignUniqueId/peer-to-peer/verify-email"
          element={<VerifyEmailPage />}
        />
        {/* Mirrors the backend route exactly, minus /api. The donate route is declared first so a
            fundraiser whose page address ends in "donate" cannot shadow it. */}
        <Route
          path="/campaigns/:campaignSlug/:fundraiserSlug/donate"
          element={
            <Suspense fallback={<SuspenseLoader />}>
              <FundraiserDonatePage />
            </Suspense>
          }
        />
        <Route
          path="/campaigns/:campaignSlug/:fundraiserSlug"
          element={
            <Suspense fallback={<SuspenseLoader />}>
              <FundraiserPageScreen />
            </Suspense>
          }
        />
        <Route path="/campaign-list/:organizerUniqueId" element={<CampaignList />} />
        <Route path="/create-donation-campaign" element={<CreateDonationPage />} />
        <Route path="/create-donation-campaign/:campaignId" element={<CreateDonationPage />} />
        <Route path="/create-membership-type" element={<CreateMembershipPage />} />
        <Route path="/create-membership-type/:membershipId" element={<CreateMembershipPage />} />
        <Route path="/membership/register/:membershipId" element={<MemberRegistrationPage />} />
        <Route path="/membership/register" element={<MemberRegistrationPage />} />
        <Route path="/custom-form/list" element={<Navigate to="/organizer/custom-form/list" replace />} />
        <Route path="/custom-form/create-form" element={<CustomFormCreatePage />} />
        <Route path="/custom-form/:customFormUniqueId/edit" element={<CustomFormCreatePage />} />
        <Route path="/invoice/:invoiceUniqueId" element={<InvoiceDetail />} />
        <Route path="/public/membership-invoice/:invoiceId/view" element={<MembershipInvoiceViewPage />} />

        {/* Account routes */}
        <Route path="/account/reset-password" element={<ResetPassword />} />
        <Route path="/account/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<Navigate to="/auth/sign-in/custom" replace />}
        />
         <Route path="/sign-up" element={<Navigate to="/auth/sign-up/default" replace />}
        />
        
        
        <Route path="/forgot-password" element={<Navigate to="/forgot-password/default" replace />}
        />
      </Routes>
    </ChakraProvider>
  );
}
