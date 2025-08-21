import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import messageApi from '../services/message';

interface DMEnhancementButtonsProps {
  messageId: string;
  onEnhancementGenerated?: (variations: {
    small: string;
    medium: string;
    large: string;
  }) => void;
  activityTracker?: any;
}

export const DMEnhancementButtons: React.FC<DMEnhancementButtonsProps> = ({
  messageId,
  onEnhancementGenerated,
  activityTracker
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [variations, setVariations] = useState<{
    small: string;
    medium: string;
    large: string;
  } | null>(null);
  const [copiedVariation, setCopiedVariation] = useState<string | null>(null);

  const handleEnhance = async () => {
    setIsLoading(true);
    
    // Trigger activity when user clicks enhance
    if (activityTracker && activityTracker.triggerActivity) {
      activityTracker.triggerActivity();
    }

    try {
      const response = await messageApi.generateEnhancedDM(messageId);
      setVariations(response.variations);
      setShowVariations(true);
      
      // Call the callback if provided
      if (onEnhancementGenerated) {
        onEnhancementGenerated(response.variations);
      }
    } catch (error) {
      console.error('Failed to generate enhanced DM:', error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyVariation = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariation(type);
      setTimeout(() => setCopiedVariation(null), 2000);
      
      // Trigger activity when user copies
      if (activityTracker && activityTracker.triggerActivity) {
        activityTracker.triggerActivity();
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleToggleVariations = () => {
    setShowVariations(!showVariations);
    
    // Trigger activity when user toggles
    if (activityTracker && activityTracker.triggerActivity) {
      activityTracker.triggerActivity();
    }
  };

  return (
    <div className="mt-3">
      {!showVariations ? (
        <button
          onClick={handleEnhance}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {isLoading ? 'Enhancing...' : 'Enhance DM'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVariations}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Sparkles size={16} />
              Hide Variations
            </button>
          </div>
          
          {variations && (
            <div className="space-y-3">
              {/* Small (150 words) */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-green-800">Small (150 words)</h4>
                  <button
                    onClick={() => handleCopyVariation(variations.small, 'small')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                  >
                    {copiedVariation === 'small' ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {variations.small}
                </div>
              </div>

              {/* Medium (200 words) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-yellow-800">Medium (200 words)</h4>
                  <button
                    onClick={() => handleCopyVariation(variations.medium, 'medium')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
                  >
                    {copiedVariation === 'medium' ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {variations.medium}
                </div>
              </div>

              {/* Large (250 words) */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-800">Large (250 words)</h4>
                  <button
                    onClick={() => handleCopyVariation(variations.large, 'large')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
                  >
                    {copiedVariation === 'large' ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {variations.large}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
