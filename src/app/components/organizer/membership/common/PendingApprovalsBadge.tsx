import React, { useEffect, useState } from 'react';
import { Badge } from '@chakra-ui/react';
import HttpClient from 'app/service/httpClient/HttpClient';

export default function PendingApprovalsBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    HttpClient.get<{ data: number; success: boolean }>(
      '/api/organizer/membership/type/pending-approvals/count',
    )
      .then((r) => { if (r.data?.success) setCount(r.data.data); })
      .catch(() => {});
  }, []);

  if (!count) return null;

  return (
    <Badge
      bg="yellow.100"
      color="yellow.800"
      borderRadius="full"
      fontSize="10px"
      fontWeight="bold"
      px={1.5}
      py={0.5}
      ml={1.5}
      lineHeight="1.4"
      flexShrink={0}
    >
      {count}
    </Badge>
  );
}
