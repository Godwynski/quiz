"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 px-6 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="order-2 sm:order-1">
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="order-1 sm:order-2"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
