import { ragService } from '../services/ragService';
import { testSupabaseConnection } from '../services/supabaseClient';
import { openaiService } from '../services/openai';

export interface SystemHealthCheck {
  supabase: boolean;
  openai: boolean;
  embedding: boolean;
  ragPipeline: boolean;
  errors: string[];
  timestamp: Date;
}

/**
 * Comprehensive system health check for the RAG pipeline
 */
export const performSystemHealthCheck = async (): Promise<SystemHealthCheck> => {
  const healthCheck: SystemHealthCheck = {
    supabase: false,
    openai: false,
    embedding: false,
    ragPipeline: false,
    errors: [],
    timestamp: new Date()
  };

  console.log('🏥 Starting RAG system health check...');

  // Test Supabase connection
  try {
    healthCheck.supabase = await testSupabaseConnection();
    if (healthCheck.supabase) {
      console.log('✅ Supabase connection: OK');
    } else {
      console.log('❌ Supabase connection: FAILED');
      healthCheck.errors.push('Supabase connection failed');
    }
  } catch (error) {
    console.log('❌ Supabase connection: ERROR', error);
    healthCheck.errors.push(`Supabase error: ${error}`);
  }

  // Test OpenAI basic functionality
  try {
    const testResponse = await openaiService.generateResponse('Hello, this is a test.');
    if (testResponse && testResponse.length > 0) {
      healthCheck.openai = true;
      console.log('✅ OpenAI chat: OK');
    } else {
      console.log('❌ OpenAI chat: FAILED - Empty response');
      healthCheck.errors.push('OpenAI returned empty response');
    }
  } catch (error) {
    console.log('❌ OpenAI chat: ERROR', error);
    healthCheck.errors.push(`OpenAI error: ${error}`);
  }

  // Test OpenAI embedding functionality
  try {
    const testEmbedding = await openaiService.generateEmbedding('test embedding');
    if (testEmbedding && testEmbedding.length > 0) {
      healthCheck.embedding = true;
      console.log('✅ OpenAI embedding: OK');
    } else {
      console.log('❌ OpenAI embedding: FAILED - Empty embedding');
      healthCheck.errors.push('OpenAI embedding returned empty result');
    }
  } catch (error) {
    console.log('❌ OpenAI embedding: ERROR', error);
    healthCheck.errors.push(`OpenAI embedding error: ${error}`);
  }

  // Test full RAG pipeline
  try {
    const ragResponse = await ragService.getSmartSpidyAnswer('What are effective fundraising strategies?');
    if (ragResponse && ragResponse.answer && ragResponse.answer.length > 0) {
      healthCheck.ragPipeline = true;
      console.log('✅ RAG pipeline: OK');
      console.log(`   - Confidence: ${ragResponse.confidence}`);
      console.log(`   - Sources: ${ragResponse.sources.length}`);
      console.log(`   - Processing time: ${ragResponse.processingTime}ms`);
    } else {
      console.log('❌ RAG pipeline: FAILED - Empty response');
      healthCheck.errors.push('RAG pipeline returned empty response');
    }
  } catch (error) {
    console.log('❌ RAG pipeline: ERROR', error);
    healthCheck.errors.push(`RAG pipeline error: ${error}`);
  }

  const allSystemsOk = healthCheck.supabase && healthCheck.openai && healthCheck.embedding && healthCheck.ragPipeline;
  
  console.log('\n🏥 Health check summary:');
  console.log(`   Overall status: ${allSystemsOk ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  console.log(`   Errors: ${healthCheck.errors.length}`);
  
  if (healthCheck.errors.length > 0) {
    console.log('\n🔍 Issues found:');
    healthCheck.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  return healthCheck;
};

/**
 * Test the RAG system with sample queries
 */
export const testRAGWithSampleQueries = async (): Promise<void> => {
  const sampleQueries = [
    "What are effective fundraising strategies for NGOs?",
    "How can I improve donor engagement?",
    "What are the best practices for online fundraising campaigns?",
    "How do I measure the success of a fundraising campaign?",
    "What are common mistakes in NGO fundraising?"
  ];

  console.log('🧪 Testing RAG system with sample queries...\n');

  for (const [index, query] of sampleQueries.entries()) {
    try {
      console.log(`Query ${index + 1}: "${query}"`);
      const response = await ragService.getSmartSpidyAnswer(query);
      
      console.log(`✅ Success!`);
      console.log(`   - Answer length: ${response.answer.length} characters`);
      console.log(`   - Confidence: ${response.confidence}`);
      console.log(`   - Sources: ${response.sources.length}`);
      console.log(`   - Processing time: ${response.processingTime}ms`);
      console.log(`   - Preview: ${response.answer.substring(0, 100)}...`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Failed: ${error}`);
      console.log('');
    }
  }
};

/**
 * Validate environment variables
 */
export const validateEnvironmentVariables = (): { valid: boolean; missing: string[] } => {
  const requiredEnvVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing: string[] = [];

  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  });

  const valid = missing.length === 0;

  console.log('🔧 Environment variables check:');
  if (valid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing environment variables:');
    missing.forEach(envVar => {
      console.log(`   - ${envVar}`);
    });
  }

  return { valid, missing };
};

/**
 * Get system information and configuration
 */
export const getSystemInfo = () => {
  const ragInfo = ragService.getSystemInfo();
  const envCheck = validateEnvironmentVariables();

  return {
    ragSystem: ragInfo,
    environment: {
      valid: envCheck.valid,
      missing: envCheck.missing,
      timestamp: new Date()
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    }
  };
};

// Export for console debugging
if (typeof window !== 'undefined') {
  (window as any).ragTest = {
    healthCheck: performSystemHealthCheck,
    testQueries: testRAGWithSampleQueries,
    validateEnv: validateEnvironmentVariables,
    systemInfo: getSystemInfo
  };
} 