"use client";

import React, { useState, useRef } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Textarea } from '@heroui/input';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { toast } from 'react-hot-toast';

interface MessageComposerProps {
  onSend: (message: string, subject?: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  customerName?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message here...',
  customerName,
}) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showSubject, setShowSubject] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      await onSend(message, showSubject && subject ? subject : undefined);
      setMessage('');
      setSubject('');
      setShowSubject(false);
      toast.success('Message sent successfully!');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertTemplate = (template: string) => {
    const templates: Record<string, string> = {
      greeting: `Hi ${customerName || 'there'},\n\n`,
      approval: `Great news! Your custom cake request has been approved.\n\nWe'll get started on your beautiful creation right away. If you have any questions, please don't hesitate to ask.\n\nBest regards,\nGoldenMunch Team`,
      clarification: `Hi ${customerName || 'there'},\n\nThank you for your custom cake request. We'd like to clarify a few details to ensure we create exactly what you're envisioning:\n\n- [Detail 1]\n- [Detail 2]\n\nPlease let us know your preferences.\n\nBest regards,\nGoldenMunch Team`,
      ready: `Hi ${customerName || 'there'},\n\nYour custom cake is ready for pickup! 🎉\n\nPlease bring your verification code when you arrive.\n\nLooking forward to seeing you!\n\nBest regards,\nGoldenMunch Team`,
    };

    setMessage((prev) => prev + templates[template]);
    textareaRef.current?.focus();
  };

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-primary-100/30 border border-primary-200">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-default-800 flex items-center gap-2">
            <span className="text-2xl">✉️</span>
            Compose Message
          </h4>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => setShowSubject(!showSubject)}
          >
            {showSubject ? 'Hide' : 'Add'} Subject
          </Button>
        </div>

        {showSubject && (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full px-4 py-2 rounded-lg border-2 border-primary-200 focus:border-primary-400 focus:outline-none bg-white"
            disabled={disabled || isSending}
          />
        )}

        {/* Quick Templates */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-default-600 self-center">
            Quick templates:
          </span>
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            className="cursor-pointer hover:bg-primary-200"
            onClick={() => insertTemplate('greeting')}
          >
            Greeting
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="success"
            className="cursor-pointer hover:bg-success-200"
            onClick={() => insertTemplate('approval')}
          >
            Approval
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="warning"
            className="cursor-pointer hover:bg-warning-200"
            onClick={() => insertTemplate('clarification')}
          >
            Clarification
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            className="cursor-pointer hover:bg-secondary-200"
            onClick={() => insertTemplate('ready')}
          >
            Ready for Pickup
          </Chip>
        </div>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          minRows={4}
          maxRows={12}
          disabled={disabled || isSending}
          className="w-full"
          classNames={{
            input: 'text-base',
            inputWrapper: 'bg-white border-2 border-primary-200 focus-within:border-primary-400',
          }}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-default-500">
            {message.length} characters • Press{' '}
            <kbd className="px-1 py-0.5 text-xs bg-default-200 rounded">Ctrl+Enter</kbd> to
            send
          </p>
          <div className="flex gap-2">
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setMessage('');
                setSubject('');
              }}
              disabled={disabled || isSending || (!message && !subject)}
            >
              Clear
            </Button>
            <Button
              color="primary"
              variant="solid"
              onPress={handleSend}
              isLoading={isSending}
              disabled={disabled || !message.trim()}
              className="font-semibold"
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default MessageComposer;
