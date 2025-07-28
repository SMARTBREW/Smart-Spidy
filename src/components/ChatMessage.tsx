import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '../types';
import messageApi from '../services/message';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  type: 'user' | 'assistant';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, type }) => {
  console.log('ChatMessage rendered with:', { 
    messageId: message.id, 
    type, 
    hasInstagramAccount: !!message.instagramAccount,
    instagramUsername: message.instagramAccount?.username 
  });

  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<null | 'thumbs_up' | 'thumbs_down'>(message.feedback as 'thumbs_up' | 'thumbs_down' | null);
  const textToShow = type === 'user' ? message.content : (message.content || '');
  const handleCopy = () => {
    navigator.clipboard.writeText(textToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  const formattedContent = type === 'assistant' ? textToShow : textToShow;
  const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '';

  const handleFeedback = async (value: 'thumbs_up' | 'thumbs_down') => {
    if (feedback !== null) return; // Prevent changing feedback once set
    setFeedback(value);
    try {
      await messageApi.updateMessage(message.id, { feedback: value });
    } catch (err) {
      setFeedback(null);
      console.error('Failed to send feedback:', err);
    }
  };

  if (type === 'user') {
    // User message - boxed and positioned on the right half
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end w-full mb-2 mt-5"
      >
        <div className="w-1/2">
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-black">You</span>
              <span className="text-xs text-gray-600">{timestamp}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
                {formattedContent}
              </p>
            </div>
            <div className="flex gap-2 mt-2 justify-end">
              <button
                aria-label="Copy question"
                className="p-1 flex items-center"
                onClick={handleCopy}
              >
                <Copy size={18} />
                {copied && (
                  <span className="text-xs text-black font-semibold ml-1">Copied!</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  } else if (message.instagramAccount) {
    // Instagram account card for assistant message
    const account = message.instagramAccount;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start w-full mb-2 mt-5"
      >
        <div className="w-full">

          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">Instagram Profile</span>
            {account.hasDetailedAccess && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Full Access</span>}
            <span className="text-xs text-gray-600">{timestamp}</span>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow text-black space-y-4 relative">
            {/* AI Score Badge - now inside the card */}
            {account.aiAnalysisScore !== undefined && account.aiAnalysisScore !== null && (
              <div className="absolute top-4 right-4 px-4 py-2 rounded-full text-base font-bold shadow z-10 bg-gray-100 text-gray-800 border border-gray-300">
                <img src="/smartspidy.png" alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘" className="w-5 h-5 inline-block mr-1" /> 𝐒𝐦𝐚𝐫𝐭 𝐒𝐩𝐢𝐝𝐲 𝐒𝐜𝐨𝐫𝐞: {account.aiAnalysisScore}/100
              </div>
            )}

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700">
                {account.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold text-black">@{account.username}</div>
                  {account.isVerified && <span className="text-gray-500">✓</span>}
                </div>
                {account.name && <div className="text-lg text-gray-700">{account.name}</div>}
                {account.accountType && <div className="text-sm text-gray-500">{account.accountType} Account</div>}
              </div>
            </div>

            {/* Biography */}
            {account.biography && (
              <div className="text-sm italic border-l-2 border-gray-200 pl-3 text-gray-700">
                "{account.biography}"
              </div>
            )}

            {/* Website */}
            {account.website && (
              <div className="text-sm">
                <span className="font-semibold">🌐 Website:</span> 
                <a href={account.website} target="_blank" rel="noopener noreferrer" className="underline ml-1 text-gray-800 hover:text-black">
                  {account.website}
                </a>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 bg-gray-100 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-black">{account.followersCount?.toLocaleString() || 'N/A'}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black">{account.followsCount?.toLocaleString() || 'N/A'}</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black">{account.mediaCount?.toLocaleString() || 'N/A'}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
            </div>

            {/* Engagement Stats */}
            {(account.totalLikesCount !== null || account.totalCommentsCount !== null || account.lastPostDate) && (
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2 text-gray-700">Engagement & Activity</div>
                <div className="grid grid-cols-2 gap-4">
                  {account.totalLikesCount !== null && account.totalLikesCount !== undefined && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-black">{account.totalLikesCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total Likes</div>
                    </div>
                  )}
                  {account.totalCommentsCount !== null && account.totalCommentsCount !== undefined && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-black">{account.totalCommentsCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total Comments</div>
                    </div>
                  )}
                </div>
                {account.lastPostDate && (
                  <div className="mt-2 text-center">
                    <div className="text-sm text-gray-700">Last Post: <span className="font-semibold">
                      {new Date(account.lastPostDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span></div>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Section */}
            {account.aiAnalysisDetails && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <img src="/smartspidy.png" alt="𝐒𝐌𝐀𝐑𝐓 𝐒𝐏𝐈𝐃𝐘" className="w-5 h-5 inline-block mr-1" /> 𝐒𝐦𝐚𝐫𝐭 𝐒𝐩𝐢𝐝𝐲 𝐀𝐧𝐚𝐥𝐲𝐬𝐢𝐬
                  {account.aiAnalysisDetails.category && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {account.aiAnalysisDetails.category}
                    </span>
                  )}
                </div>
                
                {account.aiAnalysisDetails.analysis && (
                  <div className="text-xs opacity-90 italic">
                    "{account.aiAnalysisDetails.analysis}"
                  </div>
                )}
              </div>
            )}

            {/* Activity Status */}
            {account.lastPostDate && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">Account Activity</div>
                <div className="text-center">
                  {(() => {
                    const lastPostDate = new Date(account.lastPostDate);
                    const now = new Date();
                    const daysDiff = Math.floor((now.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff <= 7) {
                      return (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-green-200 font-semibold">Active</span>
                          <span className="text-xs opacity-75">({daysDiff} days ago)</span>
                        </div>
                      );
                    } else if (daysDiff <= 30) {
                      return (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <span className="text-yellow-200 font-semibold">Partially Active</span>
                          <span className="text-xs opacity-75">({daysDiff} days ago)</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-red-200 font-semibold">Inactive</span>
                          <span className="text-xs opacity-75">({daysDiff} days ago)</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Insights Section (for managed accounts) */}
            {account.insights && Object.keys(account.insights).length > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">📊 Recent Insights</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {account.insights.profileViews !== undefined && (
                    <div>Profile Views: <span className="font-semibold">{account.insights.profileViews.toLocaleString()}</span></div>
                  )}
                  {account.insights.websiteClicks !== undefined && (
                    <div>Website Clicks: <span className="font-semibold">{account.insights.websiteClicks.toLocaleString()}</span></div>
                  )}
                  {account.insights.impressions !== undefined && (
                    <div>Impressions: <span className="font-semibold">{account.insights.impressions.toLocaleString()}</span></div>
                  )}
                  {account.insights.reach !== undefined && (
                    <div>Reach: <span className="font-semibold">{account.insights.reach.toLocaleString()}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Media Preview - REMOVED as per user request
            {account.media && account.media.length > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">📸 Recent Posts ({account.media.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {account.media.slice(0, 6).map((media, index) => (
                    <div key={media.id} className="aspect-square bg-white/20 rounded text-xs p-2 flex flex-col justify-between">
                      <div className="text-center font-medium">{media.mediaType}</div>
                      <div className="space-y-1">
                        {media.likeCount !== undefined && (
                          <div>❤️ {media.likeCount.toLocaleString()}</div>
                        )}
                        {media.commentsCount !== undefined && (
                          <div>💬 {media.commentsCount.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {account.media.length > 6 && (
                  <div className="text-xs opacity-75 text-center mt-2">
                    +{account.media.length - 6} more posts
                  </div>
                )}
              </div>
            )}
            */}

            {/* Audience Demographics */}
            {(account.audienceGenderAge || account.audienceCountry) && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">👥 Audience Insights</div>
                <div className="text-xs opacity-90">
                  Detailed audience demographics available in full data
                </div>
              </div>
            )}

            {/* Mentions */}
            {account.mentions && account.mentions.length > 0 && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-semibold mb-2">🏷️ Recent Mentions ({account.mentions.length})</div>
                <div className="text-xs opacity-90">
                  Account has been mentioned in {account.mentions.length} recent posts
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs opacity-75 text-center border-t border-white/20 pt-2">
              {account.fetchedAt && `Fetched: ${new Date(account.fetchedAt).toLocaleString()}`}
              {!account.hasDetailedAccess && (
                <div className="mt-1">Limited data - full insights available for managed accounts only</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-2 items-center">
            <button
              aria-label="Copy Instagram data"
              className="p-1 flex items-center"
              onClick={handleCopy}
            >
              <Copy size={18} />
              {copied && (
                <span className="text-xs text-black font-semibold ml-1">Copied!</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  } else {
    // Assistant message - no box, starts from left edge, extends to full width
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start w-full mb-2 mt-5"
      >
        <div className="w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">Smart Spidy</span>
            <span className="text-xs text-gray-600">{timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-black leading-relaxed whitespace-pre-wrap break-words">
              {formattedContent}
            </p>
          </div>
          <div className="flex gap-2 mt-2 items-center">
            <button
              aria-label="Copy message"
              className="p-1 flex items-center"
              onClick={handleCopy}
            >
              <Copy size={18} />
              {copied && (
                <span className="text-xs text-black font-semibold ml-1">Copied!</span>
              )}
            </button>
            {/* Feedback icons for Spidy answer */}
            {feedback === null && (
              <>
                <button
                  aria-label="Thumbs up"
                  className="p-1 flex items-center text-black hover:text-gray-600"
                  onClick={() => handleFeedback('thumbs_up')}
                >
                  <ThumbsUp size={18} stroke="black" fill="none" />
                </button>
                <button
                  aria-label="Thumbs down"
                  className="p-1 flex items-center text-black hover:text-gray-600"
                  onClick={() => handleFeedback('thumbs_down')}
                >
                  <ThumbsDown size={18} stroke="black" fill="none" />
                </button>
              </>
            )}
            {feedback === 'thumbs_up' && (
              <ThumbsUp size={18} stroke="black" fill="#4B5563" />
            )}
            {feedback === 'thumbs_down' && (
              <ThumbsDown size={18} stroke="black" fill="#4B5563" />
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};