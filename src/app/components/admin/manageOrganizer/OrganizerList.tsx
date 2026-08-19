import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Chakra imports
import {
  Flex, useToast
} from '@chakra-ui/react';
import Card from 'themeComponents/card/Card';

import SearchTableOrganizer from '../manageOrganizer/organizerDataTable';
import Loader from '../../common/Loader';

import adminService from '../../../service/admin/adminService';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import CommonMethod from 'app/service/helpers/commonMethod';
export default function OrganizerList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  useEffect(() => {
    if (!isRealAdmin()) {
      navigate('/auth/sign-in/custom');
      return;
    }
    GetOrganizerData();
  }, [navigate, pageIndex, pageSize]);



  const GetOrganizerData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getActiveOrganizers(
        pageIndex + 1,
        pageSize
      );

      const apiData = response.pageData || [];
      // Map API data to table rows
      const rows = apiData.map((item) => ({
        name: item.name || '-',
        modules: item.modules ? item.modules.join(', ') : '-',
        status: item.status || '-',
         emailAddress: item.emailAddress || '-',
         organizerUniqueId: item.uniqueId  || '-',
      }));

      setData(rows);
      setTotalRows(response.totalRecordsCount || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: "top-right"
      });
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <Flex direction='column' pt={{ sm: '125px', lg: '75px' }} align="center" justify="center" minH="400px">
        <Loader
          message="Loading Organizers..."
          subtitle="Please wait while we fetch the organizer list"
        />
      </Flex>
    );
  }

  return (
    <Flex direction='column' pt={{ sm: '125px', lg: '75px' }}>
      <Card px='0px'>
        <SearchTableOrganizer
          data={data}
          totalRows={totalRows}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          onPaginationChange={({ pageIndex: pi, pageSize: ps }) => {
            if (typeof pi === 'number') setPageIndex(pi);
            if (typeof ps === 'number') setPageSize(ps);
          }}
        />
      </Card>
    </Flex>
  );
}