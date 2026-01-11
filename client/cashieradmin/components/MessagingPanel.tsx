"use client";

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import { useMessages } from '@/hooks/useMessages';
import { MessageThread } from './MessageThread';
import { MessageComposer } from './MessageComposer';

interface MessagingPanelProps {
  requestId: number | string;
  customerName?: string;
}

export const MessagingPanel: React.FC<MessagingPanelProps> = ({
  requestId,
  customerName,
}) => {
  const {
    messages,
    request,
    unreadCount,
    isLoading,
    sendMessage,
    markAsRead,
  } = useMessages(requestId);

  const handleSendMessage = async (messageBody: string, subject?: string) => {
    await sendMessage(messageBody, subject);
  };

  const handleMessagesVisible = (messageIds: number[]) => {
    if (messageIds.length > 0) {
      markAsRead(messageIds);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card className="bg-gradient-to-br from-default-50 to-default-100 shadow-lg">
        <CardHeader className="flex gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💬</span>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-default-800">
                Message Thread
              </h3>
              <p className="text-sm text-default-500">
                Communication with {customerName || 'customer'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Chip color="success" variant="solid" size="lg">
              {unreadCount} unread
            </Chip>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="gap-6">
          <MessageThread
            messages={messages}
            isLoading={isLoading}
            onMessagesVisible={handleMessagesVisible}
          />

          <Divider className="my-2" />

          <MessageComposer
            onSend={handleSendMessage}
            customerName={customerName || request?.customer_name}
            placeholder={`Reply to ${customerName || 'customer'}...`}
          />
        </CardBody>
      </Card>

      {/* Message Stats Card */}
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100/30">
        <CardBody>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{messages.length}</p>
              <p className="text-sm text-default-600">Total Messages</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">
                {messages.filter((m) => m.sender_type === 'customer').length}
              </p>
              <p className="text-sm text-default-600">From Customer</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">
                {messages.filter((m) => m.sender_type === 'admin').length}
              </p>
              <p className="text-sm text-default-600">From Admin</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default MessagingPanel;
