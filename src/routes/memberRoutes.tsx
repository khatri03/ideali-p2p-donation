import { lazy } from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdVolunteerActivism,
  MdExplore,
  MdSettings,
  MdCardMembership,
  MdFolder,
  MdCampaign,
} from 'react-icons/md';
import { getAllowedModules } from '../utils/allowedModules';
import { isFundraiser } from '../utils/fundraiserClaim';

const DonorDashboard = lazy(
  () => import('../app/components/member/dashboard/DonorDashboard'),
);
const MembershipHistoryDashboard = lazy(
  () => import('../app/components/member/membershipHistory/MembershipHistoryDashboard'),
);
const MyDonationsPage = lazy(
  () => import('../app/components/member/myDonations/MyDonationsPage'),
);
const DiscoverPage = lazy(
  () => import('../app/components/member/discover/DiscoverPage'),
);
const DonorSettingsPage = lazy(
  () => import('../app/components/member/settings/DonorSettingsPage'),
);
const MemberDocumentsPage = lazy(
  () => import('../app/components/member/documents/MemberDocumentsPage'),
);
const MemberDocumentCategoryPage = lazy(
  () => import('../app/components/member/documents/MemberDocumentCategoryPage'),
);
const MyFundraisingScreen = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/console/MyFundraisingPage'),
);
const EditFundraiserPageScreen = lazy(
  () => import('../app/components/organizer/donation/peerToPeer/console/EditFundraiserPage'),
);
const MemberNotificationsList = lazy(
  () => import('../app/components/member/notifications/NotificationsList'),
);
const MemberNotificationsDetails = lazy(
  () => import('../app/components/member/notifications/NotificationsDetails'),
);

const isMemberRole = localStorage.getItem('currentRole') === 'Member';
const isDonorRole  = localStorage.getItem('currentRole') === 'Donor';

// Presentation only. Every console endpoint decides ownership on the server, so a token edited to
// carry this claim buys a menu item and a screen that then refuses to load.
const isFundraising = isFundraiser();

const allowedModules = getAllowedModules().map((m) => m.toLowerCase());
const hasMembershipModule = allowedModules.includes('membership');
const hasDonationModule = allowedModules.includes('donation');

const allMemberRoutes = [
  {
    // Shared dashboard — adapts its own content to the allowed modules.
    name: 'Dashboard',
    layout: '/member',
    path: '/dashboard',
    memberOnly: false,
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <DonorDashboard />,
  },
  {
    name: 'Membership History',
    navbarTitle: 'Membership History',
    layout: '/member',
    path: '/membership-history',
    memberOnly: true,
    memberExclusive: true,
    requiresModule: 'Membership',
    icon: <Icon as={MdCardMembership} width="20px" height="20px" color="inherit" />,
    component: <MembershipHistoryDashboard />,
  },
  {
    name: 'Documents',
    navbarTitle: 'Documents',
    layout: '/member',
    path: '/documents',
    memberOnly: true,
    memberExclusive: true,
    requiresModule: 'Membership',
    icon: <Icon as={MdFolder} width="20px" height="20px" color="inherit" />,
    component: <MemberDocumentsPage />,
  },
  {
    name: '',
    navbarTitle: 'Documents',
    layout: '/member',
    path: '/documents/:categoryId',
    memberOnly: true,
    memberExclusive: true,
    requiresModule: 'Membership',
    component: <MemberDocumentCategoryPage />,
  },
  {
    name: 'My Donations',
    navbarTitle: 'Donations',
    layout: '/member',
    path: '/my-donations',
    memberOnly: false,
    requiresModule: 'Donation',
    icon: <Icon as={MdVolunteerActivism} width="20px" height="20px" color="inherit" />,
    component: <MyDonationsPage />,
  },
  {
    name: 'Discover',
    navbarTitle: 'Discover',
    layout: '/member',
    path: '/discover',
    memberOnly: false,
    requiresModule: 'Donation',
    icon: <Icon as={MdExplore} width="20px" height="20px" color="inherit" />,
    component: <DiscoverPage />,
  },
  {
    // The claim decides whether the item is named, and an unnamed route is left out of the sidebar.
    // The route itself is always registered, so somebody whose token predates their first page can
    // still open the address - the server decides what they may see, not this list.
    name: isFundraising ? 'My Fundraising' : '',
    navbarTitle: 'My Fundraising',
    layout: '/member',
    path: '/my-fundraising',
    memberOnly: true,
    icon: <Icon as={MdCampaign} width="20px" height="20px" color="inherit" />,
    component: <MyFundraisingScreen />,
  },
  {
    name: '',
    navbarTitle: 'Edit My Fundraising Page',
    layout: '/member',
    path: '/my-fundraising/:fundraiserUniqueId',
    memberOnly: true,
    component: <EditFundraiserPageScreen />,
  },
  {
    name: 'Settings',
    navbarTitle: 'Profile',
    layout: '/member',
    path: '/settings',
    memberOnly: true,
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <DonorSettingsPage />,
  },
  {
    // Hidden from sidebar nav (empty name) — reachable via the notification bell only.
    name: '',
    navbarTitle: 'Notifications',
    layout: '/member',
    path: '/notifications/list',
    memberOnly: true,
    memberExclusive: true,
    component: <MemberNotificationsList />,
  },
  {
    name: '',
    navbarTitle: 'Notification Detail',
    layout: '/member',
    path: '/notifications/view/:uniqueId',
    memberOnly: true,
    memberExclusive: true,
    component: <MemberNotificationsDetails />,
  },
];

// Primary path: filter by the JWT's allowed-modules claim, so a user with both
// 'Donation' and 'Membership' modules sees both sets of nav items. Falls back
// to the legacy currentRole-based split for tokens that don't carry the claim.
export const memberRoutes = (allowedModules.length > 0
  ? allMemberRoutes.filter((r) => {
      if (r.requiresModule === 'Membership') return hasMembershipModule;
      if (r.requiresModule === 'Donation') return hasDonationModule;
      return true;
    })
  : isMemberRole
  ? allMemberRoutes.filter((r) => r.name === 'Dashboard' || r.memberOnly)
  : isDonorRole
  ? allMemberRoutes.filter((r) => !(r as any).memberExclusive)
  : allMemberRoutes);

export default memberRoutes;
