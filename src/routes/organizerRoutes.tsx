import { lazy } from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdEventNote,
  MdPeople,
  MdBloodtype,
  MdTripOrigin, // for Trip
  MdBusinessCenter, // for Exhibition
  MdImage, // for Manage Background Image
  MdPhotoCamera, // for Manage Banner Image
  MdEventAvailable, // for Create Manage Event
  MdSchedule, // for Create Manage Sessions
  MdSwapHoriz, // for Swap Icon
  MdGroup,
  MdSettings, // for Settings
  MdNotifications,
  MdDynamicForm, // for Custom Forms
} from 'react-icons/md';
import Integrations from 'app/components/organizer/settings/integrations/integrations';
import PendingApprovalsBadge from '../app/components/organizer/membership/common/PendingApprovalsBadge';

// Lazy load all route components for better performance
const OrganizerDashboardOverview = lazy(
  () =>
    import('../app/components/organizer/dashboard/organizerDashboardOverview'),
);
const CreateDonationModule = lazy(
  () => import('../app/components/organizer/donation/createDonation'),
);
const DonationModule = lazy(
  () => import('../app/components/organizer/donation/donationModule'),
);
const CreateDonationPage = lazy(
  () => import('../app/components/organizer/donation/createDonationPage'),
);
const PeerToPeerSettingsPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/PeerToPeerSettingsPage'),
);

const ModeratedFundraisersPage = lazy(
  () =>
    import('../app/components/organizer/donation/peerToPeer/moderation/ModeratedFundraisersPage'),
);
const ModeratedFundraiserPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/moderation/ModeratedFundraiserPage'),
);
const ModeratedTeamsPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/moderation/ModeratedTeamsPage'),
);
const ModeratedTeamPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/moderation/ModeratedTeamPage'),
);
const InvitationsPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/invitations/InvitationsPage'),
);
const EmailTemplatesPage = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/invitations/EmailTemplatesPage'),
);
const MembershipListPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MembershipListPage'),
);
const MembershipPaymentsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MembershipPaymentsPage'),
);
const CustomListsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/CustomListsPage'),
);
const DocumentsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/DocumentsPage'),
);
const CreateDocumentCategoryPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/CreateDocumentCategoryPage'),
);
const CreateCustomListPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/CreateCustomListPage'),
);
const MemberAlertsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MemberAlertsPage'),
);
const CreateMemberAlertPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/CreateMemberAlertPage'),
);
const AlertDetailsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/AlertDetailsPage'),
);
const MembershipMembersPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MembershipMembersPage'),
);
const MembershipPendingApprovalsPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MembershipPendingApprovalsPage'),
);
const MemberProfilePage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MemberProfilePage'),
);
const MembershipPaymentDetailPage = lazy(
  () =>
    import('../app/components/organizer/membership/pages/MembershipPaymentDetailPage'),
);
const CustomFormsPage = lazy(() =>
  import('../app/components/organizer/membership/customForm/custom-form-bundle/customForm/pages/CustomFormsPage').then(
    (module) => ({ default: module.CustomFormsPage }),
  ),
);
const CustomFormCreatePage = lazy(() =>
  import('../app/components/organizer/membership/customForm/custom-form-bundle/customForm/pages/CustomFormCreatePage').then(
    (module) => ({ default: module.CustomFormCreatePage }),
  ),
);
const AdminDashboard = lazy(
  () => import('../app/components/admin/adminDashboard/overview'),
);
const InvoiceListPage = lazy(() =>
  import('app/components/organizer/donation/InvoiceListPage').then(
    (module) => ({ default: module.InvoiceListPage }),
  ),
);
const DonationInvoiceList = lazy(
  () => import('app/components/organizer/donation/allInvoice'),
);
const PaymentAccountList = lazy(
  () => import('app/components/organizer/settings/payment/PaymentAccountList'),
);
const PaymentAccountForm = lazy(
  () => import('app/components/organizer/settings/payment/PaymentAccountForm'),
);
const DonorList = lazy(
  () => import('app/components/organizer/donation/DonorList'),
);
const CampaignSpecificDonors = lazy(
  () => import('app/components/organizer/donation/CampaignSpecificDonors'),
);
const InvoiceDetail = lazy(
  () => import('app/components/organizer/donation/InvoiceDetail'),
);
const RecurringDonations = lazy(
  () => import('app/components/organizer/donation/RecurringDonation'),
);
const CampaignRecurringDonationWrapper = lazy(
  () =>
    import('app/components/organizer/donation/CampaignRecurringDonationWrapper'),
);
const ArchiveList = lazy(
  () => import('app/components/organizer/donation/archiveList'),
);
const ProfileSettings = lazy(
  () => import('../app/components/organizer/settings/profile/profileSettings'),
);
const RolesPermissions = lazy(
  () => import('../app/components/organizer/rolesPermissions/Users'),
);
const AccessDenied = lazy(
  () => import('../app/components/organizer/common/AccessDenied'),
);
const NotificationsList = lazy(
  () => import('../app/components/organizer/notifications/NotificationsList'),
);
const NotificationsDetails = lazy(
  () =>
    import('../app/components/organizer/notifications/notificationsDetails'),
);

export const organizerRoutes = [
  {
    name: 'Dashboard',
    layout: '/organizer',
    path: '/organizer-dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />, // Swap Icon added
    component: <OrganizerDashboardOverview />,
  },
  // {
  //   name: 'AdminDashboard',
  //   layout: '/admin',
  //   path: '/admin-dashboard',
  //   icon: <Icon as={MdSwapHoriz} width="20px" height="20px" color="inherit" />,
  //   component: <AdminDashboard />,
  // },
  // {
  //   name: 'MemberList',
  //   layout: '/organizer',
  //   path: '/member-list',
  //   icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
  //   component: <MemberList />,
  // },
  {
    name: 'Donation',
    path: '/donation',
    icon: <Icon as={MdBloodtype} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      {
        name: 'Campaigns',
        layout: '/organizer',
        path: '/donation/manage-donation-module',
        component: <DonationModule />,
      },
      {
        name: 'Payments',
        layout: '/organizer',
        path: '/donation/list/paid',
        component: <DonationInvoiceList />,
      },
      {
        name: 'Donors',
        layout: '/organizer',
        path: '/donation/donor-list',
        component: <DonorList />,
      },
      {
        name: 'Recurring Donations',
        layout: '/organizer',
        path: '/donation/recurring-donations',
        component: <RecurringDonations />,
      },
      {
        name: 'Archived List',
        layout: '/organizer',
        path: '/donation/archived-donors',
        component: <ArchiveList />,
      },
      {
        name: '',
        layout: '/organizer',
        path: '/donation/recurring-donations/:campaignId?',
        component: <CampaignRecurringDonationWrapper />,
      },
      {
        name: '',
        layout: '/organizer',
        path: '/donation/invoice-list/:campaignId?',
        component: <InvoiceListPage />,
      },
      {
        name: '',
        layout: '/organizer',
        path: '/donation/donor-list/:campaignId?',
        component: <CampaignSpecificDonors />,
      },
      {
        name: '',
        layout: '/organizer',
        path: '/donation/invoice-detail/:invoiceUniqueId?',
        component: <InvoiceDetail />,
      },
    ],
  },
  {
    name: 'Membership',
    path: '/membership',
    icon: <Icon as={MdGroup} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      {
        name: 'Membership Types',
        layout: '/organizer',
        path: '/membership/manage',
        component: <MembershipListPage />,
      },
      {
        name: 'Members',
        layout: '/organizer',
        path: '/membership/members',
        component: <MembershipMembersPage />,
      },
      {
        name: 'Pending Approvals',
        layout: '/organizer',
        path: '/membership/pending-approvals',
        component: <MembershipPendingApprovalsPage />,
        badge: <PendingApprovalsBadge />,
      },
      {
        name: 'Payments',
        layout: '/organizer',
        path: '/membership/payments',
        component: <MembershipPaymentsPage />,
      },
      {
        name: 'Custom Lists',
        layout: '/organizer',
        path: '/membership/custom-lists',
        component: <CustomListsPage />,
      },
      {
        name: 'Documents',
        layout: '/organizer',
        path: '/membership/documents',
        component: <DocumentsPage />,
      },
      {
        name: '',
        navbarTitle: 'New Document Category',
        layout: '/organizer',
        path: '/membership/documents/create',
        component: <CreateDocumentCategoryPage />,
        invisible: true,
      },
      {
        name: '',
        navbarTitle: 'Edit Document Category',
        layout: '/organizer',
        path: '/membership/documents/:documentCategoryId/edit',
        component: <CreateDocumentCategoryPage />,
        invisible: true,
      },
      {
        name: '',
        navbarTitle: 'New Custom List',
        layout: '/organizer',
        path: '/membership/custom-lists/create',
        component: <CreateCustomListPage />,
        invisible: true,
      },
      {
        name: '',
        navbarTitle: 'Edit Custom List',
        layout: '/organizer',
        path: '/membership/custom-lists/:customListId/edit',
        component: <CreateCustomListPage />,
        invisible: true,
      },
      {
        name: 'Member Alerts',
        layout: '/organizer',
        path: '/membership/member-alerts',
        component: <MemberAlertsPage />,
      },
      {
        name: '',
        navbarTitle: 'New Alert',
        layout: '/organizer',
        path: '/membership/member-alerts/new',
        component: <CreateMemberAlertPage />,
        invisible: true,
      },
      {
        name: '',
        navbarTitle: 'Alert Details',
        layout: '/organizer',
        path: '/membership/member-alerts/:uniqueId',
        component: <AlertDetailsPage />,
        invisible: true,
      },
      {
        name: '',
        navbarTitle: 'Membership Profile',
        layout: '/organizer',
        path: '/membership/member-profile',
        component: <MemberProfilePage />,
        invisible: true,
      },
      {
        name: '',
        layout: '/organizer',
        path: '/membership/invoice-detail/:invoiceId',
        component: <MembershipPaymentDetailPage />,
        invisible: true,
      },
    ],
  },
  {
    name: 'Custom Forms',
    layout: '/organizer',
    path: '/custom-form/list',
    icon: <Icon as={MdDynamicForm} width="20px" height="20px" color="inherit" />,
    component: <CustomFormsPage />,
  },
  {
    name: '',
    layout: '/organizer',
    path: '/custom-form/create-form',
    component: <CustomFormCreatePage />,
    invisible: true,
  },
  {
    name: '',
    layout: '/organizer',
    path: '/custom-form/:customFormUniqueId/edit',
    component: <CustomFormCreatePage />,
    invisible: true,
  },
  {
    name: 'Settings',
    path: '/setting',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      {
        name: 'Payment Account',
        layout: '/organizer',
        path: '/setting/payment-account-list',
        component: <PaymentAccountList />,
      },
      {
        name: 'Profile Settings',
        layout: '/organizer',
        path: '/setting/profile-settings',
        component: <ProfileSettings />,
      },
      {
        name: 'Connectors',
        layout: '/organizer',
        path: '/setting/integrations',
        component: <Integrations />,
      },
    ],
  },
  {
    name: 'Roles & Permissions',
    layout: '/organizer',
    path: '/roles-permissions',
    icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
    component: <RolesPermissions />,
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: (
      <Icon as={MdNotifications} width="20px" height="20px" color="inherit" />
    ),
    collapse: true,
    items: [
      {
        name: 'Notifications',
        layout: '/organizer',
        path: '/notifications/list',
        component: <NotificationsList />,
      },
      {
        name: '',
        navbarTitle: 'Notification Detail',
        layout: '/organizer',
        path: '/notifications/view/:recipientId',
        component: <NotificationsDetails />,
      },
    ],
  },
  {
    name: 'Access Denied',
    layout: '/organizer',
    path: '/access-denied',
    component: <AccessDenied />,
    invisible: true,
  },
  {
    name: 'Payment Account',
    layout: '/organizer',
    path: '/setting/payment-account',
    component: <PaymentAccountForm />,
    invisible: true,
  },
  {
    name: 'Edit Payment Account',
    layout: '/organizer',
    path: '/setting/payment-account/:accountId/edit',
    component: <PaymentAccountForm />,
    invisible: true,
  },
  {
    name: 'Create Donation',
    layout: '/organizer',
    path: '/manage-create-donation',
    icon: <Icon as={MdBloodtype} width="20px" height="20px" color="inherit" />,
    component: <CreateDonationModule />,
  },
  {
    name: 'Create Donation Campaign',
    layout: '/organizer',
    path: '/create-donation-campaign/:campaignId?',
    icon: <Icon as={MdBloodtype} width="20px" height="20px" color="inherit" />,
    component: <CreateDonationPage />,
  },
  {
    name: 'P2P Fundraising',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer',
    component: <PeerToPeerSettingsPage />,
    invisible: true,
  },
  {
    name: 'Supporter Fundraising Pages',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/fundraisers',
    component: <ModeratedFundraisersPage />,
    invisible: true,
  },
  {
    name: 'Supporter Fundraising Page',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/fundraisers/:fundraiserUniqueId',
    component: <ModeratedFundraiserPage />,
    invisible: true,
  },
  {
    name: 'Supporter Fundraising Teams',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/teams',
    component: <ModeratedTeamsPage />,
    invisible: true,
  },
  {
    name: 'Supporter Fundraising Team',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/teams/:teamUniqueId',
    component: <ModeratedTeamPage />,
    invisible: true,
  },
  {
    name: 'Fundraising Invitations',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/invitations',
    component: <InvitationsPage />,
    invisible: true,
  },
  {
    name: 'Supporter Lifecycle Emails',
    layout: '/organizer',
    path: '/donation/campaign/:campaignUniqueId/peer-to-peer/email-templates',
    component: <EmailTemplatesPage />,
    invisible: true,
  },

  // {
  //   name: 'Trip',
  //   layout: '/organizer',
  //   path: '/manage-trip-module',
  //   icon: <Icon as={MdTripOrigin} width="20px" height="20px" color="inherit" />,
  //   component: <CreateMembershipPage />, // TODO: Replace with actual Trip component
  // },
  // {
  //   name: 'Exhibition',
  //   layout: '/organizer',
  //   path: '/manage-exhibition-module',
  //   icon: <Icon as={MdBusinessCenter} width="20px" height="20px" color="inherit" />,
  //   component: <CreateMembershipPage />, // TODO: Replace with actual Exhibition component
  // },
  // {
  //   name: 'Event',
  //   path: '/admin',
  //   icon: <Icon as={MdEventNote} width="20px" height="20px" color="inherit" />,
  //   collapse: true,
  //   items: [
  //     {
  //       name: 'Manage Background Image',
  //       layout: '/admin',
  //       path: '/Event/ManageBackgroundImage',
  //       icon: <Icon as={MdImage} width="20px" height="20px" color="inherit" />,
  //       component: <ManageBackgroundImage />,
  //       secondary: true,
  //     },
  //     {
  //       name: 'Manage Banner Image',
  //       layout: '/admin',
  //       icon: <Icon as={MdPhotoCamera} width="20px" height="20px" color="inherit" />,
  //       path: '/Event/ManageBannerImage',
  //       component: <ManageBannerImage />,
  //       secondary: true,
  //     },
  //     {
  //       name: 'Create Manage Event',
  //       layout: '/admin',
  //       path: '/Event/CreateManageEvent',
  //       icon: <Icon as={MdEventAvailable} width="20px" height="20px" color="inherit" />,
  //       component: <CreateManageEvent />,
  //       secondary: true,
  //     },
  //     {
  //       name: 'Create Manage Sessions',
  //       layout: '/admin',
  //       path: '/Event/CreateManageSessions',
  //       icon: <Icon as={MdSchedule} width="20px" height="20px" color="inherit" />,
  //       component: <CreateManageSessions />,
  //       secondary: true,
  //     },
  //   ],
  // },
];

export default organizerRoutes;
