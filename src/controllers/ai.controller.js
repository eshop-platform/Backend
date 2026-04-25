const Product = require("../models/product.model");
const { isDbReady } = require("../config/db");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "into", "your", "have", "has",
  "are", "was", "were", "will", "about", "would", "could", "should", "their", "them",
  "than", "then", "there", "here", "just", "very", "more", "most", "less", "much",
  "into", "onto", "over", "under", "after", "before", "while", "where", "when"
]);
const COMMON_COLORS = ["Black", "White", "Gray", "Blue", "Red", "Green", "Brown", "Beige", "Silver", "Gold", "Pink", "Purple"];
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Standard"];
const CATEGORY_PRICE_GUIDE = {
  Apparel: 1200,
  Accessories: 900,
  Footwear: 2200,
  Gear: 1800,
  Home: 1600,
  Tech: 3200,
  Audio: 2800,
  Beauty: 700,
  Sports: 2100,
  Furniture: 5200,
  Books: 450
};

const extractText = (payload) => {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
};

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const tokenize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const titleCase = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const parseOpenAIError = (errorText) => {
  const parsed = safeJsonParse(errorText);
  const apiError = parsed?.error;

  if (!apiError) {
    return {
      message: errorText || "OpenAI request failed.",
      code: "openai_request_failed"
    };
  }

  return {
    message: apiError.message || "OpenAI request failed.",
    code: apiError.code || apiError.type || "openai_request_failed"
  };
};

const inferCategory = (category, productTitle, description) => {
  if (String(category || "").trim()) {
    return titleCase(category);
  }

  const haystack = `${productTitle} ${description}`.toLowerCase();
  if (/(shoe|sneaker|boot|sandal|loafer|heel)/.test(haystack)) return "Footwear";
  if (/(bag|belt|watch|wallet|ring|bracelet|necklace)/.test(haystack)) return "Accessories";
  if (/(headphone|speaker|mouse|keyboard|charger|phone|laptop|tablet)/.test(haystack)) return "Tech";
  if (/(chair|table|sofa|desk|shelf|lamp)/.test(haystack)) return "Furniture";
  if (/(book|novel|guide|paperback|hardcover)/.test(haystack)) return "Books";
  if (/(shirt|pant|jacket|dress|hoodie|coat|tee|skirt)/.test(haystack)) return "Apparel";
  return "Accessories";
};

const detectValues = (text, candidates) => {
  const haystack = String(text || "").toLowerCase();
  return candidates.filter((candidate) => haystack.includes(candidate.toLowerCase()));
};

const buildLocalDraft = ({ productTitle, category, brandName, currentDescription, currentPrice, imageUrl }) => {
  const resolvedCategory = inferCategory(category, productTitle, currentDescription);
  const resolvedTitle = String(productTitle || "").trim() || `${brandName ? `${titleCase(brandName)} ` : ""}${resolvedCategory} Essential`;
  const sourceText = [resolvedTitle, resolvedCategory, brandName, currentDescription].filter(Boolean).join(" ");
  const tags = unique(tokenize(sourceText)).slice(0, 6).map(titleCase);
  const colors = detectValues(sourceText, COMMON_COLORS);
  const sizes = detectValues(sourceText, COMMON_SIZES);
  const suggestedBase = CATEGORY_PRICE_GUIDE[resolvedCategory] || 1500;
  const numericPrice = Number(currentPrice);
  const suggestedPrice = Number.isFinite(numericPrice) && numericPrice > 0
    ? numericPrice
    : suggestedBase;

  const description = String(currentDescription || "").trim() || [
    `${resolvedTitle} is positioned as a ${resolvedCategory.toLowerCase()} item for everyday use.`,
    brandName ? `${titleCase(brandName)} gives it a more branded storefront feel.` : "Its details are kept versatile so the listing stays broadly accurate.",
    "Highlight the core use case, comfort, finish, and who it is best suited for before publishing."
  ].join(" ");

  return {
    productTitle: resolvedTitle,
    category: resolvedCategory,
    description,
    tags,
    colors: colors.length ? colors : ["Standard"],
    sizes: sizes.length ? sizes : ["Standard"],
    aiSummary: "A local fallback draft was generated because the AI provider is currently unavailable.",
    imageInsights: imageUrl ? "Image uploaded successfully, but visual analysis is temporarily unavailable in fallback mode." : "No image analysis was available for this draft.",
    suggestedPrice
  };
};

const buildLocalPricing = ({ productTitle, category, description, stock, currentPrice, brandName }) => {
  const resolvedCategory = inferCategory(category, productTitle, description);
  const guidePrice = CATEGORY_PRICE_GUIDE[resolvedCategory] || 1500;
  const numericCurrentPrice = Number(currentPrice);
  const numericStock = Number(stock);
  let suggestedPrice = Number.isFinite(numericCurrentPrice) && numericCurrentPrice > 0
    ? numericCurrentPrice
    : guidePrice;

  if (Number.isFinite(numericStock)) {
    if (numericStock <= 5) suggestedPrice *= 1.08;
    else if (numericStock >= 40) suggestedPrice *= 0.94;
  }

  if (String(brandName || "").trim()) {
    suggestedPrice *= 1.05;
  }

  suggestedPrice = Number(suggestedPrice.toFixed(2));

  return {
    suggestedPrice,
    minPrice: Number((suggestedPrice * 0.9).toFixed(2)),
    maxPrice: Number((suggestedPrice * 1.15).toFixed(2)),
    confidence: "medium",
    rationale: `Fallback pricing used category benchmarks for ${resolvedCategory.toLowerCase()} items${brandName ? ` and a slight brand premium for ${brandName}` : ""}.`,
    pricingSignals: unique([
      resolvedCategory,
      Number.isFinite(numericStock) ? (numericStock <= 5 ? "low stock" : numericStock >= 40 ? "high stock" : "balanced stock") : "",
      Number.isFinite(numericCurrentPrice) && numericCurrentPrice > 0 ? "current price anchor" : "category benchmark"
    ])
  };
};

const buildLocalChatReply = ({ message, cartItems, wishlistItems, recentlyViewed, approvedProducts }) => {
  const signalProducts = [...recentlyViewed, ...wishlistItems, ...cartItems];
  const keywordTokens = tokenize(message);
  const matchingCatalog = approvedProducts.filter((product) => {
    const searchable = `${product.name} ${product.description} ${product.category?.name || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
    return keywordTokens.some((token) => searchable.includes(token));
  });
  const productIds = unique([
    ...matchingCatalog.slice(0, 3).map((product) => String(product._id)),
    ...signalProducts.slice(0, 3).map((product) => String(product.id))
  ]).slice(0, 3);

  const preferenceHint = signalProducts[0]?.category
    ? ` Based on your recent activity, ${signalProducts[0].category.toLowerCase()} looks like a strong fit.`
    : "";

  return {
    reply: `I can still help with suggestions even though the live AI provider is unavailable right now.${preferenceHint} Start with practical, well-reviewed items and narrow by budget, category, or use case.`,
    productIds,
    followUps: [
      "Show options under my budget",
      "Recommend something highly rated",
      "Find a good gift idea"
    ]
  };
};

const callOpenAIJson = async ({ instruction, content, model = DEFAULT_MODEL }) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured on the backend.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instruction },
        {
          role: "user",
          content: content.map((c) =>
            c.type === "input_text"
              ? { type: "text", text: c.text }
              : { type: "image_url", image_url: { url: c.image_url } }
          ),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const parsedError = parseOpenAIError(errorText);
    const error = new Error(parsedError.message || "OpenAI request failed.");
    error.code = parsedError.code;
    throw error;
  }

  const payload = await response.json();
  const text = extractText(payload);
  const parsed = safeJsonParse(text);

  if (!parsed) {
    throw new Error("AI response was not valid JSON.");
  }

  return parsed;
};

const productToChatContext = (product) => ({
  id: product._id,
  name: product.name,
  category: product.category?.name || "",
  price: product.price,
  rating: product.rating,
  reviewCount: product.reviewCount,
  tags: product.tags?.slice(0, 6) ?? [],
  description: product.description,
});

exports.generateProductDraft = async (req, res, next) => {
  try {
    const { productTitle = "", category = "", brandName = "", currentDescription = "", currentPrice = "" } = req.body;
    const imageUrl = req.file?.path ?? "";

    if (!productTitle.trim() && !category.trim() && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Provide at least a title, category, or image for AI assistance.",
      });
    }

    let draft;

    try {
      draft = await callOpenAIJson({
        instruction:
          "You are helping create an ecommerce listing from product details and an image. " +
          'Return valid JSON only with keys: productTitle, category, description, tags, colors, sizes, aiSummary, imageInsights, suggestedPrice. ' +
          "Use arrays for tags/colors/sizes. suggestedPrice must be a number. " +
          "Be conservative: do not invent materials, dimensions, certifications, or medical/safety claims unless clearly provided or visible.",
        content: [
          {
            type: "input_text",
            text:
              `Current title: ${productTitle || "N/A"}\n` +
              `Category: ${category || "N/A"}\n` +
              `Brand: ${brandName || "N/A"}\n` +
              `Current description: ${currentDescription || "N/A"}\n` +
              `Current price: ${currentPrice || "N/A"}`
          },
          ...(imageUrl ? [{ type: "input_image", image_url: imageUrl }] : []),
        ],
      });
    } catch (error) {
      draft = buildLocalDraft({ productTitle, category, brandName, currentDescription, currentPrice, imageUrl });
    }

    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
};

exports.suggestDynamicPrice = async (req, res, next) => {
  try {
    const {
      productTitle = "",
      category = "",
      description = "",
      stock = "",
      currentPrice = "",
      brandName = "",
    } = req.body;

    if (!productTitle.trim() && !category.trim() && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Provide product details so pricing can be estimated.",
      });
    }

    let pricing;

    try {
      pricing = await callOpenAIJson({
        instruction:
          "You are an ecommerce pricing analyst. Return valid JSON only with keys: suggestedPrice, minPrice, maxPrice, confidence, rationale, pricingSignals. " +
          "All price fields must be numeric. pricingSignals must be an array of short strings. " +
          "Estimate a sensible retail price from the product positioning and provided details only.",
        content: [
          {
            type: "input_text",
            text:
              `Product title: ${productTitle || "N/A"}\n` +
              `Category: ${category || "N/A"}\n` +
              `Brand: ${brandName || "N/A"}\n` +
              `Description: ${description || "N/A"}\n` +
              `Stock: ${stock || "N/A"}\n` +
              `Current price: ${currentPrice || "N/A"}`
          }
        ],
      });
    } catch (error) {
      pricing = buildLocalPricing({ productTitle, category, description, stock, currentPrice, brandName });
    }

    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    next(error);
  }
};

exports.shoppingAssistantChat = async (req, res, next) => {
  try {
    const {
      message = "",
      cartItems = [],
      wishlistItems = [],
      recentlyViewed = [],
    } = req.body;

    if (!message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    let approvedProducts = [];

    if (isDbReady()) {
      approvedProducts = await Product.find({ status: "approved" })
        .populate("category", "name")
        .sort({ rating: -1, reviewCount: -1 })
        .limit(12);
    }

    let assistant;

    try {
      assistant = await callOpenAIJson({
        instruction:
          "You are a helpful ecommerce shopping assistant. Return valid JSON only with keys: reply, productIds, followUps. " +
          "reply must be concise, practical, and grounded in the catalog context. " +
          "productIds must be an array of recommended catalog product ids from the provided catalog. " +
          "followUps must be an array of 2 or 3 short suggested next questions.",
        content: [
          {
            type: "input_text",
            text:
              `Customer message: ${message}\n\n` +
              `Cart items: ${JSON.stringify(cartItems.slice(0, 5))}\n` +
              `Wishlist items: ${JSON.stringify(wishlistItems.slice(0, 5))}\n` +
              `Recently viewed: ${JSON.stringify(recentlyViewed.slice(0, 5))}\n` +
              `Database catalog available: ${approvedProducts.length > 0 ? "yes" : "no"}\n\n` +
              `Catalog: ${JSON.stringify(approvedProducts.map(productToChatContext))}`
          }
        ],
      });
    } catch (error) {
      assistant = buildLocalChatReply({ message, cartItems, wishlistItems, recentlyViewed, approvedProducts });
    }

    res.status(200).json({ success: true, data: assistant });
  } catch (error) {
    next(error);
  }
};
