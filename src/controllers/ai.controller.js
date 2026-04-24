const Product = require("../models/product.model");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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
    throw new Error(errorText || "OpenAI request failed.");
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

    const draft = await callOpenAIJson({
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

    const pricing = await callOpenAIJson({
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

    const approvedProducts = await Product.find({ status: "approved" })
      .populate("category", "name")
      .sort({ rating: -1, reviewCount: -1 })
      .limit(12);

    const assistant = await callOpenAIJson({
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
            `Recently viewed: ${JSON.stringify(recentlyViewed.slice(0, 5))}\n\n` +
            `Catalog: ${JSON.stringify(approvedProducts.map(productToChatContext))}`
        }
      ],
    });

    res.status(200).json({ success: true, data: assistant });
  } catch (error) {
    next(error);
  }
};
