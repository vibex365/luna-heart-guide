import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Common country codes
export const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "+353", country: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+852", country: "HK", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+972", country: "IL", flag: "🇮🇱", name: "Israel" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+420", country: "CZ", flag: "🇨🇿", name: "Czech Republic" },
];

export type CountryCode = typeof countryCodes[number];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string, rawNumber: string, countryCode: CountryCode) => void;
  defaultCountryCode?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export const PhoneInput = ({
  value,
  onChange,
  defaultCountryCode = "+1",
  placeholder,
  className = "",
  inputClassName = "",
  disabled = false,
}: PhoneInputProps) => {
  const [countryCode, setCountryCode] = useState<CountryCode>(
    countryCodes.find(c => c.code === defaultCountryCode) || countryCodes[0]
  );
  
  // Extract raw number from value (remove country code if present)
  const getRawNumber = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, "");
    // If value starts with country code digits, strip them
    const codeDigits = countryCode.code.replace("+", "");
    if (cleaned.startsWith(codeDigits)) {
      return cleaned.slice(codeDigits.length);
    }
    return cleaned;
  }, [countryCode.code]);

  const [rawNumber, setRawNumber] = useState(getRawNumber(value));

  // Format phone number for display
  const formatPhoneDisplay = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, "");
    
    // US/Canada format
    if (countryCode.code === "+1") {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    // UK format
    if (countryCode.code === "+44") {
      if (cleaned.length <= 4) return cleaned;
      if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
    }
    
    // Generic international format
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  }, [countryCode.code]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLength = countryCode.code === "+1" ? 10 : 12;
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    setRawNumber(cleaned);
    onChange(`${countryCode.code}${cleaned}`, cleaned, countryCode);
  };

  const handleCountryChange = (cc: CountryCode) => {
    setCountryCode(cc);
    onChange(`${cc.code}${rawNumber}`, rawNumber, cc);
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return countryCode.code === "+1" ? "(555) 123-4567" : "1234 567 890";
  };

  const isValid = () => {
    const minLength = countryCode.code === "+1" ? 10 : 7;
    return rawNumber.length >= minLength;
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-3 flex items-center gap-1 min-w-[100px]"
            disabled={disabled}
          >
            <span className="text-base">{countryCode.flag}</span>
            <span className="text-sm">{countryCode.code}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[300px] overflow-y-auto bg-background z-50">
          {countryCodes.map((cc) => (
            <DropdownMenuItem
              key={`${cc.country}-${cc.code}`}
              onClick={() => handleCountryChange(cc)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base">{cc.flag}</span>
              <span className="flex-1 text-sm">{cc.name}</span>
              <span className="text-muted-foreground text-sm">{cc.code}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 relative">
        <Input
          type="tel"
          placeholder={getPlaceholder()}
          value={formatPhoneDisplay(rawNumber)}
          onChange={handleChange}
          className={`h-10 ${inputClassName}`}
          disabled={disabled}
        />
        {rawNumber.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid() ? (
              <span className="text-green-500 text-xs">✓</span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {rawNumber.length}/{countryCode.code === "+1" ? 10 : 7}+
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;
