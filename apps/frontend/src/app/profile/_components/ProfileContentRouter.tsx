"use client";

import { type ProfileView } from "@/app/profile/_lib/viewFromParams";
import { AddressContent } from "@/components/profile/AddressContent";
import { AddressEditContent } from "@/components/profile/AddressEditContent";
import { BranchesContent } from "@/components/profile/BranchesContent";
import { ConnectionsContent } from "@/components/profile/ConnectionsContent";
import { CouponContent } from "@/components/profile/CouponContent";
import { FAQContent } from "@/components/profile/FAQContent";
import { HelpContent } from "@/components/profile/HelpContent";
import { OrdersContent } from "@/components/profile/OrdersContent";
import { PersonalContent } from "@/components/profile/PersonalContent";
import { PhoneContent } from "@/components/profile/PhoneContent";
import { PointContent } from "@/components/profile/PointContent";
import { type SideMenu } from "@/components/profile/ProfileSidebar";
import { SettingsContent } from "@/components/profile/SettingsContent";

import type { ProfileOrder } from "@/app/profile/page";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface ProfileContentRouterProps {
  view: ProfileView;
  userData: UserRow | null;
  orders: ProfileOrder[];
  addresses: AddressRow[];
  orderIdParam: string | null;
  onEditAddress: (id: string) => void;
  onAddNewAddress: () => void;
  onBackFromEdit: () => void;
  refreshAddresses: () => Promise<void>;
  refreshUser: () => Promise<void>;
  onBalanceChange: (n: number) => void;
  onCouponCountChange: (n: number) => void;
  onSettingsNavigate: (menu: SideMenu) => void;
}

function renderUserBoundView(
  view: ProfileView,
  userData: UserRow | null,
  refreshUser: () => Promise<void>,
): React.ReactNode {
  switch (view.type) {
    case "connections":
      return <ConnectionsContent />;
    case "phone":
      return <PhoneContent user={userData} onRefresh={refreshUser} />;
    case "personal":
      return <PersonalContent user={userData} onRefresh={refreshUser} />;
    case "help":
      return <HelpContent />;
    case "branches":
      return <BranchesContent />;
    case "faq":
      return <FAQContent />;
    default:
      return null;
  }
}

export const ProfileContentRouter = (props: ProfileContentRouterProps) => {
  const {
    view,
    userData,
    orders,
    addresses,
    orderIdParam,
    onEditAddress,
    onAddNewAddress,
    onBackFromEdit,
    refreshAddresses,
    refreshUser,
    onBalanceChange,
    onCouponCountChange,
    onSettingsNavigate,
  } = props;

  if (view.type === "orders") {
    return (
      <OrdersContent
        orders={orders}
        addresses={addresses}
        user={userData}
        initialOrderId={orderIdParam}
      />
    );
  }
  if (view.type === "address") {
    return (
      <AddressContent
        addresses={addresses}
        onEditAddress={onEditAddress}
        onAddNew={onAddNewAddress}
        onRefresh={refreshAddresses}
      />
    );
  }
  if (view.type === "address-edit") {
    return (
      <AddressEditContent
        addressId={view.addressId}
        existingAddress={addresses.find((a) => a.id === view.addressId)}
        onBack={onBackFromEdit}
        onSave={refreshAddresses}
      />
    );
  }
  if (view.type === "point") {
    return <PointContent onBalanceChange={onBalanceChange} />;
  }
  if (view.type === "coupon") {
    return <CouponContent onCouponCountChange={onCouponCountChange} />;
  }
  if (view.type === "settings") {
    return (
      <SettingsContent
        user={userData}
        defaultAddress={addresses.find((a) => a.is_default) ?? addresses[0] ?? null}
        onNavigate={onSettingsNavigate}
      />
    );
  }
  return renderUserBoundView(view, userData, refreshUser);
};
