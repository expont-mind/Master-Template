"use client";

import { Banknote } from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BANKS, CURRENCIES } from "./types";

interface BankAccountBasicCardProps {
  bankName: string;
  onBankNameChange: (value: string) => void;
  accountName: string;
  onAccountNameChange: (value: string) => void;
  accountNumber: string;
  onAccountNumberChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
}

export function BankAccountBasicCard({
  bankName,
  onBankNameChange,
  accountName,
  onAccountNameChange,
  accountNumber,
  onAccountNumberChange,
  currency,
  onCurrencyChange,
}: BankAccountBasicCardProps) {
  const selectedBank = BANKS.find((b) => b.value === bankName);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дансны мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Банк *</Label>
            <Select value={bankName} onValueChange={onBankNameChange}>
              <SelectTrigger>
                <SelectValue placeholder="Банк сонгох">
                  {selectedBank && (
                    <div className="flex items-center gap-2">
                      {selectedBank.logo ? (
                        <Image
                          src={selectedBank.logo}
                          alt={selectedBank.label}
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{selectedBank.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value}>
                    <div className="flex items-center gap-2">
                      {bank.logo ? (
                        <Image
                          src={bank.logo}
                          alt={bank.label}
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                      ) : (
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{bank.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Валют</Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Валют сонгох" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountName">Дансны нэр *</Label>
          <Input
            id="accountName"
            value={accountName}
            onChange={(e) => onAccountNameChange(e.target.value)}
            placeholder="Монпанг ХХК"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Дансны дугаар *</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="5000123456"
            className="font-mono"
          />
        </div>
      </CardContent>
    </Card>
  );
}
