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

interface AddItemTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (typeId?: number) => void;
}

export default function AddItemTypeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddItemTypeModalProps) {
  const [displayName, setDisplayName] = useState("");
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

      const response = await MenuService.createItemType({
        name,
        display_name: displayName,
      });

      toast.success("Item type created successfully");
      setDisplayName("");
      onSuccess(response.data?.type_id);
      onClose();
    } catch (error: any) {
      console.error("Failed to create item type:", error);
      toast.error(error?.response?.data?.message || "Failed to create item type");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDisplayName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Add New Item Type
        </ModalHeader>
        <ModalBody>
          <Input
            label="Display Name"
            placeholder="e.g., Cupcake, Cookie, etc."
            value={displayName}
            onValueChange={setDisplayName}
            isRequired
            autoFocus
            description="This is what will be shown in the dropdown"
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
            Add Item Type
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
