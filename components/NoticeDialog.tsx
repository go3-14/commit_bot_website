'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Shown on every visit on purpose: nothing is stored, so it returns on reload.
export default function NoticeDialog() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-panel border-line text-fg sm:max-w-md shadow-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-fg text-base">about this project</DialogTitle>
          <DialogDescription className="text-xs text-dim pt-1 space-y-3 leading-relaxed">
            <span className="block">
              This is a personal hobby project, built for fun and to experiment with the GitHub API.
            </span>
            <span className="block">
              I don&apos;t encourage or support faking a public profile, and I have never used this tool on my own
              main account. Backdated commits are real commits with the dates you choose, and they stay visible in the
              repository&apos;s history. Please don&apos;t use it to misrepresent your work to employers or anyone else.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-line pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-mint-strong hover:bg-mint text-canvas font-bold transition-colors"
          >
            i understand
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
