'use client';

import { Input } from '@nextui-org/input';
import { Select, SelectItem } from '@nextui-org/select';
import { useMemo } from 'react';
import type { CakeDesign } from '@/app/page';

interface StepCustomerInfoProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepCustomerInfo({ design, updateDesign }: StepCustomerInfoProps) {
  // Memoize selectedKeys to prevent infinite re-renders
  const selectedEventType = useMemo(
    () => new Set(design.event_type ? [design.event_type] : []),
    [design.event_type]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Let's Get Started!</h2>
        <p className="text-gray-600">Tell us about yourself and your celebration</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={design.customer_name}
          onChange={(e) => updateDesign({ customer_name: e.target.value })}
          isRequired
          variant="bordered"
        />

        <Input
          label="Email Address"
          placeholder="your.email@example.com"
          type="email"
          value={design.customer_email}
          onChange={(e) => updateDesign({ customer_email: e.target.value })}
          isRequired
          variant="bordered"
        />

        <Input
          label="Phone Number"
          placeholder="+63 912 345 6789"
          type="tel"
          value={design.customer_phone}
          onChange={(e) => updateDesign({ customer_phone: e.target.value })}
          isRequired
          variant="bordered"
        />

        <Select
          label="Event Type"
          placeholder="Select occasion"
          selectedKeys={selectedEventType}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            updateDesign({ event_type: selected });
          }}
          variant="bordered"
        >
          <SelectItem key="birthday" value="birthday">Birthday</SelectItem>
          <SelectItem key="wedding" value="wedding">Wedding</SelectItem>
          <SelectItem key="anniversary" value="anniversary">Anniversary</SelectItem>
          <SelectItem key="graduation" value="graduation">Graduation</SelectItem>
          <SelectItem key="baby_shower" value="baby_shower">Baby Shower</SelectItem>
          <SelectItem key="other" value="other">Other</SelectItem>
        </Select>

        <Input
          label="Pick Up Time"
          placeholder="Pick up time (-Optional- This Can Change During verification)"
          type="date"
          value={design.event_date}
          onChange={(e) => updateDesign({ event_date: e.target.value })}
          variant="bordered"
        />
      </div>
    </div>
  );
}
