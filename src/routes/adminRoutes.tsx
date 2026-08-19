import { lazy } from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdGroupAdd,
  MdSwapHoriz,
  MdReceiptLong,
  MdNotifications,
} from 'react-icons/md';
import ProfileSettings from 'app/components/admin/profile/profileSettings';
import OrganizerProfilePage from 'app/components/admin/profile/OrganizerProfilePage';
import TipReport from 'app/components/admin/tip/tipReport';

// Lazy load all route components for better performance
const AdminDashboard = lazy(() => import('../app/components/admin/adminDashboard/overview'));
const OrganizerList = lazy(() => import('../app/components/admin/manageOrganizer/OrganizerList'));
const OrganizerDashboardOverview = lazy(() => import('../app/components/organizer/dashboard/organizerDashboardOverview'));
const CreateOrganizer = lazy(() => import('app/components/admin/manageOrganizer/createOrganizer'));
const NotificationCenter = lazy(() => import('app/components/admin/notificationCenter/NotificationCenter'));
const CreateNotification = lazy(() => import('app/components/admin/notificationCenter/createnotification'));
const EditNotification = lazy(() => import('app/components/admin/notificationCenter/editNotification'));
const ViewNotification = lazy(() => import('app/components/admin/notificationCenter/viewNotification'));


export const adminRoutes = [
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/admin-dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <AdminDashboard />,
  },
  
  // {
  //   name: 'Organizer Dashboard',
  //   layout: '/organizer',
  //   path: '/organizer-dashboard',
  //   icon: <Icon as={MdSwapHoriz} width="20px" height="20px" color="inherit" />,
  //   component: <OrganizerDashboardOverview />,
  // },

  // {
  //   name: 'Manage Organizer',
  //   layout: '/admin',
  //   path: '/manage-organizer',
  //   icon: <Icon as={MdGroupAdd} width="20px" height="20px" color="inherit" />,
  //   component: <CreateOrganizer />,
  // },
  {
    name: 'Manage Org',
    path: '/manage-organizer',
    icon: <Icon as={MdGroupAdd} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      {
        name: 'List of Organizers',
        layout: '/admin',
        path: '/manage-organizer/list',
        component: <OrganizerList />,
      },
      {
        name: '',
        navbarTitle: 'Create Organizer',
        layout: '/admin',
        path: '/manage-organizer/create',
        component: <CreateOrganizer />,
      },
      {
        name: '',
        navbarTitle: 'Edit Organizer',
        layout: '/admin',
        path: '/manage-organizer/profile/:organizerUniqueId',
        component: <OrganizerProfilePage />,
      },
    ],
  }
  ,
  {
    name: 'Tip Report',
    path: '/tip-report',
    icon: <Icon as={MdReceiptLong} width="20px" height="20px" color="inherit" />,
    collapse: false,
    layout: '/admin',
    component: <TipReport />,
  },
  {
    name: 'Notification Center',
    path: '/notification-center',
    icon: <Icon as={MdNotifications} width="20px" height="20px" color="inherit" />,
    collapse: true,
    items: [
      {
        name: 'Notification Center',
        layout: '/admin',
        path: '/notification-center/list',
        component: <NotificationCenter />,
      },
      {
        name: '',
        navbarTitle: 'Create Notification',
        layout: '/admin',
        path: '/notification-center/create',
        component: <CreateNotification />,
      },
      {
        name: '',
        navbarTitle: 'Edit Notification',
        layout: '/admin',
        path: '/notification-center/edit/:notificationId',
        component: <EditNotification />,
      },
      {
        name: '',
        navbarTitle: 'View Notification',
        layout: '/admin',
        path: '/notification-center/view/:notificationId',
        component: <ViewNotification />,
      },
    ],
  }

  // ,
  // {
  //   name: 'MemberShip Module',
  //   layout: '/admin',
  //   path: '/membership-module',
  //   icon: <Icon as={MdCardMembership} width="20px" height="20px" color="inherit" />,
  //   component: <MemberShipList />,
  // },
  //  {
  //   name: 'Donation',
  //   layout: '/admin',
  //   path: '/donation',
  //   icon: <Icon as={MdBloodtype} width="20px" height="20px" color="inherit" />,
  //   component: <DonationList />,
  // },
  //  {
  //   name: 'MemberList',
  //   layout: '/admin',
  //   path: '/member-list',
  //   icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
  //   component: <MemberList />,
  // },
  //    {
  //   name: 'Manage Mudule',
  //   layout: '/admin',
  //   path: '/manage-module',
  //   icon: <Icon as={MdViewCarousel} width="20px" height="20px" color="inherit" />,
  //   component: <AdminDashboard />,
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
  //        icon: <Icon as={MdFormatListBulletedAdd} width="20px" height="20px" color="inherit" />,
  //       component: <ManageBackgroundImage />,
  //       secondary: true,
  //     },
  //     {
  //       name: 'Manage Banner Image',
  //       layout: '/admin',
  //       icon: <Icon as={MdFormatListNumbered} width="20px" height="20px" color="inherit" />,
  //       path: '/Event/ManageBannerImage',
  //         component: <ManageBannerImage />,
  //         secondary: true,
  //     },
  //     {
  //       name: 'Create Manage Event ',
  //       layout: '/admin',
  //       path: '/Event/CreateManageEvent',
  //         component: <CreateManageEvent />,
  //         secondary: true,
  //     },
  //     {
  //       name: 'Create Manage Sessions ',
  //       layout: '/admin',
  //       path: '/Event/CreateManageSessions',
  //         component: <CreateManageSessions />,
  //         secondary: true,
  //     },
  //   ]
  // }
];

export default adminRoutes;
