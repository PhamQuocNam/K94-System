import { Trash2 } from "lucide-react"
import { useState } from "react"

import { UsersService } from "@/client"
import { ConfirmDialog } from "@/components/shared"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useDeleteMutation } from "@/hooks/useMutations"
import { queryKeys } from "@/lib/queryKeys"

interface DeleteUserProps {
  id: string
  onSuccess: () => void
}

const DeleteUser = ({ id, onSuccess }: DeleteUserProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const mutation = useDeleteMutation(
    (id: string) => UsersService.deleteUser({ userId: id }),
    {
      queryKey: queryKeys.users.all,
      successMessage: "The user was deleted successfully",
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
          Delete User
        </DropdownMenuItem>
      }
      title="Delete User"
      description="All items associated with this user will also be permanently deleted. Are you sure? You will not be able to undo this action."
      onConfirm={() => mutation.mutate(id)}
      confirmLabel="Delete"
      isLoading={mutation.isPending}
    />
  )
}

export default DeleteUser
