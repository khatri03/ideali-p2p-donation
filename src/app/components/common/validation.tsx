// Helper function to validate number input (only positive numbers, max 8 digits)
export const handleNumberInput = (value: string, maxLength: number = 8): boolean => {
  // Allow empty string
  if (value === '') return true;
  
  // Remove any non-digit characters except decimal point for length check
  const digitsOnly = value.replace(/[^\d]/g, '');
  
  // Check if value contains only digits and optionally decimal point with up to 2 decimal places
  // Also check total digit count doesn't exceed maxLength
  return /^\d+(\.\d{0,2})?$/.test(value) && digitsOnly.length <= maxLength;
};
// Helper function to prevent non-numeric key presses
export const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent minus sign, plus sign, and 'e' (exponential notation)
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
    }
};