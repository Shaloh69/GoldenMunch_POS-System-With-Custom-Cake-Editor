/**
 * Contact Confirmation Modal
 * Shows before final submission to ensure customer contact details are correct
 */

'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import { Button } from '@nextui-org/button';
import { Checkbox } from '@nextui-org/checkbox';
import { Card, CardBody } from '@nextui-org/card';
import { ExclamationTriangleIcon, PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ContactConfirmationData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface ContactConfirmationModalProps {
  isOpen: boolean;
  contactInfo: ContactConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export default function ContactConfirmationModal({
  isOpen,
  contactInfo,
  onConfirm,
  onCancel,
  onEdit,
}: ContactConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!confirmed || !termsAccepted) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setConfirmed(false);
      setTermsAccepted(false);
      onCancel();
    }
  };

  const canSubmit = confirmed && termsAccepted && !isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      isDismissable={!isSubmitting}
      hideCloseButton={isSubmitting}
      classNames={{
        backdrop: 'bg-gradient-to-t from-zinc-900/50 to-zinc-900/80',
        base: 'border-none bg-gradient-to-br from-white to-gray-50',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center border-b border-gray-200 pb-4">
          <div className="flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-800">
              Confirm Your Contact Details
            </h2>
          </div>
          <p className="text-sm font-normal text-gray-600 mt-2">
            Please verify your information is correct before submitting
          </p>
        </ModalHeader>

        <ModalBody className="py-6">
          {/* Warning Banner */}
          <Card className="bg-amber-50 border-2 border-amber-200">
            <CardBody className="py-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-1">Important!</h3>
                  <p className="text-sm text-amber-800">
                    We will <span className="font-bold">ONLY</span> contact you using the details below.
                    Please make sure they are correct to avoid missing important updates about your order.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Contact Details Display */}
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Your Contact Information</h3>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<PencilIcon className="h-4 w-4" />}
                  onPress={onEdit}
                  isDisabled={isSubmitting}
                >
                  Edit
                </Button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm text-gray-500 font-medium">Name:</div>
                  <div className="flex-1 text-gray-900 font-semibold">{contactInfo.customer_name}</div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm text-gray-500 font-medium">Email:</div>
                  <div className="flex-1 text-gray-900 font-semibold break-all">{contactInfo.customer_email}</div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm text-gray-500 font-medium">Phone:</div>
                  <div className="flex-1 text-gray-900 font-semibold">{contactInfo.customer_phone}</div>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <Checkbox
                isSelected={confirmed}
                onValueChange={setConfirmed}
                isDisabled={isSubmitting}
                classNames={{
                  label: 'text-sm',
                }}
              >
                <span className="text-gray-700">
                  I confirm that the above information is <span className="font-bold">correct</span>
                </span>
              </Checkbox>

              <Checkbox
                isSelected={termsAccepted}
                onValueChange={setTermsAccepted}
                isDisabled={isSubmitting}
                classNames={{
                  label: 'text-sm',
                }}
              >
                <span className="text-gray-700">
                  I accept the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    terms and conditions
                  </a>
                </span>
              </Checkbox>
            </div>

            {/* Info Box */}
            <Card className="bg-blue-50 border border-blue-200">
              <CardBody className="py-3">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">What happens next?</span>
                  <br />
                  1. We'll review your design and send you a quote via email
                  <br />
                  2. You'll receive payment instructions
                  <br />
                  3. After payment verification, we'll schedule your pickup
                </p>
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-gray-200 pt-4">
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="success"
            onPress={handleConfirm}
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
            startContent={!isSubmitting && <CheckCircleIcon className="h-5 w-5" />}
            className="font-semibold"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
