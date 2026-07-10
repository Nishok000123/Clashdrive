import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface PhoneStepProps {
  loading: boolean;
  error: string | null;
  onSubmit: (phone: string) => void;
}

export function PhoneStep({ loading, error, onSubmit }: PhoneStepProps) {
  const [phone, setPhone] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/[\s()-]/g, "");

    if (!cleaned.startsWith("+")) {
      setValidationError("Phone must start with country code (e.g. +91)");
      return;
    }
    if (cleaned.length < 10 || cleaned.length > 16) {
      setValidationError("Enter a valid international phone number");
      return;
    }

    setValidationError("");
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 text-brand-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 15h9" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-surface-900 tracking-tight">Connect Account</h2>
        <p className="text-surface-600 text-sm">
          Enter your phone number in international format
        </p>
      </div>

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+91 XXXXX XXXXX"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={validationError || error || undefined}
        autoFocus
        icon={
          <svg
            className="w-4 h-4 text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        }
      />

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Send Code
      </Button>

      <p className="text-[11px] text-surface-600 text-center leading-relaxed">
        We will send a secure verification code to your Telegram app.
        <br />
        Session credentials are saved locally in this browser.
      </p>
    </form>
  );
}
