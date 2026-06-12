"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

import type { UserSearchResult } from "./types";

interface UserSearchComboboxProps {
  selectedUser: UserSearchResult | null;
  onSelect: (user: UserSearchResult | null) => void;
}

function getInitials(user: UserSearchResult): string {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
}

function getUserLabel(user: UserSearchResult): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email;
}

export function UserSearchCombobox({ selectedUser, onSelect }: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["userSearch", debouncedSearch],
    queryFn: () =>
      adminApi.getAll<UserSearchResult>("users", {
        select: "id, first_name, last_name, email, primary_phone, point_activated_at",
        filters: {
          search: debouncedSearch.trim(),
        },
        limit: 10,
      }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10"
          >
            {selectedUser ? (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{getUserLabel(selectedUser)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Хэрэглэгч хайж сонгох...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[325px] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Нэр, утасны дугаар, имэйл хайх..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              {debouncedSearch.length < 2 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  2-оос дээш тэмдэгт оруулна уу
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Хайж байна...
                </div>
              ) : (
                <>
                  <CommandEmpty>Хэрэглэгч олдсонгүй</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => {
                          onSelect(user);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                        className="cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-1 h-4 w-4 shrink-0",
                            selectedUser?.id === user.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <Avatar className="size-8 mr-2.5">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{getUserLabel(user)}</span>
                            {user.point_activated_at ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 shrink-0">
                                Point
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shrink-0">
                                Идэвхгүй
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                            {user.primary_phone && ` · ${user.primary_phone}`}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedUser && (
        <Button variant="ghost" size="icon" onClick={() => onSelect(null)} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
