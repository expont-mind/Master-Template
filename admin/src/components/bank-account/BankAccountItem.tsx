"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star, Banknote } from "lucide-react";
import { BANKS, type BankAccount } from "./types";

interface BankAccountItemProps {
  account: BankAccount;
  onDelete: () => void;
}

export function BankAccountItem({ account, onDelete }: BankAccountItemProps) {
  const bank = BANKS.find((b) => b.value === account.bank_name);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {bank?.logo ? (
          <img
            src={bank.logo}
            alt={account.bank_name}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/bank-accounts/${account.id}`}
              className="font-medium hover:underline truncate"
            >
              {account.bank_name}
            </Link>
            {account.is_default && (
              <Badge variant="default" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Үндсэн
              </Badge>
            )}
            <Badge variant={account.is_active ? "secondary" : "outline"}>
              {account.is_active ? "Идэвхтэй" : "Идэвхгүй"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{account.account_name}</span>
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {account.account_number}
            </code>
            <span>{account.currency}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/bank-accounts/${account.id}`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={account.is_default}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
