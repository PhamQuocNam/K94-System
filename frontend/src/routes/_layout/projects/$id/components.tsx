import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-muted-foreground">
          {icon}
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm mt-2">{description}</p>
        </div>
      </div>
    </Card>
  )
}

interface TabContentProps {
  isLoading: boolean
  empty: boolean
  emptyMessage: string
  children: React.ReactNode
  skeleton: React.ReactNode
}

export function TabContent({
  isLoading,
  empty,
  emptyMessage,
  children,
  skeleton,
}: TabContentProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }

  if (empty) {
    return <Card className="p-8 text-center text-muted-foreground">{emptyMessage}</Card>
  }

  return <>{children}</>
}

interface EntityListProps {
  items: Array<{ id: string }>
  renderCard: (item: any) => React.ReactNode
  skeleton: React.ReactNode
  isLoading: boolean
  empty: boolean
  emptyMessage: string
  gridClassName: string
}

export function EntityList({
  items,
  renderCard,
  skeleton,
  isLoading,
  empty,
  emptyMessage,
  gridClassName,
}: EntityListProps) {
  return (
    <TabContent
      isLoading={isLoading}
      empty={empty}
      emptyMessage={emptyMessage}
      skeleton={<div className={gridClassName}>{skeleton}</div>}
    >
      <div className={gridClassName}>{items.map(renderCard)}</div>
    </TabContent>
  )
}

export const SKELETON_COUNTS = {
  cards: 3,
  scenes: 4,
} as const
