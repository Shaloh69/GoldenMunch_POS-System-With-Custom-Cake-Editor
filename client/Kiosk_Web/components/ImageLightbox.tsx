"use client";

import { useState } from "react";
import { Dialog as Modal, DialogContent as ModalContent, ModalBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageLightboxProps {
  src?: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
}

export default function ImageLightbox({
  src,
  alt,
  children,
  className = "",
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render lightbox if no src provided
  if (!src) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <div
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(true);
          }
        }}
      >
        {children}
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="full"
        classNames={{
          base: "bg-black/95",
          backdrop: "bg-black/80",
        }}
      >
        <DialogContent as ModalContent>
          <ModalBody className="flex items-center justify-center p-0 relative">
            {/* Close button */}
            <Button
              isIconOnly
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white text-2xl"
              onClick={() => setIsOpen(false)}
              size="lg"
            >
              ✕
            </Button>

            {/* Fullscreen image */}
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="relative max-w-7xl max-h-full w-full h-full">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            {/* Image caption */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
              <p className="text-white text-2xl font-semibold text-center">
                {alt}
              </p>
            </div>
          </ModalBody>
        </DialogContent as ModalContent>
      </Modal>
    </>
  );
}
