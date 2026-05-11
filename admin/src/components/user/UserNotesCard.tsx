"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { useAdmin } from "@/hooks/useAdmin";

interface UserNote {
  id: string;
  user_id: string;
  admin_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface UserNotesCardProps {
  userId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function UserNotesCard({ userId }: UserNotesCardProps) {
  const queryClient = useQueryClient();
  const admin = useAdmin();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: queryKeys.userNotes.byUser(userId),
    queryFn: () =>
      adminApi.getAll<UserNote>("user_notes", {
        filters: { "user_id.eq": userId },
        order: "created_at.desc",
      }),
  });

  const invalidateNotes = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.userNotes.byUser(userId) });

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      adminApi.insert("user_notes", {
        user_id: userId,
        admin_id: admin.id,
        content,
      }),
    onSuccess: () => {
      invalidateNotes();
      setNewContent("");
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      adminApi.update("user_notes", id, {
        content,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      invalidateNotes();
      setEditingId(null);
      setEditContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("user_notes", id),
    onSuccess: invalidateNotes,
  });

  const handleCreate = () => {
    if (!newContent.trim()) return;
    createMutation.mutate(newContent.trim());
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ id, content: editContent.trim() });
  };

  const startEdit = (note: UserNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <StickyNote className="h-5 w-5" />
          Тэмдэглэл
        </CardTitle>
        {!showAddForm && (
          <Button size="sm" className="gap-1" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Тэмдэглэл нэмэх
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {showAddForm && (
          <div className="space-y-2 rounded-lg border p-3">
            <Textarea
              placeholder="Тэмдэглэл бичих..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewContent("");
                }}
              >
                Болих
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newContent.trim()}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                )}
                Хадгалах
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Тэмдэглэл байхгүй
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3 space-y-2">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdate(note.id)}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.created_at)}
                        {note.updated_at !== note.created_at && " (засварлагдсан)"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEdit(note)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(note.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
