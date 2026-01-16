"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { EnvelopeIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { EmailService, type SendEmailData } from "@/services/email.service";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultRequestId?: number;
  defaultCustomerName?: string;
  onEmailSent?: () => void;
}

const EMAIL_TEMPLATES = {
  custom_message: {
    label: "Custom Message",
    subject: "",
    body: "",
  },
  under_review: {
    label: "Under Review",
    subject: "Your Custom Cake Request is Under Review",
    body: `<p>Dear Customer,</p>

<p>Thank you for submitting your custom cake request!</p>

<p>We are currently reviewing your design and requirements. Our team will get back to you shortly with:</p>
<ul>
  <li>Final price confirmation</li>
  <li>Preparation timeline</li>
  <li>Pickup schedule options</li>
</ul>

<p>Please wait for further emails from us. If you have any questions in the meantime, feel free to reach out.</p>

<p>We appreciate your patience!</p>`,
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    subject: "🎂 Your Custom Cake is Ready for Pickup!",
    body: `<p>Dear Customer,</p>

<p>Great news! Your custom cake is ready for pickup!</p>

<div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
  <p style="margin: 0;"><strong>📍 Pickup Location:</strong> GoldenMunch Bakery</p>
  <p style="margin: 5px 0 0 0;"><strong>⏰ Business Hours:</strong> 9:00 AM - 6:00 PM</p>
</div>

<p><strong>Important Notes:</strong></p>
<ul>
  <li>Please bring your verification code for easy pickup</li>
  <li>The cake is at its best when picked up as scheduled</li>
  <li>Contact us if you need to reschedule</li>
</ul>

<p>We can't wait for you to see your beautiful custom cake!</p>`,
  },
  price_update: {
    label: "Price Update",
    subject: "Price Update for Your Custom Cake Request",
    body: `<p>Dear Customer,</p>

<p>We have reviewed your custom cake request and updated the pricing based on your requirements.</p>

<div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
  <p style="margin: 0;"><strong>Updated Price:</strong> [Enter price here]</p>
</div>

<p>This price includes:</p>
<ul>
  <li>All design elements and decorations</li>
  <li>Premium ingredients</li>
  <li>Custom text and personalization</li>
</ul>

<p>Please confirm if you would like to proceed with this order.</p>`,
  },
  schedule_confirmation: {
    label: "Schedule Confirmation",
    subject: "Pickup Schedule Confirmed",
    body: `<p>Dear Customer,</p>

<p>Your custom cake pickup has been scheduled!</p>

<div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
  <p style="margin: 0;"><strong>📅 Pickup Date:</strong> [Enter date here]</p>
  <p style="margin: 5px 0 0 0;"><strong>🕐 Pickup Time:</strong> [Enter time here]</p>
</div>

<p>Please arrive during the scheduled time to ensure your cake is at its best quality.</p>

<p>We look forward to serving you!</p>`,
  },
};

export function EmailComposer({
  isOpen,
  onClose,
  defaultRecipient = "",
  defaultRequestId,
  defaultCustomerName = "",
  onEmailSent,
}: EmailComposerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof EMAIL_TEMPLATES>("custom_message");
  const [formData, setFormData] = useState<SendEmailData>({
    recipient_email: defaultRecipient,
    subject: "",
    message_body: "",
    request_id: defaultRequestId,
    notification_type: "admin_message",
  });

  const handleTemplateChange = (templateKey: keyof typeof EMAIL_TEMPLATES) => {
    setSelectedTemplate(templateKey);
    const template = EMAIL_TEMPLATES[templateKey];
    setFormData({
      ...formData,
      subject: template.subject,
      message_body: EmailService.generateEmailTemplate(
        template.body,
        defaultCustomerName ? `<p><strong>Customer:</strong> ${defaultCustomerName}</p>` : undefined
      ),
    });
  };

  const handleSendEmail = async () => {
    if (!formData.recipient_email || !formData.subject || !formData.message_body) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await EmailService.sendCustomEmail(formData);
      alert("Email sent successfully!");

      // Reset form
      setFormData({
        recipient_email: defaultRecipient,
        subject: "",
        message_body: "",
        request_id: defaultRequestId,
        notification_type: "admin_message",
      });
      setSelectedTemplate("custom_message");

      onEmailSent?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to send email:", error);
      alert(error?.response?.data?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  // Update recipient when defaultRecipient changes
  useEffect(() => {
    if (defaultRecipient && defaultRecipient !== formData.recipient_email) {
      setFormData((prev) => ({ ...prev, recipient_email: defaultRecipient }));
    }
  }, [defaultRecipient]);

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="w-6 h-6 text-blue-500" />
            <span>Compose Email</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Template Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Email Template
              </label>
              <Select
                selectedKeys={new Set([selectedTemplate])}
                placeholder="Select a template"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as keyof typeof EMAIL_TEMPLATES;
                  if (selectedKey) {
                    handleTemplateChange(selectedKey);
                  }
                }}
              >
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Recipient Email <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="customer@example.com"
                type="email"
                value={formData.recipient_email}
                onChange={(e) =>
                  setFormData({ ...formData, recipient_email: e.target.value })
                }
              />
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                HTML formatting is supported
              </p>
              <Textarea
                required
                minRows={12}
                placeholder="Enter your message here. You can use HTML tags for formatting."
                value={formData.message_body}
                onChange={(e) =>
                  setFormData({ ...formData, message_body: e.target.value })
                }
              />
            </div>

            {/* Preview */}
            <div>
              <label className="text-sm font-medium mb-2 block">Preview</label>
              <div
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: formData.message_body || "<p class='text-gray-400'>No content to preview</p>" }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            isLoading={loading}
            startContent={<EnvelopeIcon className="w-4 h-4" />}
            onPress={handleSendEmail}
          >
            Send Email
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
