"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    url: string;
    label: string;
  }>;
  initialIndex?: number;
}

export function ImageViewer({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentImage = images[currentIndex];

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    handleReset();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    handleReset();
  };

  if (!currentImage) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="5xl"
      onClose={onClose}
      classNames={{
        base: "bg-gray-900",
        header: "border-b border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-white text-xl">{currentImage.label}</h3>
          <p className="text-gray-400 text-sm">
            Image {currentIndex + 1} of {images.length}
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="relative w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div
              className="transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img
                alt={currentImage.label}
                className="max-w-full max-h-[600px] object-contain"
                src={currentImage.url}
              />
            </div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  isIconOnly
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  size="lg"
                  variant="flat"
                  onPress={handlePrevious}
                >
                  <span className="text-white text-2xl">‹</span>
                </Button>
                <Button
                  isIconOnly
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  size="lg"
                  variant="flat"
                  onPress={handleNext}
                >
                  <span className="text-white text-2xl">›</span>
                </Button>
              </>
            )}
          </div>

          {/* Control panel */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
              <Button
                isIconOnly
                className="bg-gray-700 hover:bg-gray-600"
                size="sm"
                variant="flat"
                onPress={handleZoomOut}
              >
                <MagnifyingGlassMinusIcon className="w-5 h-5 text-white" />
              </Button>

              <span className="text-white text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Button
                isIconOnly
                className="bg-gray-700 hover:bg-gray-600"
                size="sm"
                variant="flat"
                onPress={handleZoomIn}
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5 text-white" />
              </Button>
            </div>

            <Button
              className="bg-gray-700 hover:bg-gray-600"
              size="sm"
              startContent={<ArrowPathIcon className="w-5 h-5" />}
              variant="flat"
              onPress={handleRotate}
            >
              <span className="text-white">Rotate</span>
            </Button>

            <Button
              className="bg-gray-700 hover:bg-gray-600"
              size="sm"
              variant="flat"
              onPress={handleReset}
            >
              <span className="text-white">Reset</span>
            </Button>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-amber-500 scale-110"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(index);
                    handleReset();
                  }}
                >
                  <img
                    alt={img.label}
                    className="w-full h-full object-cover"
                    src={img.url}
                  />
                </button>
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            className="bg-red-600 hover:bg-red-700"
            startContent={<XMarkIcon className="w-5 h-5" />}
            onPress={onClose}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
