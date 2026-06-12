"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { Warehouse } from "@/components/warehouse/types";
import type { WarehouseType } from "@/types/database";

export function useWarehouseEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<WarehouseType>("main");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [managerName, setManagerName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [nameColor, setNameColor] = useState("");

  const { data: warehouse = null, isLoading } = useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => adminApi.getById<Warehouse>("warehouses", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (warehouse) {
      // Intentional one-time form prefill from Supabase fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(warehouse.name);
      setCode(warehouse.code || "");
      setType(warehouse.type);
      setAddress(warehouse.address || "");
      setCity(warehouse.city || "");
      setDistrict(warehouse.district || "");
      setPhone(warehouse.phone || "");
      setEmail(warehouse.email || "");
      setManagerName(warehouse.manager_name || "");
      setIsActive(warehouse.is_active);
      setIsDefault(warehouse.is_default);
      setNameColor(warehouse.name_color || "");
    }
  }, [warehouse]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew
        ? adminApi.insert<Warehouse>("warehouses", data)
        : adminApi.update<Warehouse>("warehouses", id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      if (isNew && result && typeof result === "object" && "id" in result) {
        router.push(`/warehouses/${(result as { id: string }).id}`);
      }
    },
  });

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Агуулахын нэрийг заавал оруулна уу.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const warehouseData = {
        name: name.trim(),
        code: code.trim() || null,
        type,
        address: address.trim() || null,
        city: city.trim() || null,
        district: district.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        manager_name: managerName.trim() || null,
        is_active: isActive,
        is_default: isDefault,
        name_color: nameColor.trim() || null,
      };

      await saveMutation.mutateAsync(warehouseData);
    } catch (error) {
      setError(
        translateServerError(
          error instanceof Error ? error.message : "",
          "Агуулах хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isNew,
    warehouse,
    isLoading,
    isSaving,
    error,
    name,
    setName,
    code,
    setCode,
    type,
    setType,
    address,
    setAddress,
    city,
    setCity,
    district,
    setDistrict,
    phone,
    setPhone,
    email,
    setEmail,
    managerName,
    setManagerName,
    isActive,
    setIsActive,
    isDefault,
    setIsDefault,
    nameColor,
    setNameColor,
    handleSave,
  };
}
