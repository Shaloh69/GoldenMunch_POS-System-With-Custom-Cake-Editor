'use client';

import { Button } from '@nextui-org/button';
import { Card, CardBody } from '@nextui-org/card';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { CakeDesign } from '@/app/page';

interface StepLayersProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

const LAYER_OPTIONS = [1, 2, 3, 4, 5];

export default function StepLayers({ design, updateDesign }: StepLayersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">How Many Layers?</h2>
        <p className="text-gray-600">Choose the number of layers for your cake</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {LAYER_OPTIONS.map((layers) => {
          const isSelected = design.num_layers === layers;
          const price = 500 + (layers - 1) * 150;

          return (
            <Card
              key={layers}
              isPressable
              onClick={() => updateDesign({ num_layers: layers })}
              className={`${
                isSelected
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border-2 border-gray-200 hover:border-amber-300'
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
                <div className="text-4xl mb-2">🎂</div>
                <div className="font-bold text-xl mb-1">{layers}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {layers === 1 ? 'Layer' : 'Layers'}
                </div>
                <div className="text-amber-600 font-semibold text-sm">
                  ₱{price}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> More layers create a more impressive cake and can serve more guests!
        </p>
      </div>
    </div>
  );
}
