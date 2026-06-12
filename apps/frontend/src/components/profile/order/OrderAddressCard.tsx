"use client";

import { LocationBig, Phone } from "@/components/svg";
import { stripPhonePrefix } from "@/lib/utils/formatters";

import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface OrderAddressCardProps {
  address: AddressRow;
}

export const OrderAddressCard = ({ address }: OrderAddressCardProps) => {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-primary font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
        Хүргэх хаяг
      </p>
      <div className="border border-border rounded-sm p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-6">
        <div className="shrink-0 hidden sm:block">
          <LocationBig />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <p className="text-text-primary font-bold text-sm sm:text-base font-manrope leading-5 sm:leading-6">
              {address.name}
            </p>
            {address.is_default && (
              <span className="bg-border-light text-text-primary font-bold text-xs font-manrope px-2 py-0.5 rounded">
                Үндсэн
              </span>
            )}
          </div>
          <p className="text-text-secondary font-medium text-sm sm:text-base font-manrope leading-5 sm:leading-6">
            {[address.city, address.district, address.sub_district].filter(Boolean).join(", ")}
          </p>
          {address.detail && (
            <p className="text-text-primary font-medium text-base sm:text-lg font-manrope leading-6 sm:leading-7">
              {address.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface OrderContactCardProps {
  user: UserRow;
}

export const OrderContactCard = ({ user }: OrderContactCardProps) => {
  const userName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  const phoneLine = [user.primary_phone, user.secondary_phone]
    .filter(Boolean)
    .map((p) => stripPhonePrefix(p!))
    .join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-primary font-medium text-lg sm:text-xl font-manrope leading-6 sm:leading-7">
        Холбоо барих
      </p>
      <div className="border border-border rounded-sm p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-6">
        <div className="shrink-0 hidden sm:block">
          <Phone />
        </div>
        <div className="flex flex-col">
          <p className="text-text-secondary font-medium text-sm sm:text-base font-manrope leading-5 sm:leading-6">
            {userName || "—"}
          </p>
          <p className="text-text-primary font-medium text-base sm:text-lg font-manrope leading-6 sm:leading-7">
            {phoneLine}
          </p>
        </div>
      </div>
    </div>
  );
};
