"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import type { CakeDesign } from "@/app/cake-editor/page";

interface StepDecorationsProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

const DECORATION_TYPES = [
  { type: "flower", name: "Flower", icon: "🌸", color: "#FF69B4" },
  { type: "star", name: "Star", icon: "⭐", color: "#FFD700" },
  { type: "heart", name: "Heart", icon: "❤️", color: "#FF1493" },
  { type: "ribbon", name: "Ribbon", icon: "🎀", color: "#FF1493" },
  { type: "pearl", name: "Pearl", icon: "⚪", color: "#F5F5DC" },
  { type: "butterfly", name: "Butterfly", icon: "🦋", color: "#FF69B4" },
];

export default function StepDecorations({
  design,
  updateDesign,
  options,
}: StepDecorationsProps) {
  const themes = options?.themes || [];

  const addDecoration = (type: string, color: string) => {
    const decorations = design.decorations_3d || [];

    // Add new decoration with random position
    const newDecoration = {
      type,
      color,
      position: {
        x: (Math.random() - 0.5) * 1.5,
        y: Math.random() * (design.num_layers * 0.4) + 0.2,
        z: (Math.random() - 0.5) * 1.5,
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    };

    updateDesign({ decorations_3d: [...decorations, newDecoration] });
  };

  const removeDecoration = (index: number) => {
    const decorations = design.decorations_3d || [];
    const updated = decorations.filter((_: any, idx: number) => idx !== index);
    updateDesign({ decorations_3d: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Decorations & Theme
        </h2>
        <p className="text-gray-600">Choose a theme for your cake</p>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Select Theme (Optional)
        </label>
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
                    ? "border-2 border-amber-500 bg-amber-50"
                    : "border-2 border-gray-200 hover:border-amber-300"
                } transition-all`}
              >
                <CardBody className="p-4">
                  <h4 className="font-semibold text-lg mb-1">
                    {theme.theme_name}
                  </h4>
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
                ? "border-2 border-amber-500 bg-amber-50"
                : "border-2 border-gray-200 hover:border-amber-300"
            } transition-all`}
          >
            <CardBody className="p-4">
              <h4 className="font-semibold text-lg mb-1">No Theme</h4>
              <p className="text-gray-600 text-sm">Keep it simple</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 3D Decorations */}
      <div>
        <h3 className="font-semibold text-lg mb-3">🎨 3D Decorations</h3>
        <p className="text-gray-600 text-sm mb-4">
          Add beautiful decorations to your cake
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {DECORATION_TYPES.map((decor) => (
            <Card
              key={decor.type}
              isPressable
              onClick={() => addDecoration(decor.type, decor.color)}
              className="border-2 border-gray-200 hover:border-purple-400 transition-all"
            >
              <CardBody className="p-3 text-center">
                <div className="text-3xl mb-2">{decor.icon}</div>
                <p className="text-sm font-medium">{decor.name}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Current Decorations */}
        {design.decorations_3d && design.decorations_3d.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Added Decorations:</p>
            <div className="flex flex-wrap gap-2">
              {design.decorations_3d.map((decor: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full"
                >
                  <span className="text-sm capitalize">{decor.type}</span>
                  <button
                    onClick={() => removeDecoration(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Additional Instructions (Optional)
        </label>
        <textarea
          className="w-full p-3 border rounded-lg resize-none"
          rows={3}
          placeholder="Describe any specific decoration placement or additional ideas..."
          value={design.special_instructions || ""}
          onChange={(e) =>
            updateDesign({ special_instructions: e.target.value })
          }
        />
      </div>
    </div>
  );
}
