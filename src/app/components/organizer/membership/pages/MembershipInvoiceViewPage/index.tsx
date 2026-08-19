import InvoiceDocumentPage from '../../common/InvoiceDocumentPage';
import { useMembershipInvoiceView } from './useMembershipInvoiceView';

export default function MembershipInvoiceViewPage() {
  const { data, isLoading, error } = useMembershipInvoiceView();

  return (
    <InvoiceDocumentPage
      data={data}
      isLoading={isLoading}
      error={error}
      loadingSubtitle="Fetching invoice details..."
    />
  );
}
