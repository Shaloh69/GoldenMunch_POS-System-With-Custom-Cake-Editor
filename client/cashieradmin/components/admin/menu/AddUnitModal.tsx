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
import { Input } from "@heroui/input";
import { MenuService } from "@/services/menu.service";
import toast from "react-hot-toast";

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUnitModal({
  isOpen,
  onClose,
  onSuccess,
}: AddUnitModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsLoading(true);
    try {
      // Generate name from display name (lowercase, underscores)
      const name = displayName.toLowerCase().replace(/\s+/g, "_");

      await MenuService.createUnit({
        name,
        display_name: displayName,
        abbreviation: abbreviation.trim() || undefined,
      });

      toast.success("Unit of measure created successfully");
      setDisplayName("");
      setAbbreviation("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create unit:", error);
      toast.error(error?.response?.data?.message || "Failed to create unit of measure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDisplayName("");
    setAbbreviation("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Add New Unit of Measure
        </ModalHeader>
        <ModalBody>
          <Input
            label="Display Name"
            placeholder="e.g., Bundle, Gallon, etc."
            value={displayName}
            onValueChange={setDisplayName}
            isRequired
            autoFocus
            description="This is what will be shown in the dropdown"
          />
          <Input
            label="Abbreviation (Optional)"
            placeholder="e.g., bndl, gal, etc."
            value={abbreviation}
            onValueChange={setAbbreviation}
            description="Short form for the unit"
          />
          <p className="text-xs text-gray-500">
            Internal name will be automatically generated from the display name
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!displayName.trim()}
          >
            Add Unit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
