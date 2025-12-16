"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { CheckIcon } from "@heroicons/react/24/solid";
import type { CakeDesign } from "@/app/cake-editor/page";

interface StepSizeProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepSize({
  design,
  updateDesign,
  options,
}: StepSizeProps) {
  const sizes = options?.sizes || [];

  const handleSizeSelect = (layerIndex: number, sizeId: number) => {
    const updates: Partial<CakeDesign> = {};
    const key = `layer_${layerIndex}_size_id` as keyof CakeDesign;
    updates[key] = sizeId as any;
    updateDesign(updates);
  };

  const getSelectedSize = (layerIndex: number) => {
    const key = `layer_${layerIndex}_size_id` as keyof CakeDesign;
    return design[key] as number | undefined;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Sizes</h2>
        <p className="text-gray-600">Choose the size for each layer</p>
      </div>

      {Array.from({ length: design.num_layers }).map((_, index) => {
        const layerNumber = index + 1;
        const selectedSize = getSelectedSize(layerNumber);

        return (
          <div key={layerNumber}>
            <div className="flex items-center gap-2 mb-3">
              <Chip color="warning" variant="flat">
                Layer {layerNumber}
              </Chip>
              <span className="text-sm text-gray-500">
                (Bottom layers should be larger)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sizes.map((size: any) => {
                const isSelected = selectedSize === size.size_id;

                return (
                  <Card
                    key={size.size_id}
                    isPressable
                    onClick={() => handleSizeSelect(layerNumber, size.size_id)}
                    className={`${
                      isSelected
                        ? "border-2 border-amber-500 bg-amber-50"
                        : "border-2 border-gray-200 hover:border-amber-300"
                    } transition-all`}
                  >
                    <CardBody className="p-4 text-center relative">
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-amber-500 rounded-full p-1">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                      <h4 className="font-semibold mb-1">{size.size_name}</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Serves {size.servings}
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
