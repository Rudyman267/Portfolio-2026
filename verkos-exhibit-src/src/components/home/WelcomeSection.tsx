/**
 * Welcome Section Component
 *
 * Professional landing page with FlytBase design system.
 * Features development guides, integration cards, and quick start section.
 * Uses FontAwesome icons and FlytBase design tokens only.
 */

import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { assetUrl } from '@/exhibit/asset-url';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  category: 'guide' | 'integration';
}

const WelcomeSection: React.FC = () => {
  const navigate = useNavigate();

  const features: FeatureCard[] = [
    // Development Guides
    {
      icon: 'fa-solid fa-route',
      title: 'How to Create Routes',
      description: 'File-based routing with TanStack Router',
      category: 'guide',
    },
    {
      icon: 'fa-solid fa-cube',
      title: 'How to Create Components',
      description: 'React components following FlytBase standards',
      category: 'guide',
    },
    {
      icon: 'fa-solid fa-palette',
      title: 'Design System',
      description: 'Colors, typography, and UI patterns',
      category: 'guide',
    },
    {
      icon: 'fa-solid fa-fish-fins',
      title: 'Custom Hooks',
      description: 'Best practices for React hooks',
      category: 'guide',
    },
    {
      icon: 'fa-solid fa-database',
      title: 'Zustand Store',
      description: 'State management patterns',
      category: 'guide',
    },

    // Feature Integrations
    {
      icon: 'fa-solid fa-keyboard',
      title: 'Keyboard Shortcuts',
      description: 'Global shortcut handling',
      category: 'integration',
    },
    {
      icon: 'fa-solid fa-plug',
      title: 'Socket.IO',
      description: 'Real-time communication',
      category: 'integration',
    },
    {
      icon: 'fa-solid fa-map',
      title: 'Map Library',
      description: 'Cesium 3D maps integration',
      category: 'integration',
    },
    {
      icon: 'fa-solid fa-video',
      title: 'Video Streaming',
      description: 'Live video integration',
      category: 'integration',
    },
    {
      icon: 'fa-solid fa-globe',
      title: 'API Integration',
      description: 'HTTP client setup',
      category: 'integration',
    },
  ];

  const developmentGuides = features.filter((f) => f.category === 'guide');
  const integrations = features.filter((f) => f.category === 'integration');

  return (
    <div className="w-full h-full overflow-auto bg-background">
      {/* Hero Section - Solid Background */}
      <div className="bg-background-level-1">
        {/* Content */}
        <div className="container max-w-6xl mx-auto px-6 py-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={assetUrl('/assets/flytbase-logo.svg')}
              alt="FlytBase"
              className="h-20 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="fb-h1 text-text-1 mb-4">Template App</h1>
            <p className="fb-body-1 text-text-2 mb-2">
              Production-ready React scaffold
            </p>
            <p className="fb-body-3 text-text-2">
              Authentication • Routing • State Management • UI Components
            </p>
          </div>

          {/* CTA Buttons - FlytBase Styles Only */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate({ to: '/guides' })}
              className="bg-primary-200 hover:bg-primary-states-hover text-white fb-body-2 px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-book"></i>
              <span>View Integration Guides</span>
            </button>
            <button
              onClick={() => {
                window.open(
                  'https://docs.flytbase.com',
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
              className="bg-secondary-200 hover:bg-secondary-states-hover text-white fb-body-2 px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-lines"></i>
              <span>FlytBase Docs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Development Guides Section */}
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="fb-h2 text-text-1 mb-2">Development Guides</h2>
          <p className="fb-body-3 text-text-2">
            Learn how to build features with FlytBase standards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {developmentGuides.map((feature, index) => (
            <button
              key={index}
              onClick={() => navigate({ to: '/guides' })}
              className="group p-6 rounded-lg bg-background-level-1 border border-outline-primary hover:border-primary-200/50 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-200/20 flex items-center justify-center flex-shrink-0">
                  <i className={`${feature.icon} text-primary-200 text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="fb-body-2 text-text-1 mb-1 group-hover:text-primary-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="fb-body-4 text-text-2">{feature.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 fb-body-5 text-primary-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View guide</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </div>
            </button>
          ))}
        </div>

        {/* Integrations Section */}
        <div className="mb-8">
          <h2 className="fb-h2 text-text-1 mb-2">Feature Integrations</h2>
          <p className="fb-body-3 text-text-2">
            Add advanced features to your application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((feature, index) => (
            <button
              key={index}
              onClick={() => navigate({ to: '/guides' })}
              className="group p-6 rounded-lg bg-background-level-1 border border-outline-primary hover:border-primary-200/50 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-200/20 flex items-center justify-center flex-shrink-0">
                  <i className={`${feature.icon} text-primary-200 text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="fb-body-2 text-text-1 mb-1 group-hover:text-primary-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="fb-body-4 text-text-2">{feature.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 fb-body-5 text-primary-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View guide</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Start Section - Solid Background */}
      <div className="container max-w-6xl mx-auto px-6 py-12 mb-12">
        <div className="rounded-lg bg-background-level-1 border border-outline-primary p-8">
          <h2 className="fb-h2 text-text-1 mb-6 flex items-center gap-3">
            <i className="fa-solid fa-rocket text-primary-200"></i>
            Quick Start Guide
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">1</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">Add New Routes</h3>
                  <p className="fb-body-4 text-text-2">
                    Create route files in{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      src/routes/_layout/
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">2</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">
                    Build Components
                  </h3>
                  <p className="fb-body-4 text-text-2">
                    Add components to{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      src/components/
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">3</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">
                    Add API Services
                  </h3>
                  <p className="fb-body-4 text-text-2">
                    Create services in{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      src/api/services/
                    </code>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">4</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">Manage State</h3>
                  <p className="fb-body-4 text-text-2">
                    Set up Zustand stores in{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      src/store/
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">5</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">
                    Add Integrations
                  </h3>
                  <p className="fb-body-4 text-text-2">
                    Follow guides in{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      src/integrations/
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200/20 flex items-center justify-center">
                  <span className="fb-body-5 text-primary-200">6</span>
                </div>
                <div>
                  <h3 className="fb-body-2 text-text-1 mb-1">Deploy & Scale</h3>
                  <p className="fb-body-4 text-text-2">
                    Build with{' '}
                    <code className="px-1.5 py-0.5 bg-background-level-2 rounded fb-body-6 font-mono">
                      npm run build
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container max-w-6xl mx-auto px-6 py-8 text-center border-t border-outline-primary">
        <p className="fb-body-4 text-text-2">
          Built with React 18, TypeScript, TanStack Router, and Tailwind CSS
        </p>
      </div>
    </div>
  );
};

export default WelcomeSection;
