class CommonMethod {
  EmailValidation(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  PasswordValidation(password: string): boolean {
    // Regex: Minimum 8 chars, 1 number, 1 special character (case-insensitive)
    const passwordRegex =
      /^(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
  }

  ErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else {
      return 'An unknown error occurred.';
    }
  }
  toDatetimeLocal(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatISOToLocalString(iso?: string) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  }
  base64ToFile(base64String: string, fileName: string) {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
  }

  MaxLengthValidation(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  }

  SanitizePhoneInput(value: string): string {
    return value.replace(/[^0-9+\-]/g, '');
  }

  HandlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
      return;
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return;
    }
    // Prevent if not number, +, or -
    if (!/[0-9+\-]/.test(e.key)) {
      e.preventDefault();
    }
  }

  HandlePhonePaste(
    e: React.ClipboardEvent<HTMLInputElement>,
    currentValue: string = '',
  ): string {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const sanitized = pastedText.replace(/[^0-9+\-]/g, '');
    return currentValue + sanitized;
  }

  ValidateOrganizerName(name: string, maxLength = 100): string | null {
    if (!name) return 'Please enter Organizer Name';
    if (name.length > maxLength)
      return `Organizer Name cannot exceed ${maxLength} characters`;
    return null;
  }

  ValidateEmail(email: string): string | null {
    if (!email) return 'Please enter Email';
    if (!this.EmailValidation(email)) return 'Please enter a valid Email';
    return null;
  }

  ValidateName(
    name: string,
    fieldName = 'Name',
    maxLength = 20,
  ): string | null {
    if (!name) return `Please enter ${fieldName}`;
    const regex = /^[A-Za-z]+$/;
    if (!regex.test(name)) return `Invalid ${fieldName}`;
    if (name.length > maxLength)
      return `${fieldName} cannot exceed ${maxLength} characters`;
    return null;
  }

  ValidatePhone(phone: string): string | null {
    if (!phone) return 'Please enter Phone Number';
    const regex = /^\+?[0-9]{7,15}$/;
    if (!regex.test(phone)) return 'Invalid Phone Number';
    return null;
  }

  ValidateStreet(
    street: string,
    fieldName = 'Street',
    maxLength = 50,
  ): string | null {
    if (!street) return `Please enter ${fieldName}`;
    if (street.length > maxLength)
      return `${fieldName} cannot exceed ${maxLength} characters`;
    return null;
  }

  ValidateZipCode(zip: string, maxLength = 10): string | null {
    if (!zip) return 'Please enter Zip Code';
    if (!/^[a-zA-Z0-9\s\-]+$/.test(zip)) return 'Invalid Zip Code';
    if (zip.length > maxLength)
      return `Zip Code cannot exceed ${maxLength} characters`;
    return null;
  }

  ValidateCity(
    city: string,
    fieldName = 'City',
    maxLength = 20,
  ): string | null {
    if (!city) return `Please enter ${fieldName}`;
    const regex = /^[A-Za-z\s\.\-]+$/;
    if (!regex.test(city)) return `Invalid ${fieldName}`;
    if (city.length > maxLength)
      return `${fieldName} cannot exceed ${maxLength} characters`;
    return null;
  }
}
export default new CommonMethod();
