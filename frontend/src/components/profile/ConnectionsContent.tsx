"use client";

import { useState, useEffect } from "react";
import { AppleIcon, GoogleIcon, FacebookIcon, X, Slash } from "../svg";
import Link from "next/link";
import { DisconnectModal, ConnectionItem } from "./DisconnectModal";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-helpers";
import { unlinkIdentity } from "./actions";
import { useUIStore } from "@/stores/ui-store";
import { log } from "@/lib/utils/logger";
import type { UserIdentity, Provider } from "@supabase/supabase-js";

const connectionConfig = [
  // {
  //   id: "apple",
  //   provider: "apple",
  //   name: "Apple холболт",
  //   displayName: "Apple",
  //   icon: <AppleIcon />,
  //   hasBorder: true,
  // },
  {
    id: "google",
    provider: "google",
    name: "Google холболт",
    displayName: "Google",
    icon: <GoogleIcon />,
    hasBorder: true,
  },
  {
    id: "facebook",
    provider: "facebook",
    name: "Facebook холболт",
    displayName: "Facebook",
    icon: <FacebookIcon />,
    hasBorder: false,
  },
];

export const ConnectionsContent = () => {
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState<{
    isOpen: boolean;
    connection: ConnectionItem | null;
    identity: UserIdentity | null;
  }>({ isOpen: false, connection: null, identity: null });

  const supabase = createClient();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const fetchIdentities = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.identities) {
        setIdentities(user.identities);
      }
    };
    fetchIdentities();
  }, [supabase.auth]);

  const connections: ConnectionItem[] = connectionConfig.map((config) => ({
    ...config,
    connected: identities.some((i) => i.provider === config.provider),
  }));

  const handleDisconnectClick = (conn: ConnectionItem) => {
    const identity = identities.find((i) => i.provider === conn.id);
    setDisconnectModal({
      isOpen: true,
      connection: conn,
      identity: identity || null,
    });
  };

  const handleConnectClick = async (provider: Provider) => {
    const redirectTo = getAuthCallbackUrl("/profile?tab=connections");
    await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
  };

  const handleCloseModal = () => {
    setDisconnectModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleModalClosed = () => {
    setDisconnectModal({ isOpen: false, connection: null, identity: null });
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectModal.identity) return;

    setIsLoading(true);
    try {
      const result = await unlinkIdentity({
        provider: disconnectModal.identity.provider,
      });

      if (!result.success) {
        addToast({
          type: "error",
          title: "Холболт салгахад алдаа гарлаа",
          message: result.error,
        });
      } else {
        setIdentities((prev) =>
          prev.filter((i) => i.id !== disconnectModal.identity?.id),
        );
      }
    } catch (err) {
      log.error("disconnect_identity_failed", err);
      addToast({
        type: "error",
        title: "Холболт салгахад алдаа гарлаа",
        message: "Дахин оролдоно уу",
      });
    } finally {
      setIsLoading(false);
      handleCloseModal();
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />
          </div>
          <Link
            href="/profile?tab=settings"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Тохиргоо
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">
            Холболт
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Холболт
        </p>
      </div>

      {/* Connection List */}
      <div className="flex flex-col">
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center gap-4 px-0.5">
            <div className="shrink-0">{conn.icon}</div>
            <div
              className={`flex-1 flex flex-col gap-1 items-start py-4 ${
                conn.hasBorder ? "border-b border-[#E2E8F0]" : ""
              }`}
            >
              <p
                className={`font-manrope text-sm leading-5 ${
                  conn.connected
                    ? "text-[#64748B] font-medium"
                    : "text-[#020617] font-semibold"
                }`}
              >
                {conn.name}
              </p>
              {conn.connected ? (
                <div className="flex items-center gap-1 bg-[#F0FDFA] rounded-[4px] px-2 py-0.5">
                  <p className="text-[#14B8A6] font-medium text-sm font-manrope leading-5">
                    Холболт хийгдсэн
                  </p>
                  <div
                    className="cursor-pointer"
                    onClick={() => handleDisconnectClick(conn)}
                  >
                    <X />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleConnectClick(conn.id as Provider)}
                  className="border border-[#FDA4AF] text-[#F43F5E] font-medium text-sm font-manrope leading-5 px-2 py-0.5 rounded-[4px] cursor-pointer hover:bg-[#FFF1F2] transition-colors"
                >
                  Холбох
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Disconnect Confirmation Modal */}
      <DisconnectModal
        isOpen={disconnectModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDisconnect}
        onAnimationEnd={handleModalClosed}
        connection={disconnectModal.connection}
        isLoading={isLoading}
      />
    </div>
  );
};
