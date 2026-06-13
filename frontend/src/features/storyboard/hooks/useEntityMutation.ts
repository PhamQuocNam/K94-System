import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"

interface UseEntityMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
  invalidateQueries?: string[][]
}

export function useEntityMutation<TData = unknown, TVariables = void>(
  options: UseEntityMutationOptions<TData, TVariables>,
) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: options.mutationFn,
    onSuccess: (data) => {
      if (options.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey })
        }
      }
      if (options.successMessage) {
        toast({ title: options.successMessage })
      }
      options.onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: options.errorMessage || "Operation failed",
        description: error.message,
      })
      options.onError?.(error)
    },
  })

  return mutation
}
