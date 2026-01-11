"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Avatar } from '@heroui/avatar';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Divider } from '@heroui/divider';
import { Message } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  onMessagesVisible?: (messageIds: number[]) => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  isLoading,
  onMessagesVisible,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark unread messages as read when they become visible
  useEffect(() => {
    if (messages.length > 0 && onMessagesVisible) {
      const unreadIds = messages
        .filter((msg) => !msg.is_read && msg.sender_type === 'customer')
        .map((msg) => msg.notification_id);

      if (unreadIds.length > 0) {
        // Delay marking as read to simulate actual viewing
        const timer = setTimeout(() => {
          onMessagesVisible(unreadIds);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [messages, onMessagesVisible]);

  const toggleMessageExpanded = (messageId: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const getSenderIcon = (senderType: Message['sender_type']) => {
    switch (senderType) {
      case 'admin':
        return '👨‍💼';
      case 'customer':
        return '👤';
      case 'system':
        return '🤖';
      default:
        return '💬';
    }
  };

  const getSenderColor = (senderType: Message['sender_type']) => {
    switch (senderType) {
      case 'admin':
        return 'primary';
      case 'customer':
        return 'success';
      case 'system':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" label="Loading messages..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-default-50 to-default-100">
        <CardBody className="text-center p-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-default-700 mb-2">
            No messages yet
          </h3>
          <p className="text-default-500">
            Start the conversation by sending a message below.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {messages.map((message, index) => {
        const isExpanded = expandedMessages.has(message.notification_id);
        const isLongMessage = message.message_body.length > 300;
        const shouldTruncate = !isExpanded && isLongMessage;
        const displayBody = shouldTruncate
          ? message.message_body.substring(0, 300) + '...'
          : message.message_body;

        const isFromCustomer = message.sender_type === 'customer';
        const isUnread = !message.is_read && isFromCustomer;

        return (
          <Card
            key={message.notification_id}
            className={`
              transition-all duration-200 hover:shadow-lg
              ${isFromCustomer ? 'bg-gradient-to-br from-success-50 to-success-100/50 border-l-4 border-success' : 'bg-default-50'}
              ${isUnread ? 'ring-2 ring-success shadow-success/20' : ''}
            `}
          >
            <CardHeader className="flex gap-3 items-start pb-2">
              <Avatar
                icon={<span className="text-2xl">{getSenderIcon(message.sender_type)}</span>}
                className={`bg-${getSenderColor(message.sender_type)} flex-shrink-0`}
                size="md"
              />
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-md font-semibold">{message.sender_name}</p>
                  <Chip
                    size="sm"
                    color={getSenderColor(message.sender_type)}
                    variant="flat"
                  >
                    {message.sender_type}
                  </Chip>
                  {isUnread && (
                    <Chip size="sm" color="success" variant="solid">
                      New
                    </Chip>
                  )}
                </div>
                <p className="text-small text-default-500 flex items-center gap-2 mt-1">
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(message.sent_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {message.status !== 'sent' && (
                    <Chip size="sm" color="warning" variant="flat">
                      {message.status}
                    </Chip>
                  )}
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-3">
              {message.subject && message.notification_type !== 'message' && (
                <p className="text-sm font-semibold text-default-700 mb-2">
                  Subject: {message.subject}
                </p>
              )}
              <div
                className="prose prose-sm max-w-none text-default-700"
                dangerouslySetInnerHTML={{ __html: displayBody }}
              />
              {isLongMessage && (
                <button
                  onClick={() => toggleMessageExpanded(message.notification_id)}
                  className="text-primary text-sm font-medium mt-2 hover:underline"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
              {message.read_at && (
                <p className="text-xs text-default-400 mt-3 flex items-center gap-1">
                  <span>✓✓</span>
                  <span>
                    Read {formatDistanceToNow(new Date(message.read_at), { addSuffix: true })}
                  </span>
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
      <div ref={messagesEndRef} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default MessageThread;
