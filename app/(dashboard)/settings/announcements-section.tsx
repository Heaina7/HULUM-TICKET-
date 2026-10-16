"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MegaphoneIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/(dashboard)/settings/actions";
import type { Announcement } from "@/types";

export function AnnouncementsSection({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createAnnouncementAction({ title, message });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Announcement posted");
        setDialogOpen(false);
        setTitle("");
        setMessage("");
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteAnnouncementAction(id);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Broadcast a message to every branch admin.</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon /> New announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New announcement</DialogTitle>
              <DialogDescription>Visible to every branch admin.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !title.trim()}>
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {initialAnnouncements.length === 0 ? (
          <EmptyState icon={MegaphoneIcon} title="No announcements posted yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {initialAnnouncements.map((announcement) => (
              <div key={announcement.id} className="rounded-md border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{announcement.title}</p>
                    {announcement.message && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{announcement.message}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleDelete(announcement.id)}
                    aria-label={`Delete ${announcement.title}`}
                    className="shrink-0"
                  >
                    <Trash2Icon className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
