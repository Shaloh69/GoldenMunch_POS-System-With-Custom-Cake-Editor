'use client';

import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Select, SelectItem } from '@heroui/select';
import type { CakeDesign } from '@/app/cake-editor/page';

interface StepDecorationsProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepDecorations({ design, updateDesign, options }: StepDecorationsProps) {
  const themes = options?.themes || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Decorations & Theme</h2>
        <p className="text-gray-600">Choose a theme for your cake</p>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Select Theme (Optional)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map((theme: any) => {
            const isSelected = design.theme_id === theme.theme_id;

            return (
              <Card
                key={theme.theme_id}
                isPressable
                onClick={() => updateDesign({ theme_id: theme.theme_id })}
                className={`${
                  isSelected
                    ? 'border-2 border-amber-500 bg-amber-50'
                    : 'border-2 border-gray-200 hover:border-amber-300'
                } transition-all`}
              >
                <CardBody className="p-4">
                  <h4 className="font-semibold text-lg mb-1">{theme.theme_name}</h4>
                  <p className="text-amber-600 font-semibold text-sm">
                    +₱{theme.base_additional_cost}
                  </p>
                </CardBody>
              </Card>
            );
          })}
          <Card
            isPressable
            onClick={() => updateDesign({ theme_id: undefined })}
            className={`${
              !design.theme_id
                ? 'border-2 border-amber-500 bg-amber-50'
                : 'border-2 border-gray-200 hover:border-amber-300'
            } transition-all`}
          >
            <CardBody className="p-4">
              <h4 className="font-semibold text-lg mb-1">No Theme</h4>
              <p className="text-gray-600 text-sm">Keep it simple</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 3D Decorations (Future Enhancement) */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200">
        <h3 className="font-semibold text-lg mb-2">🎨 3D Decorations</h3>
        <p className="text-gray-600 text-sm mb-4">
          Interactive 3D decoration placement is coming soon! For now, add special instructions below.
        </p>
        <textarea
          className="w-full p-3 border rounded-lg resize-none"
          rows={3}
          placeholder="Describe your decoration ideas (flowers, ribbons, toppers, etc.)..."
          value={design.special_instructions || ''}
          onChange={(e) => updateDesign({ special_instructions: e.target.value })}
        />
      </div>
    </div>
  );
}
