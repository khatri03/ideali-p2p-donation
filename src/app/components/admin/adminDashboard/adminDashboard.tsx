import React, { useEffect } from 'react';
import { Box, HStack, Button, useColorModeValue } from '@chakra-ui/react';
import { NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import Overview from './overview';



export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('AuthToken');
    if (!authToken || !isRealAdmin()) {
      navigate('/auth/sign-in/custom');
    }
  }, [navigate]);

  const bg = useColorModeValue('background.100', 'background.900');
  const location = useLocation();
  const isOverview = location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/dashboard/overview');
  // const isUsers = location.pathname.endsWith('/dashboard/users');
  // const isSettings = location.pathname.endsWith('/dashboard/settings');

  return (
    <Box px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }} bg={bg} minH="100%">
      <HStack spacing={3} mb={6}>
        <Button as={NavLink} to="overview" variant={isOverview ? 'solid' : 'outline'}>
          Overview
        </Button>
        {/* <Button as={NavLink} to="users" variant={isUsers ? 'solid' : 'outline'}>
          Users
        </Button> */}
        {/* <Button as={NavLink} to="settings" variant={isSettings ? 'solid' : 'outline'}>
          Settings
        </Button> */}
      </HStack>

      <Routes>
        <Route path="overview" element={<Overview />} />
        {/* <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} /> */}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </Box>
  );
}
