'use client';

import { Card, CardBody } from '@nextui-org/card';
import { Select, SelectItem } from '@nextui-org/select';
import { Input } from '@nextui-org/input';
import { useMemo } from 'react';
import type { CakeDesign } from '@/app/page';

interface StepFrostingProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

const FROSTING_TYPES = [
  { value: 'buttercream', label: 'Buttercream', description: 'Classic & creamy' },
  { value: 'fondant', label: 'Fondant', description: 'Smooth & elegant' },
  { value: 'whipped_cream', label: 'Whipped Cream', description: 'Light & fluffy' },
  { value: 'ganache', label: 'Ganache', description: 'Rich chocolate' },
  { value: 'cream_cheese', label: 'Cream Cheese', description: 'Tangy & smooth' },
];

const PRESET_COLORS = [
  '#FFFFFF', // White
  '#FFE4E1', // Pink
  '#E6E6FA', // Lavender
  '#FFD700', // Gold
  '#87CEEB', // Sky Blue
  '#98FB98', // Mint
  '#FFB6C1', // Light Pink
  '#DDA0DD', // Plum
];

export default function StepFrosting({ design, updateDesign }: StepFrostingProps) {
  // Memoize selectedKeys to prevent infinite re-renders
  const selectedCandleType = useMemo(
    () => new Set(design.candle_type ? [design.candle_type] : []),
    [design.candle_type]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Frosting Style</h2>
        <p className="text-gray-600">Choose your frosting type and color</p>
      </div>

      {/* Frosting Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Frosting Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FROSTING_TYPES.map((type) => (
            <Card
              key={type.value}
              isPressable
              onClick={() => updateDesign({ frosting_type: type.value })}
              className={`${
                design.frosting_type === type.value
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border-2 border-gray-200 hover:border-amber-300'
              } transition-all`}
            >
              <CardBody className="p-4">
                <h4 className="font-semibold mb-1">{type.label}</h4>
                <p className="text-sm text-gray-600">{type.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Frosting Color */}
      <div>
        <label className="block text-sm font-medium mb-2">Frosting Color</label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => updateDesign({ frosting_color: color })}
              className={`w-12 h-12 rounded-full border-4 transition-all ${
                design.frosting_color === color
                  ? 'border-amber-500 scale-110'
                  : 'border-gray-300 hover:border-amber-300'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <Input
          type="color"
          label="Custom Color"
          value={design.frosting_color}
          onChange={(e) => updateDesign({ frosting_color: e.target.value })}
          variant="bordered"
        />
      </div>

      {/* Candles */}
      <div>
        <label className="block text-sm font-medium mb-2">Candles</label>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-lg flex-shrink-0">ℹ️</span>
            <p className="text-sm text-amber-900 font-semibold">
              The baker will add candles to your actual cake. This is for reference only and won't appear in the 3D preview.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            label="Number of Candles"
            min="0"
            max="100"
            value={design.candles_count.toString()}
            onChange={(e) => updateDesign({ candles_count: parseInt(e.target.value) || 0 })}
            variant="bordered"
          />
          <Select
            label="Candle Type"
            selectedKeys={selectedCandleType}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              updateDesign({ candle_type: selected });
            }}
            variant="bordered"
          >
            <SelectItem key="regular" value="regular">Regular</SelectItem>
            <SelectItem key="number" value="number">Number</SelectItem>
            <SelectItem key="sparkler" value="sparkler">Sparkler</SelectItem>
            <SelectItem key="none" value="none">None</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  );
}
