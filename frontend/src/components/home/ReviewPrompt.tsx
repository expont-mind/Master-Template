"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { parseAsUTC } from "@/lib/utils/formatters";
import { Cancel, ChevronRightProduct, StarEmpty } from "../svg";
import { ReviewModal } from "../product/ReviewModal";
import { RatingModal } from "../product/RatingModal";

interface OrderItem {
  id: string;
  product_id: string;
  products: {
    name: string;
    slug: string;
    description: string | null;
    images: string[];
  } | null;
}

interface ReviewableOrder {
  id: string;
  created_at: string;
  items: OrderItem[];
}

function formatDate(dateStr: string): string {
  return parseAsUTC(dateStr)
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, ".");
}

export function ReviewPrompt() {
  const [order, setOrder] = useState<ReviewableOrder | null>(null);
  const [reviewableItems, setReviewableItems] = useState<OrderItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);

  const fetchOrder = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch most recent delivered order
    const { data: orders } = await supabase
      .from("orders")
      .select(
        "id, created_at, order_items(id, product_id, products(name, slug, description))",
      )
      .eq("user_id", user.id)
      .eq("delivery_status", "delivered")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!orders || orders.length === 0) return;

    const rawOrder = orders[0] as unknown as {
      id: string;
      created_at: string;
      order_items: {
        id: string;
        product_id: string;
        products: {
          name: string;
          slug: string;
          description: string | null;
        } | null;
      }[];
    };

    // Check localStorage for dismissed
    const dismissKey = `review-prompt-dismissed-${rawOrder.id}`;
    if (localStorage.getItem(dismissKey)) return;

    // Fetch product images
    const productIds = rawOrder.order_items
      .map((item) => item.product_id)
      .filter(Boolean);

    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", productIds)
      .is("variant_id", null)
      .order("sort_order", { ascending: true });

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const existing = imageMap.get(img.product_id) || [];
      existing.push(img.url);
      imageMap.set(img.product_id, existing);
    }

    // Check which items have not been reviewed
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", productIds);

    const reviewedProductIds = new Set(
      (existingReviews ?? []).map((r) => r.product_id),
    );

    const items: OrderItem[] = rawOrder.order_items
      .filter((item) => !reviewedProductIds.has(item.product_id))
      .map((item) => ({
        id: item.id,
        product_id: item.product_id,
        products: item.products
          ? {
              ...item.products,
              images: imageMap.get(item.product_id) || [],
            }
          : null,
      }));

    if (items.length === 0) return;

    setOrder({
      id: rawOrder.id,
      created_at: rawOrder.created_at,
      items: rawOrder.order_items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        products: item.products
          ? {
              ...item.products,
              images: imageMap.get(item.product_id) || [],
            }
          : null,
      })),
    });
    setReviewableItems(items);
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleDismiss = () => {
    if (order) {
      localStorage.setItem(`review-prompt-dismissed-${order.id}`, "true");
    }
    setDismissed(true);
  };

  const handleCardClick = () => {
    setCurrentItemIndex(0);
    setShowReviewModal(true);
  };

  const handleReviewSkip = () => {
    setShowReviewModal(false);
    // Wait for ReviewModal scroll lock cleanup before opening RatingModal
    setTimeout(() => setShowRatingModal(true), 250);
  };

  const handleReviewSubmit = (comment: string, images: File[]) => {
    setReviewComment(comment);
    setReviewImages(images);
    setShowReviewModal(false);
    // Wait for ReviewModal scroll lock cleanup before opening RatingModal
    setTimeout(() => setShowRatingModal(true), 250);
  };

  const handleRatingSuccess = () => {
    setShowRatingModal(false);
    setReviewComment("");
    setReviewImages([]);

    // Move to next item or finish
    if (currentItemIndex < reviewableItems.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setTimeout(() => setShowReviewModal(true), 300);
    } else {
      // All items reviewed, remove prompt
      setReviewableItems([]);
    }
  };

  const handleRatingClose = () => {
    setShowRatingModal(false);
    setReviewComment("");
    setReviewImages([]);
  };

  if (dismissed || reviewableItems.length === 0 || !order) return null;

  const currentItem = reviewableItems[currentItemIndex];
  const allItems = order.items;
  const firstImage = allItems[0]?.products?.images?.[0];
  const secondImage = allItems[1]?.products?.images?.[0];
  const isSingle = allItems.length === 1;

  return (
    <>
      <div className="w-full bg-white flex justify-center">
        <div className="max-w-[1064px] w-full px-4 flex justify-center xl:px-0 py-3 md:py-6">
          <div
            className="relative flex items-center gap-4 md:gap-6 cursor-pointer"
            onClick={handleCardClick}
          >
            {/* X dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="shrink-0 p-1 cursor-pointer hover:bg-[#F8FAFC] rounded transition-colors"
              aria-label="Dismiss"
            >
              <Cancel />
            </button>

            {/* Product images */}
            <div className="shrink-0 flex flex-col gap-1 items-center justify-center">
              {isSingle ? (
                <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-[4px] border border-[#F1F5F9] bg-[#F8FAFC] overflow-hidden relative">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                      quality={75}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#E2E8F0] flex items-center justify-center">
                      <ImagePlaceholder />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px]">
                  {/* Back image (rotated) */}
                  <div className="absolute top-0 left-2 md:left-3 w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-[4px] border border-[#F1F5F9] bg-[#F8FAFC] overflow-hidden rotate-6 shadow-sm">
                    {secondImage ? (
                      <Image
                        src={secondImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                        quality={75}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E2E8F0] flex items-center justify-center">
                        <ImagePlaceholder />
                      </div>
                    )}
                  </div>
                  {/* Front image */}
                  <div className="absolute top-2 md:top-3 left-0 w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-[4px] border border-[#F1F5F9] bg-[#F8FAFC] overflow-hidden -rotate-3 shadow-sm">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                        quality={75}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E2E8F0] flex items-center justify-center">
                        <ImagePlaceholder />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarEmpty key={i} />
                ))}
              </div>
            </div>

            {/* Text content */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex flex-col">
                <p className="text-[#020617] font-normal text-sm md:text-base font-manrope">
                  <span className="font-medium">
                    {formatDate(order.created_at)}
                  </span>
                  -ийн хүргэлт
                </p>
                <p className="text-[#020617] font-normal text-sm md:text-base font-manrope">
                  <span className="font-medium">{reviewableItems.length}</span>ш
                  бүтээгдэхүүнд үнэлгээ өгөх
                </p>
              </div>
              <div className="shrink-0">
                <ChevronRightProduct />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {currentItem && (
        <>
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            onSkip={handleReviewSkip}
            onSubmitWithComment={handleReviewSubmit}
          />
          <RatingModal
            isOpen={showRatingModal}
            onClose={handleRatingClose}
            onSubmitSuccess={handleRatingSuccess}
            productId={currentItem.product_id}
            productName={currentItem.products?.name ?? "Бүтээгдэхүүн"}
            productDescription={currentItem.products?.description}
            productImage={currentItem.products?.images?.[0]}
            comment={reviewComment}
            images={reviewImages}
          />
        </>
      )}
    </>
  );
}

function ImagePlaceholder() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 3H3C1.89543 3 1 3.89543 1 5V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V5C23 3.89543 22.1046 3 21 3Z"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 15L17 9L3 21"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
