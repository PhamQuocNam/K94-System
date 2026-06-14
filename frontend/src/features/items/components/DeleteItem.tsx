import { Trash2 } from "lucide-react"
import { useState } from "react"

import { ItemsService } from "@/client"
import { ConfirmDialog } from "@/components/shared"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useDeleteMutation } from "@/hooks/useMutations"
import { queryKeys } from "@/lib/queryKeys"

interface DeleteItemProps {
  id: string
  onSuccess: () => void
}

const DeleteItem = ({ id, onSuccess }: DeleteItemProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const mutation = useDeleteMutation(
    (id: string) => ItemsService.deleteItem({ id }),
    {
      queryKey: queryKeys.items.all,
      successMessage: "The item was deleted successfully",
      onSuccess: () => {
        setIsOpen(false)
        onSuccess()
      },
    },
  )

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => e.preventDefault()}
          onClick={() => setIsOpen(true)}
        >
          <Trash2 />
          Delete Item
        </DropdownMenuItem>
      }
      title="Delete Item"
      description="This item will be permanently deleted. Are you sure? You will not be able to undo this action."
      onConfirm={() => mutation.mutate(id)}
      confirmLabel="Delete"
      isLoading={mutation.isPending}
    />
  )
}

export default DeleteItem
