"use client";

import { getUserName, type FilteredUser } from "./_types";

interface PreviewTableProps {
  users: FilteredUser[];
  totalMatch: number;
}

export function PreviewTable({ users, totalMatch }: PreviewTableProps) {
  if (users.length === 0) return null;
  return (
    <div className="rounded-lg border bg-muted/20 max-h-[200px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Нэр</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Утас</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user, i) => (
            <tr key={user.id}>
              <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-1.5 font-medium truncate max-w-[180px]">
                {getUserName(user)}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">{user.primary_phone || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalMatch > 50 && (
        <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
          ... болон бусад {(totalMatch - 50).toLocaleString()} хэрэглэгч
        </div>
      )}
    </div>
  );
}
