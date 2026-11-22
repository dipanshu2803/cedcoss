/**
 * Computes comprehensive store insights, dashboard metrics,
 * top praises, top complaints, and product breakdown
 */
export function generateInsights(analyzedRows) {
  const validAnalyzed = analyzedRows.filter(
    r => r.analysis && r.status !== 'analysis_failed' && !r.is_empty
  );

  const totalAnalyzed = validAnalyzed.length;

  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let needsReplyCount = 0;

  // Topic frequency maps
  const complaintTopics = {};
  const praiseTopics = {};
  const topicExamples = {
    complaints: {},
    praises: {}
  };

  // Product breakdown map
  const productStats = {};

  // Rating agreement calculation (Bonus)
  let ratingAgreements = 0;
  let ratingComparableCount = 0;

  for (const row of validAnalyzed) {
    const analysis = row.analysis;
    const prod = row.product || 'General';

    // Initialize product stats
    if (!productStats[prod]) {
      productStats[prod] = {
        product: prod,
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        needs_reply: 0,
        topics: {}
      };
    }
    productStats[prod].total++;

    // Sentiment tally
    if (analysis.sentiment === 'positive') {
      positiveCount++;
      productStats[prod].positive++;
    } else if (analysis.sentiment === 'negative') {
      negativeCount++;
      productStats[prod].negative++;
    } else {
      neutralCount++;
      productStats[prod].neutral++;
    }

    // Needs reply tally
    if (analysis.needs_reply) {
      needsReplyCount++;
      productStats[prod].needs_reply++;
    }

    // Topics analysis
    if (Array.isArray(analysis.topics)) {
      for (const topic of analysis.topics) {
        // Track per product
        productStats[prod].topics[topic] = (productStats[prod].topics[topic] || 0) + 1;

        if (analysis.sentiment === 'negative' || (analysis.sentiment === 'neutral' && analysis.needs_reply)) {
          complaintTopics[topic] = (complaintTopics[topic] || 0) + 1;
          if (!topicExamples.complaints[topic]) {
            topicExamples.complaints[topic] = [];
          }
          topicExamples.complaints[topic].push({
            summary: analysis.summary,
            product: prod,
            review_id: row.review_id
          });
        } else if (analysis.sentiment === 'positive') {
          praiseTopics[topic] = (praiseTopics[topic] || 0) + 1;
          if (!topicExamples.praises[topic]) {
            topicExamples.praises[topic] = [];
          }
          topicExamples.praises[topic].push({
            summary: analysis.summary,
            product: prod,
            review_id: row.review_id
          });
        }
      }
    }

    // Rating vs sentiment agreement check
    if (row.rating !== null && row.rating !== undefined) {
      ratingComparableCount++;
      const isMismatch = row.rating_mismatch && row.rating_mismatch.isMismatch;
      if (!isMismatch) {
        ratingAgreements++;
      }
    }
  }

  // Calculate percentages
  const pctPositive = totalAnalyzed > 0 ? Math.round((positiveCount / totalAnalyzed) * 100) : 0;
  const pctNeutral = totalAnalyzed > 0 ? Math.round((neutralCount / totalAnalyzed) * 100) : 0;
  const pctNegative = totalAnalyzed > 0 ? Math.round((negativeCount / totalAnalyzed) * 100) : 0;
  const agreementRate = ratingComparableCount > 0
    ? Math.round((ratingAgreements / ratingComparableCount) * 100)
    : 100;

  // Build Top 3 Complaints
  const topicTitles = {
    quality: 'Product Quality & Defects',
    delivery: 'Delivery Delays & Transit Issues',
    size_fit: 'Sizing & Fit Inaccuracies',
    price: 'Pricing & Perceived Value',
    packaging: 'Damaged or Torn Packaging',
    support: 'Customer Support Responsiveness',
    other: 'General Customer Feedback'
  };

  const sortedComplaintTopics = Object.entries(complaintTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => {
      const examples = topicExamples.complaints[topic] || [];
      const primaryExample = examples[0] ? examples[0].summary : 'Issues reported by customers';
      return {
        topic,
        title: topicTitles[topic] || topic,
        count,
        summary: primaryExample,
        sampleCount: examples.length
      };
    });

  // Build Top 3 Praises
  const sortedPraiseTopics = Object.entries(praiseTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => {
      const examples = topicExamples.praises[topic] || [];
      const primaryExample = examples[0] ? examples[0].summary : 'Positive customer feedback';
      return {
        topic,
        title: topicTitles[topic] || topic,
        count,
        summary: primaryExample,
        sampleCount: examples.length
      };
    });

  // Format products list
  const products = Object.values(productStats).map(p => ({
    ...p,
    pct_positive: p.total > 0 ? Math.round((p.positive / p.total) * 100) : 0,
    pct_negative: p.total > 0 ? Math.round((p.negative / p.total) * 100) : 0
  }));

  return {
    summary: {
      total_reviews_analyzed: totalAnalyzed,
      positive_count: positiveCount,
      neutral_count: neutralCount,
      negative_count: negativeCount,
      pct_positive: pctPositive,
      pct_neutral: pctNeutral,
      pct_negative: pctNegative,
      needs_reply_count: needsReplyCount,
      rating_agreement_pct: agreementRate,
      rating_comparable_count: ratingComparableCount
    },
    top_complaints: sortedComplaintTopics,
    top_praises: sortedPraiseTopics,
    products
  };
}
