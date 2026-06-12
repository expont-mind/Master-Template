"use client";

import { hasMultipleVariants, type GroupedProduct } from "./_productGrouping";

/**
 * Print-friendly table used inside the order-products print sheet. Styles
 * adapt for screen + print (gray borders, bg-removal in print). One row
 * per product, with vertically merged cells when a product has multiple
 * variants.
 */
export function ProductsPrintTable({ groups }: { groups: GroupedProduct[] }) {
  let rowNum = 0;
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {["#", "ЗУРАГ", "БҮТЭЭГДЭХҮҮНИЙ НЭР", "СОНГОЛТ", "ТОО"].map((label) => (
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
        {groups.map((group) => {
          rowNum++;
          return hasMultipleVariants(group) ? (
            <VariantRows key={group.productName} group={group} rowNum={rowNum} />
          ) : (
            <SimpleRow key={group.productName} group={group} rowNum={rowNum} />
          );
        })}
      </tbody>
    </table>
  );
}

function VariantRows({ group, rowNum }: { group: GroupedProduct; rowNum: number }) {
  return (
    <>
      {group.variants.map((v, vi) => (
        <tr key={`${group.productName}-${v.variantName}`}>
          {vi === 0 && (
            <>
              <td
                rowSpan={group.variants.length}
                className="p-2 border border-gray-300 text-center align-middle text-sm w-10"
              >
                {rowNum}
              </td>
              <td
                rowSpan={group.variants.length}
                className="p-2 border border-gray-300 text-center align-middle"
              >
                {group.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={group.imageUrl}
                    alt={group.productName}
                    className="w-12 h-12 object-contain mx-auto print:w-10 print:h-10"
                  />
                ) : (
                  "-"
                )}
              </td>
              <td
                rowSpan={group.variants.length}
                className="p-2 border border-gray-300 text-left align-middle text-sm"
              >
                {group.productName}
              </td>
            </>
          )}
          <td className="p-2 border border-gray-300 text-center align-middle text-sm">
            {v.variantName || "-"}
          </td>
          <td className="p-2 border border-gray-300 text-center align-middle text-sm font-semibold">
            {v.quantity}
          </td>
        </tr>
      ))}
    </>
  );
}

function SimpleRow({ group, rowNum }: { group: GroupedProduct; rowNum: number }) {
  return (
    <tr>
      <td className="p-2 border border-gray-300 text-center align-middle text-sm w-10">{rowNum}</td>
      <td className="p-2 border border-gray-300 text-center align-middle">
        {group.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.imageUrl}
            alt={group.productName}
            className="w-12 h-12 object-contain mx-auto print:w-10 print:h-10"
          />
        ) : (
          "-"
        )}
      </td>
      <td className="p-2 border border-gray-300 text-left align-middle text-sm">
        {group.productName}
      </td>
      <td className="p-2 border border-gray-300 text-center align-middle text-sm">-</td>
      <td className="p-2 border border-gray-300 text-center align-middle text-sm font-semibold">
        {group.totalQuantity}
      </td>
    </tr>
  );
}
