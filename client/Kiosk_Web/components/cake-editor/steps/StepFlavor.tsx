"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { CheckIcon } from "@heroicons/react/24/solid";
import type { CakeDesign } from "@/app/cake-editor/page";

interface StepFlavorProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepFlavor({
  design,
  updateDesign,
  options,
}: StepFlavorProps) {
  const flavors = options?.flavors || [];

  const handleFlavorSelect = (layerIndex: number, flavorId: number) => {
    const updates: Partial<CakeDesign> = {};
    const key = `layer_${layerIndex}_flavor_id` as keyof CakeDesign;
    updates[key] = flavorId as any;
    updateDesign(updates);
  };

  const getSelectedFlavor = (layerIndex: number) => {
    const key = `layer_${layerIndex}_flavor_id` as keyof CakeDesign;
    return design[key] as number | undefined;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Flavors
        </h2>
        <p className="text-gray-600">
          Select a delicious flavor for each layer
        </p>
      </div>

      {Array.from({ length: design.num_layers }).map((_, index) => {
        const layerNumber = index + 1;
        const selectedFlavor = getSelectedFlavor(layerNumber);

        return (
          <div key={layerNumber}>
            <div className="flex items-center gap-2 mb-3">
              <Chip color="warning" variant="flat">
                Layer {layerNumber}
              </Chip>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flavors.map((flavor: any) => {
                const isSelected = selectedFlavor === flavor.flavor_id;

                return (
                  <Card
                    key={flavor.flavor_id}
                    isPressable
                    onClick={() =>
                      handleFlavorSelect(layerNumber, flavor.flavor_id)
                    }
                    className={`${
                      isSelected
                        ? "border-2 border-amber-500 bg-amber-50"
                        : "border-2 border-gray-200 hover:border-amber-300"
                    } transition-all`}
                  >
                    <CardBody className="p-4 relative">
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-amber-500 rounded-full p-1">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <h4 className="font-semibold text-lg mb-1">
                        {flavor.flavor_name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {flavor.description}
                      </p>
                      <p className="text-amber-600 font-semibold text-sm">
                        +₱{flavor.base_price_per_tier}/tier
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
