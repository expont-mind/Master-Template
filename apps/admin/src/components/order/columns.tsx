"use client";

import {
  customerColumn,
  dateColumn,
  deliveryColumn,
  orderNumberColumn,
  paymentMethodColumn,
  paymentStatusColumn,
  phoneColumn,
  printStatusColumn,
  productsColumn,
  selectColumn,
  totalColumn,
} from "./_columns/_orderColumnDefs";

import type { OrderWithUser } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export type { OrderTableMeta } from "./types";

export function getColumns(): ColumnDef<OrderWithUser>[] {
  return [
    selectColumn(),
    orderNumberColumn(),
    productsColumn(),
    paymentStatusColumn(),
    customerColumn(),
    paymentMethodColumn(),
    phoneColumn(),
    dateColumn(),
    totalColumn(),
    deliveryColumn(),
    printStatusColumn(),
  ];
}
