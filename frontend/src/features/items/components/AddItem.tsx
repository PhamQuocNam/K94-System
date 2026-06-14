import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type ItemCreate, ItemsService } from "@/client"
import { Button } from "@/components/ui/button"
import { FormDialog } from "@/components/shared"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCreateMutation } from "@/hooks/useMutations"
import { queryKeys } from "@/lib/queryKeys"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const AddItem = () => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const mutation = useCreateMutation(
    (data: ItemCreate) => ItemsService.createItem({ requestBody: data }),
    {
      queryKey: queryKeys.items.all,
      successMessage: "Item created successfully",
      onSuccess: () => {
        form.reset()
        setIsOpen(false)
      },
    },
  )

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button className="my-4">
          <Plus className="mr-2" />
          Add Item
        </Button>
      }
      title="Add Item"
      description="Fill in the details to add a new item."
      onSubmit={onSubmit}
      isSubmitting={mutation.isPending}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Title <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Title" type="text" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Description" type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDialog>
  )
}

export default AddItem
