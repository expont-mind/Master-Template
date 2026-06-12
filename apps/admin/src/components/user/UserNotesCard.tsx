"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { NoteAddForm } from "./_NoteAddForm";
import { NoteItem, type UserNote } from "./_NoteItem";

interface UserNotesCardProps {
  userId: string;
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
    queryClient.invalidateQueries({
      queryKey: queryKeys.userNotes.byUser(userId),
    });

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
        {showAddForm && (
          <NoteAddForm
            value={newContent}
            onChange={setNewContent}
            onCancel={() => {
              setShowAddForm(false);
              setNewContent("");
            }}
            onSubmit={handleCreate}
            isPending={createMutation.isPending}
          />
        )}

        {isLoading ? (
          <div className="space-y-3">
            {["n1", "n2"].map((id) => (
              <div key={id} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Тэмдэглэл байхгүй</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                editContent={editContent}
                setEditContent={setEditContent}
                onStartEdit={() => startEdit(note)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={() => handleUpdate(note.id)}
                onDelete={() => deleteMutation.mutate(note.id)}
                isUpdating={updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
