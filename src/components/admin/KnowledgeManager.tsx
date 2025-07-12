import React, { useState } from 'react';
import { supabaseService } from '../../services/supabase';
import { KnowledgeImporter } from '../../utils/knowledgeImporter';
import { testSupabaseConnection, testInsertRecord } from '../../utils/supabaseTest';

interface KnowledgeEntry {
  text: string;
  category: string;
  tags: string[];
}

export const KnowledgeManager: React.FC = () => {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry>({
    text: '',
    category: '',
    tags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Store the knowledge in Supabase
      await supabaseService.storeTrainingData({
        userQuestion: knowledge.text,
        assistantAnswer: knowledge.text // For knowledge entries, we store the text as both question and answer
      });

      setMessage('Knowledge added successfully!');
      setKnowledge({
        text: '',
        category: '',
        tags: []
      });
    } catch (error) {
      setMessage('Error adding knowledge: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!knowledge.tags.includes(newTag)) {
        setKnowledge(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    setKnowledge(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleBulkImport = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await KnowledgeImporter.importFromText(bulkText, knowledge.category);
      setMessage(`Bulk import completed: ${result.success} successful, ${result.failed} failed. ${result.errors.join(', ')}`);
      setBulkText('');
    } catch (error) {
      setMessage('Error during bulk import: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleImport = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const sampleKnowledge = KnowledgeImporter.getSampleKnowledge();
      const result = await KnowledgeImporter.importBulk(sampleKnowledge);
      setMessage(`Sample import completed: ${result.success} successful, ${result.failed} failed.`);
    } catch (error) {
      setMessage('Error importing sample data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setMessage('Testing connection...');

    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        setMessage('✅ Supabase connection successful!');
      } else {
        setMessage('❌ Supabase connection failed. Check console for details.');
      }
    } catch (error) {
      setMessage('❌ Connection test error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestInsert = async () => {
    setIsLoading(true);
    setMessage('Testing insert...');

    try {
      const isInserted = await testInsertRecord();
      if (isInserted) {
        setMessage('✅ Insert test successful!');
      } else {
        setMessage('❌ Insert test failed. Check console for details.');
      }
    } catch (error) {
      setMessage('❌ Insert test error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Knowledge Manager</h2>
      
      {/* Quick Actions */}
      <div className="mb-6 flex gap-4">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
        >
          Test Connection
        </button>
        <button
          type="button"
          onClick={handleTestInsert}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
        >
          Test Insert
        </button>
        <button
          type="button"
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          {showBulkImport ? 'Hide Bulk Import' : 'Show Bulk Import'}
        </button>
        <button
          type="button"
          onClick={handleSampleImport}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          Import Sample Data
        </button>
      </div>

      {/* Bulk Import Section */}
      {showBulkImport && (
        <div className="mb-6 p-4 border border-gray-300 rounded-md">
          <h3 className="text-lg font-semibold mb-3">Bulk Import</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Items (one per line)
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Enter knowledge items, one per line..."
              />
            </div>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={isLoading || !bulkText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Importing...' : 'Import Bulk Data'}
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Knowledge Text
          </label>
          <textarea
            value={knowledge.text}
            onChange={(e) => setKnowledge(prev => ({ ...prev, text: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter knowledge content..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={knowledge.category}
            onChange={(e) => setKnowledge(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Product Information, FAQ, Policy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Press Enter to add)
          </label>
          <input
            type="text"
            onKeyDown={handleTagInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a tag and press Enter..."
          />
          {knowledge.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {knowledge.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !knowledge.text.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding Knowledge...' : 'Add Knowledge'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}; 