'use client';

import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import type { CakeDesign } from '@/app/page';

interface StepCustomerInfoProps {
  design: CakeDesign;
  updateDesign: (updates: Partial<CakeDesign>) => void;
  options: any;
}

export default function StepCustomerInfo({ design, updateDesign }: StepCustomerInfoProps) {
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
          selectedKeys={design.event_type ? [design.event_type] : []}
          onChange={(e) => updateDesign({ event_type: e.target.value })}
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
          label="Event Date (Optional)"
          type="date"
          value={design.event_date}
          onChange={(e) => updateDesign({ event_date: e.target.value })}
          variant="bordered"
        />
      </div>
    </div>
  );
}
