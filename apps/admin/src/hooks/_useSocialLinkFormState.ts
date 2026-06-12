"use client";

import { useState } from "react";

import type { SocialLink } from "@/components/social-link/types";

export interface SocialLinkEditState {
  editingId: string | null;
  editPlatform: string;
  editUrl: string;
  editIsActive: boolean;
  setEditPlatform: (v: string) => void;
  setEditUrl: (v: string) => void;
  setEditIsActive: (v: boolean) => void;
  startEdit: (link: SocialLink) => void;
  cancelEdit: () => void;
  setEditingId: (id: string | null) => void;
}

export function useSocialLinkEditState(): SocialLinkEditState {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlatform, setEditPlatform] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setEditPlatform(link.platform.toLowerCase());
    setEditUrl(link.url);
    setEditIsActive(link.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPlatform("");
    setEditUrl("");
    setEditIsActive(true);
  };

  return {
    editingId,
    editPlatform,
    editUrl,
    editIsActive,
    setEditPlatform,
    setEditUrl,
    setEditIsActive,
    startEdit,
    cancelEdit,
    setEditingId,
  };
}

export interface SocialLinkAddState {
  isAdding: boolean;
  newPlatform: string;
  newUrl: string;
  newIsActive: boolean;
  setNewPlatform: (v: string) => void;
  setNewUrl: (v: string) => void;
  setNewIsActive: (v: boolean) => void;
  startAdding: () => void;
  cancelAdding: () => void;
}

export function useSocialLinkAddState(): SocialLinkAddState {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  const startAdding = () => {
    setIsAdding(true);
    setNewPlatform("");
    setNewUrl("");
    setNewIsActive(true);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewPlatform("");
    setNewUrl("");
    setNewIsActive(true);
  };

  return {
    isAdding,
    newPlatform,
    newUrl,
    newIsActive,
    setNewPlatform,
    setNewUrl,
    setNewIsActive,
    startAdding,
    cancelAdding,
  };
}
