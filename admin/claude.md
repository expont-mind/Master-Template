# Admin Panel - Project Conventions

## Tech Stack

- **Framework**: Next.js 16 (App Router, `src/app/`)
- **React**: 19
- **Data Fetching**: TanStack Query v5 (React Query)
- **Tables**: TanStack Table v8
- **UI Components**: Radix UI primitives + shadcn/ui pattern
- **Styling**: Tailwind CSS v4, `class-variance-authority`, `tailwind-merge`
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL) via API proxy
- **Icons**: Lucide React
- **Charts**: Recharts
- **DnD**: @dnd-kit
- **Toasts**: Sonner
- **Language**: TypeScript (strict mode)
- **UI Language**: Mongolian (all user-facing text)

## Architecture

### API Proxy Pattern
All data operations go through `/api/admin/[...path]` which uses `service_role` to bypass RLS. The client never talks to Supabase directly.

- `adminApi` (`lib/admin-api.ts`) - Generic CRUD client
- `adminApi.getAllPaginated()` - Paginated fetch with `X-Total-Count` header
- `adminApi.rpc()` - Call database functions via `/api/admin/rpc`

### Query Key Factory
All query keys are defined in `lib/query-keys.ts`:
```ts
queryKeys.products.all        // ["products"]
queryKeys.products.lists({})  // ["products", "list", {}]
queryKeys.products.detail(id) // ["products", "detail", id]
```

### Hook Pattern
Each domain has `useXxxList.ts` and `useXxxEdit.ts` hooks in `hooks/`:
- List hooks manage: search, filters, pagination, delete mutations
- Edit hooks manage: form state, save/update mutations
- All list hooks use `PAGE_SIZE = 20`, offset-based pagination
- Search uses `useDebounce` (300ms) for server-side filtering
- Mutations invalidate via `queryKeys.xxx.all`

### DataTable Pattern
List pages use TanStack Table via reusable components in `components/ui/data-table/`:

```tsx
// 1. Define columns in components/[domain]/columns.tsx
export function getColumns(options: { onDelete?: (item: T) => void }): ColumnDef<T>[]

// 2. Use in components/[domain]/[Domain]List.tsx
<DataTable columns={columns} data={filteredItems} onRowClick={...} />
<DataTablePagination pageIndex={page-1} pageCount={totalPages} onPageChange={...} />
```

Shared cell renderers: `ImageCell`, `BadgeCell`, `DateCell`, `PriceCell`, `ActionsCell`

## File Structure

```
src/
├── app/
│   ├── (admin)/          # Protected admin routes (26 domains)
│   ├── (auth)/           # Login/auth routes
│   └── api/admin/        # API proxy routes
├── components/
│   ├── [domain]/         # Domain components (List, Form, columns, types)
│   ├── layout/           # Sidebar, Navbar
│   └── ui/               # Reusable UI (shadcn pattern)
│       └── data-table/   # DataTable, Pagination, Toolbar, cells
├── hooks/                # TanStack Query hooks (useXxxList, useXxxEdit)
├── lib/
│   ├── admin-api.ts      # API client
│   ├── query-keys.ts     # Query key factory
│   ├── query-client.ts   # QueryClient config
│   └── supabase/         # Supabase clients (browser, server, middleware)
├── constants/            # Status labels, colors, categories (Mongolian)
└── types/                # Database types, admin types
```

## Conventions

- **Component files**: PascalCase (`ProductList.tsx`)
- **Hook files**: camelCase with `use` prefix (`useProductList.ts`)
- **Type files**: `types.ts` in each domain directory
- **Constants**: Mongolian labels in `constants/index.ts`
- **Status colors**: `bg-{color}-100 text-{color}-800` pattern for badges
- **Empty states**: Icon + title + description, consistent across all list pages
- **Delete flows**: `ConfirmDialog` with Mongolian text
- **Pagination**: 1-based in hooks, 0-based in DataTablePagination (convert at boundary)
