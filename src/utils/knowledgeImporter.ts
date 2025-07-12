import { supabaseService } from '../services/supabase';

export interface KnowledgeItem {
  text: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class KnowledgeImporter {
  /**
   * Import multiple knowledge items in bulk
   */
  static async importBulk(items: KnowledgeItem[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await supabaseService.storeTrainingData({
          userQuestion: item.text,
          assistantAnswer: item.text
          // Note: metadata is not stored since the column doesn't exist in your table
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import: "${item.text.substring(0, 50)}..." - ${(error as Error).message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Import knowledge from a text file (one item per line)
   */
  static async importFromText(text: string, category?: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const items: KnowledgeItem[] = lines.map(line => ({
      text: line,
      category: category || 'imported'
    }));

    return this.importBulk(items);
  }

  /**
   * Import FAQ-style knowledge (question-answer pairs)
   */
  static async importFAQ(faqItems: Array<{ question: string; answer: string; category?: string }>): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of faqItems) {
      try {
        await supabaseService.storeTrainingData({
          userQuestion: item.question,
          assistantAnswer: item.answer
          // Note: metadata is not stored since the column doesn't exist in your table
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`Failed to import FAQ: "${item.question.substring(0, 50)}..." - ${(error as Error).message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Generate sample knowledge for testing
   */
  static getSampleKnowledge(): KnowledgeItem[] {
    return [
      {
        text: "SmartSpidy is an AI-powered assistant that helps users with various tasks and questions.",
        category: "company_info",
        tags: ["company", "overview", "ai"]
      },
      {
        text: "Our customer support team is available 24/7 to help with any questions or issues.",
        category: "support",
        tags: ["support", "customer_service", "help"]
      },
      {
        text: "We offer multiple pricing plans: Basic ($9/month), Pro ($29/month), and Enterprise (custom pricing).",
        category: "pricing",
        tags: ["pricing", "plans", "cost"]
      },
      {
        text: "To reset your password, go to the login page and click 'Forgot Password'.",
        category: "account",
        tags: ["password", "reset", "account"]
      },
      {
        text: "Our API documentation is available at docs.smartspidy.com",
        category: "technical",
        tags: ["api", "documentation", "developers"]
      }
    ];
  }
} 