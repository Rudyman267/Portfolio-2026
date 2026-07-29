/**
 * Integration Guides Viewer Component
 *
 * Displays integration guides with markdown rendering and syntax highlighting.
 * Uses FlytBase design system with FontAwesome icons.
 */

import React, { useState, useEffect } from 'react';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from '@ui/fb-components';
import { useNavigate } from '@tanstack/react-router';

// Import integration guide URLs
import keyboardGuideUrl from '../../integrations/keyboard-integration.md?url';
import socketGuideUrl from '../../integrations/socket-integration.md?url';
import mapGuideUrl from '../../integrations/map-integration.md?url';
import videoGuideUrl from '../../integrations/video-streaming-integration.md?url';
import stateGuideUrl from '../../integrations/state-management-integration.md?url';
import apiGuideUrl from '../../integrations/api-integration.md?url';
import routingGuideUrl from '../../integrations/routing-guide.md?url';
import componentsGuideUrl from '../../integrations/components-guide.md?url';
import designSystemGuideUrl from '../../integrations/design-system-guide.md?url';
import hooksGuideUrl from '../../integrations/hooks-guide.md?url';
import zustandGuideUrl from '../../integrations/zustand-store-guide.md?url';

interface Guide {
  id: string;
  name: string;
  icon: string;
  url: string;
  description: string;
  category: 'integration' | 'guide';
}

const GUIDES: Guide[] = [
  // Development Guides
  {
    id: 'routing',
    name: 'How to Create Routes',
    icon: 'fa-solid fa-route',
    url: routingGuideUrl,
    description: 'File-based routing with TanStack Router',
    category: 'guide',
  },
  {
    id: 'components',
    name: 'How to Create Components',
    icon: 'fa-solid fa-cube',
    url: componentsGuideUrl,
    description: 'React components following FlytBase standards',
    category: 'guide',
  },
  {
    id: 'design-system',
    name: 'Design System',
    icon: 'fa-solid fa-palette',
    url: designSystemGuideUrl,
    description: 'Colors, typography, and UI patterns',
    category: 'guide',
  },
  {
    id: 'hooks',
    name: 'Custom Hooks Patterns',
    icon: 'fa-solid fa-fish-fins',
    url: hooksGuideUrl,
    description: 'Best practices for React hooks',
    category: 'guide',
  },
  {
    id: 'zustand',
    name: 'Zustand Store',
    icon: 'fa-solid fa-database',
    url: zustandGuideUrl,
    description: 'State management with Zustand',
    category: 'guide',
  },

  // Feature Integrations
  {
    id: 'keyboard',
    name: 'Keyboard Shortcuts',
    icon: 'fa-solid fa-keyboard',
    url: keyboardGuideUrl,
    description: 'Global keyboard shortcut handling',
    category: 'integration',
  },
  {
    id: 'socket',
    name: 'Socket.IO',
    icon: 'fa-solid fa-plug',
    url: socketGuideUrl,
    description: 'Real-time WebSocket communication',
    category: 'integration',
  },
  {
    id: 'map',
    name: 'Map Library',
    icon: 'fa-solid fa-map',
    url: mapGuideUrl,
    description: 'Integrate Cesium 3D maps',
    category: 'integration',
  },
  {
    id: 'video',
    name: 'Video Streaming',
    icon: 'fa-solid fa-video',
    url: videoGuideUrl,
    description: 'Live video streaming integration',
    category: 'integration',
  },
  {
    id: 'state',
    name: 'State Management',
    icon: 'fa-solid fa-box',
    url: stateGuideUrl,
    description: 'Alternative state management patterns',
    category: 'integration',
  },
  {
    id: 'api',
    name: 'API Integration',
    icon: 'fa-solid fa-globe',
    url: apiGuideUrl,
    description: 'API services and HTTP client setup',
    category: 'integration',
  },
];

const IntegrationGuidesViewer: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGuideId, setSelectedGuideId] = useState<string>('routing');
  const [guideContent, setGuideContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedGuide = GUIDES.find((g) => g.id === selectedGuideId);

  // Fetch guide content
  useEffect(() => {
    const fetchGuide = async () => {
      if (!selectedGuide) return;

      setIsLoading(true);
      try {
        const response = await fetch(selectedGuide.url);
        const text = await response.text();
        setGuideContent(text);
      } catch (error) {
        console.error('Failed to load guide:', error);
        setGuideContent('# Error\nFailed to load integration guide.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [selectedGuide]);

  // Simple markdown-to-HTML converter
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <div
              key={`code-${index}`}
              className="my-4 rounded-lg bg-background-level-2 border border-outline-primary overflow-x-auto"
            >
              <div className="px-4 py-2 bg-background-level-3 border-b border-outline-secondary fb-body-6 text-text-2">
                {codeBlockLanguage || 'code'}
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code className="text-text-1 font-mono">
                  {codeBlockContent.join('\n')}
                </code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start code block
          codeBlockLanguage = line.substring(3).trim();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="fb-h1 text-text-1 mt-8 mb-4 first:mt-0">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="fb-h2 text-text-1 mt-6 mb-3">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="fb-h3 text-text-1 mt-4 mb-2">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="fb-h4 text-text-1 mt-3 mb-2">
            {line.substring(5)}
          </h4>
        );
      }
      // Inline code
      else if (line.includes('`')) {
        const parts = line.split('`');
        elements.push(
          <p key={index} className="fb-body-3 text-text-2 my-2 leading-relaxed">
            {parts.map((part, i) =>
              i % 2 === 0 ? (
                part
              ) : (
                <code
                  key={i}
                  className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-4 font-mono text-text-1"
                >
                  {part}
                </code>
              )
            )}
          </p>
        );
      }
      // Bold text
      else if (line.includes('**')) {
        const parts = line.split('**');
        elements.push(
          <p key={index} className="fb-body-3 text-text-2 my-2 leading-relaxed">
            {parts.map((part, i) =>
              i % 2 === 0 ? (
                part
              ) : (
                <strong key={i} className="text-text-1 font-semibold">
                  {part}
                </strong>
              )
            )}
          </p>
        );
      }
      // List items
      else if (line.trim().startsWith('- ')) {
        elements.push(
          <li
            key={index}
            className="fb-body-3 text-text-2 ml-6 my-1 leading-relaxed"
          >
            {line.trim().substring(2)}
          </li>
        );
      }
      // Empty line
      else if (line.trim() === '') {
        elements.push(<div key={index} className="h-2" />);
      }
      // Regular paragraph
      else {
        elements.push(
          <p key={index} className="fb-body-3 text-text-2 my-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  // Prepare grouped options for FlytBase Select
  const developmentGuides = GUIDES.filter((g) => g.category === 'guide');
  const integrationGuides = GUIDES.filter((g) => g.category === 'integration');

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header - Solid Background */}
      <div className="border-b border-outline-primary bg-background-level-1">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/' })}
                className="hover:bg-surface px-3 py-2 rounded-lg transition-colors fb-body-3 text-text-1 flex items-center gap-2"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-outline-primary" />
              <h1 className="fb-h3 text-text-1">Integration Guides</h1>
            </div>

            {/* Guide Selector - FlytBase Select Component */}
            <SelectRoot
              value={selectedGuideId}
              onValueChange={setSelectedGuideId}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a guide" />
              </SelectTrigger>
              <SelectContent>
                {/* Development Guides Group */}
                <SelectGroup>
                  <SelectLabel>Development Guides</SelectLabel>
                  {developmentGuides.map((guide) => (
                    <SelectItem
                      key={guide.id}
                      value={guide.id}
                      icon={
                        <i className={`${guide.icon} text-primary-200`}></i>
                      }
                    >
                      {guide.name}
                    </SelectItem>
                  ))}
                </SelectGroup>

                <SelectSeparator />

                {/* Feature Integrations Group */}
                <SelectGroup>
                  <SelectLabel>Feature Integrations</SelectLabel>
                  {integrationGuides.map((guide) => (
                    <SelectItem
                      key={guide.id}
                      value={guide.id}
                      icon={
                        <i className={`${guide.icon} text-primary-200`}></i>
                      }
                    >
                      {guide.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </SelectRoot>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl mx-auto px-6 py-8">
          {/* Guide Info Card - Solid Background */}
          {selectedGuide && (
            <div className="mb-8 p-6 rounded-lg bg-background-level-1 border border-outline-primary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-200/20 flex items-center justify-center">
                  <i
                    className={`${selectedGuide.icon} text-primary-200 text-2xl`}
                  ></i>
                </div>
                <div className="flex-1">
                  <h2 className="fb-h2 text-text-1 mb-2">
                    {selectedGuide.name}
                  </h2>
                  <p className="fb-body-3 text-text-2">
                    {selectedGuide.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guide Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-primary-200 text-2xl"></i>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(guideContent)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationGuidesViewer;
