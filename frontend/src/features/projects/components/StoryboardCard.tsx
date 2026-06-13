import { BookOpen, Pencil } from "lucide-react"

import type { StoryBoard } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StoryboardCardProps {
  storyboard: StoryBoard | null
  onEditOpen: () => void
}

export function StoryboardCard({
  storyboard,
  onEditOpen,
}: StoryboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Storyboard
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onEditOpen}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {storyboard?.style && (
          <CardDescription>
            <Badge variant="secondary">{storyboard.style}</Badge>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-[20]">
          {storyboard?.content}
        </p>
      </CardContent>
    </Card>
  )
}
