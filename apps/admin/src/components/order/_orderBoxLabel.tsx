import { parseAsUTC } from "@/lib/utils/formatters";

import type { OrderWithUser } from "./types";

function formatDateForPrint(dateString: string): string {
  const date = parseAsUTC(dateString);
  return date
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, ".");
}

function CustomerInfoTable({
  customerName,
  phone,
  address,
  additionalInfo,
}: {
  customerName: string;
  phone: string;
  address: string;
  additionalInfo: string;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["ЗАХИАЛАГЧИЙН НЭР", "ДУГААР", "ХАЯГ", "НЭМЭЛТ МЭДЭЭЛЭЛ"].map((label) => (
            <th
              key={label}
              // eslint-disable-next-line no-restricted-syntax -- print-fidelity colors, intentionally literal
              className="bg-[#3d6b7e] text-white font-bold text-center p-3 border-2 border-[#2d5060] print:bg-gray-100 print:text-black print:border-gray-400 text-xs"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-3 border border-gray-300 text-center align-middle text-sm">
            {customerName}
          </td>
          <td className="p-3 border border-gray-300 text-center align-middle text-sm">{phone}</td>
          <td className="p-3 border border-gray-300 text-left align-middle font-bold text-sm">
            {address}
          </td>
          <td className="p-3 border border-gray-300 text-center align-middle text-sm">
            {additionalInfo}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const PRODUCT_TABLE_HEADERS = [
  "ЗУРАГ",
  "БҮТЭЭГДЭХҮҮНИЙ НЭР",
  "ТОО",
  "СОНГОЛТ",
  "ЗАХИАЛГЫН ДУГААР",
  "ОГНОО",
];

type OrderItem = NonNullable<OrderWithUser["order_items"]>[number];

function resolveItemImage(item: OrderItem) {
  const images = item.products?.product_images;
  return images?.find((img) => img.is_primary) || images?.[0];
}

function ProductRow({
  item,
  isFirst,
  rowSpan,
  orderNumber,
  orderDate,
}: {
  item: OrderItem;
  isFirst: boolean;
  rowSpan: number;
  orderNumber: string;
  orderDate: string;
}) {
  const image = resolveItemImage(item);
  return (
    <tr>
      <td className="p-3 border border-gray-300 text-center align-middle">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={item.products?.name ?? "Бүтээгдэхүүн"}
            className="w-16 h-16 object-contain mx-auto print:w-12 print:h-12"
          />
        ) : (
          "-"
        )}
      </td>
      <td className="p-3 border border-gray-300 text-center align-middle text-sm">
        {item.products?.name || "-"}
      </td>
      <td className="p-3 border border-gray-300 text-center align-middle text-sm">
        {item.quantity}
      </td>
      <td className="p-3 border border-gray-300 text-center align-middle text-sm">
        {item.variant_name || "-"}
      </td>
      {isFirst && (
        <>
          <td
            rowSpan={rowSpan}
            className="p-3 border border-gray-300 text-center align-middle text-sm"
          >
            {orderNumber}
          </td>
          <td
            rowSpan={rowSpan}
            className="p-3 border border-gray-300 text-center align-middle text-sm"
          >
            {orderDate}
          </td>
        </>
      )}
    </tr>
  );
}

function ProductTable({
  items,
  orderNumber,
  orderDate,
}: {
  items: NonNullable<OrderWithUser["order_items"]>;
  orderNumber: string;
  orderDate: string;
}) {
  return (
    <table className="w-full border-collapse mb-6">
      <thead>
        <tr>
          {PRODUCT_TABLE_HEADERS.map((label) => (
            <th
              key={label}
              // eslint-disable-next-line no-restricted-syntax -- print-fidelity colors, intentionally literal
              className="bg-[#3d6b7e] text-white font-bold text-center p-3 border-2 border-[#2d5060] print:bg-gray-100 print:text-black print:border-gray-400 text-xs"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <ProductRow
            key={item.id}
            item={item}
            isFirst={index === 0}
            rowSpan={items.length}
            orderNumber={orderNumber}
            orderDate={orderDate}
          />
        ))}
      </tbody>
    </table>
  );
}

export function OrderLabel({ order }: { order: OrderWithUser }) {
  const customerName =
    [order.users?.first_name, order.users?.last_name].filter(Boolean).join(" ") || "-";
  const phone = order.users?.primary_phone || "-";
  const address =
    [order.delivery_city, order.delivery_district, order.delivery_sub_district]
      .filter(Boolean)
      .join(", ") || "-";
  const additionalInfo = order.delivery_detail || order.order_number || "-";
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
  const orderDate = formatDateForPrint(order.created_at);
  const items = (order.order_items || [])
    .filter((item) => item.products?.name)
    .sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="print:break-after-page">
      <CustomerInfoTable
        customerName={customerName}
        phone={phone}
        address={address}
        additionalInfo={additionalInfo}
      />
      <ProductTable items={items} orderNumber={orderNumber} orderDate={orderDate} />
    </div>
  );
}
