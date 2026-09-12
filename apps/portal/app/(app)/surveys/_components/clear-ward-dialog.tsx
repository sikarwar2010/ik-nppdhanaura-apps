"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { api } from "@/lib/api"

type Ward = {
  id: string
  number: number
  name: string
  code: string
  surveyCount: number
}

type ClearWardResult = {
  wardId: string
  wardCode: string
  deletedCount: number
}

export function ClearWardButton({ ward }: { ward: Ward }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [confirmWardCode, setConfirmWardCode] = React.useState("")

  const mutation = useMutation({
    mutationFn: async () =>
      api.post<ClearWardResult>(`/api/v1/wards/${ward.id}/clear-surveys`, {
        confirmWardCode,
      }),
    onSuccess: async (res) => {
      toast.success(
        `Deleted ${res.data.deletedCount.toLocaleString("en-IN")} surveys in ${ward.code}`
      )
      setOpen(false)
      setConfirmWardCode("")
      await queryClient.invalidateQueries({ queryKey: ["surveys"] })
      await queryClient.invalidateQueries({ queryKey: ["wards"] })
    },
    onError: (err: Error) => toast.error(err.message || "Delete failed"),
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmWardCode("")
    }
  }

  const canConfirm = confirmWardCode === ward.code && !mutation.isPending

  return (
    <>
      <Button
        variant="destructive"
        className="cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Delete ward data
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all surveys in this ward?</DialogTitle>
            <DialogDescription>
              Ward {String(ward.number).padStart(2, "0")}{" "}
              <span className="font-(family-name:--font-deva)">{ward.name}</span>{" "}
              has {ward.surveyCount.toLocaleString("en-IN")} live records. They
              will be removed from the registry. Payments, tax rates, and the
              ward itself stay. Type{" "}
              <span className="font-semibold text-foreground">{ward.code}</span>{" "}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-ward-code">Ward code</Label>
            <Input
              id="confirm-ward-code"
              value={confirmWardCode}
              onChange={(e) => setConfirmWardCode(e.target.value)}
              placeholder={ward.code}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={!canConfirm}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Deleting…" : "Delete ward data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
