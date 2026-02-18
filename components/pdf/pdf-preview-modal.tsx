'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PDFViewer } from '@react-pdf/renderer'
import React from 'react'

interface PDFPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactElement
}

export function PDFPreviewModal({
  open,
  onOpenChange,
  title,
  children,
}: PDFPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 border border-gray-200 rounded">
          {open && (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              {children}
            </PDFViewer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
