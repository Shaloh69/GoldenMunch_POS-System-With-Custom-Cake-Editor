'use client';

import { Input } from '@nextui-org/input';
import { Select, SelectItem } from '@nextui-org/select';
import { Switch } from '@nextui-org/switch';
import { useState } from 'react';
import type { CakeDesign } from '@/app/page';

interface StepTextProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepText({ design, updateDesign }: StepTextProps) {
  const [enableText, setEnableText] = useState(!!design.cake_text);

  const handleToggleText = (enabled: boolean) => {
    setEnableText(enabled);
    if (!enabled) {
      updateDesign({ cake_text: '', text_color: '', text_font: '', text_position: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Custom Text</h2>
        <p className="text-gray-600">Add a personal message to your cake</p>
      </div>

      {/* Enable/Disable Text */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium">Add Text to Cake</h4>
          <p className="text-sm text-gray-600">Include a custom message</p>
        </div>
        <Switch
          isSelected={enableText}
          onValueChange={handleToggleText}
          color="warning"
        />
      </div>

      {enableText && (
        <>
          {/* Cake Text */}
          <Input
            label="Cake Text"
            placeholder="Happy Birthday!"
            value={design.cake_text || ''}
            onChange={(e) => updateDesign({ cake_text: e.target.value })}
            variant="bordered"
            maxLength={50}
            description={`${(design.cake_text || '').length}/50 characters`}
          />

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Text Color</label>
            <div className="flex gap-3">
              <Input
                type="color"
                value={design.text_color || '#FF1493'}
                onChange={(e) => updateDesign({ text_color: e.target.value })}
                variant="bordered"
                className="w-24"
              />
              <Input
                value={design.text_color || '#FF1493'}
                onChange={(e) => updateDesign({ text_color: e.target.value })}
                variant="bordered"
                className="flex-1"
                placeholder="#FF1493"
              />
            </div>
          </div>

          {/* Text Font */}
          <Select
            label="Text Font"
            selectedKeys={design.text_font ? [design.text_font] : ['script']}
            onChange={(e) => updateDesign({ text_font: e.target.value })}
            variant="bordered"
          >
            <SelectItem key="script" value="script">Script (Elegant)</SelectItem>
            <SelectItem key="bold" value="bold">Bold</SelectItem>
            <SelectItem key="elegant" value="elegant">Elegant</SelectItem>
            <SelectItem key="playful" value="playful">Playful</SelectItem>
            <SelectItem key="modern" value="modern">Modern</SelectItem>
          </Select>

          {/* Text Position */}
          <Select
            label="Text Position"
            selectedKeys={design.text_position ? [design.text_position] : ['top']}
            onChange={(e) => updateDesign({ text_position: e.target.value })}
            variant="bordered"
          >
            <SelectItem key="top" value="top">Top of Cake</SelectItem>
            <SelectItem key="center" value="center">Center</SelectItem>
            <SelectItem key="bottom" value="bottom">Bottom</SelectItem>
          </Select>
        </>
      )}

      {/* Preview */}
      {enableText && design.cake_text && (
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <p
            className="text-3xl font-bold text-center"
            style={{ color: design.text_color || '#FF1493' }}
          >
            {design.cake_text}
          </p>
        </div>
      )}
    </div>
  );
}
