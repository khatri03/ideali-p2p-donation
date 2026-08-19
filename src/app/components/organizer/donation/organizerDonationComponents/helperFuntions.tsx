export const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};


export const formatAmount = (amount: number) => {
    return Number(amount).toLocaleString('en-PK', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

export const getFullName = (contact: any) => {
    const parts = [
      contact.firstName,
      contact.middleName,
      contact.lastName
    ].filter(Boolean);
    return parts.join(' ') || 'N/A';
  };

export const getFileExtension = (format: string): string => {
      const formatMap: { [key: string]: string } = {
        'excel': 'xlsx',
        'csv': 'csv',
        'pdf': 'pdf'
      };
      return formatMap[format.toLowerCase()] || format.toLowerCase();
    };